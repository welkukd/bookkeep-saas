-- Bookkeep SaaS Database Schema
-- Run with: supabase db push

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- HOUSEHOLDS / TEAMS
-- ============================================
CREATE TABLE households (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  currency TEXT DEFAULT 'USD' CHECK (currency IN ('USD', 'CAD', 'EUR', 'GBP', 'INR', 'AUD')),
  timezone TEXT DEFAULT 'UTC',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- USERS & MEMBERSHIP
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  default_household_id UUID REFERENCES households(id) ON DELETE SET NULL,
  preferences JSONB DEFAULT '{
    "theme": "system",
    "currency": "USD",
    "dateFormat": "MM/DD/YYYY",
    "notifications": true,
    "weeklyDigest": true,
    "privacyMode": "household"
  }',
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE household_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  invited_by UUID REFERENCES auth.users(id),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(household_id, user_id)
);

-- ============================================
-- ACCOUNTS (Bank, Credit Card, Cash, Investment)
-- ============================================
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('checking', 'savings', 'credit_card', 'cash', 'investment', 'loan', 'other')),
  institution TEXT, -- Bank name
  last_four TEXT, -- Last 4 digits
  currency TEXT DEFAULT 'USD',
  current_balance NUMERIC(15, 2) DEFAULT 0,
  available_balance NUMERIC(15, 2),
  credit_limit NUMERIC(15, 2), -- For credit cards
  statement_day INTEGER CHECK (statement_day BETWEEN 1 AND 31), -- For credit cards
  due_day INTEGER CHECK (due_day BETWEEN 1 AND 31), -- For credit cards
  apr NUMERIC(5, 2), -- Annual percentage rate for credit cards
  is_active BOOLEAN DEFAULT TRUE,
  is_manual BOOLEAN DEFAULT TRUE, -- True for manual entry, false for synced
  sync_provider TEXT, -- 'plaid', 'yodlee', 'manual'
  sync_data JSONB DEFAULT '{}',
  icon TEXT, -- Lucide icon name
  color TEXT, -- Hex color
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CATEGORIES (Hierarchical)
-- ============================================
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('expense', 'income', 'transfer')),
  icon TEXT, -- Lucide icon name
  color TEXT, -- Hex color
  keywords TEXT[], -- For auto-categorization
  is_system BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(household_id, name, parent_id)
);

-- ============================================
-- TRANSACTIONS
-- ============================================
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  amount NUMERIC(15, 2) NOT NULL, -- Positive for income, negative for expense
  currency TEXT DEFAULT 'USD',
  description TEXT NOT NULL,
  merchant TEXT,
  notes TEXT,
  transaction_date DATE NOT NULL,
  transaction_time TIME,
  time_of_day TEXT CHECK (time_of_day IN ('morning', 'afternoon', 'evening', 'night')),
  status TEXT DEFAULT 'posted' CHECK (status IN ('pending', 'posted', 'cancelled', 'failed')),
  type TEXT NOT NULL CHECK (type IN ('expense', 'income', 'transfer', 'refund', 'fee', 'interest')),
  
  -- Recurring
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_rule JSONB, -- RFC 5545 RRULE
  recurrence_end_date DATE,
  parent_transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  
  -- Split transactions
  is_split BOOLEAN DEFAULT FALSE,
  split_from_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  split_details JSONB DEFAULT '[]', -- [{user_id, amount, percentage}]
  
  -- Reconciliation
  is_reconciled BOOLEAN DEFAULT FALSE,
  reconciled_at TIMESTAMPTZ,
  reconciled_by UUID REFERENCES auth.users(id),
  
  -- Tags & Metadata
  tags TEXT[],
  metadata JSONB DEFAULT '{}',
  
  -- Privacy
  visibility TEXT DEFAULT 'household' CHECK (visibility IN ('private', 'household', 'shared')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for transactions
CREATE INDEX idx_transactions_household_date ON transactions(household_id, transaction_date DESC);
CREATE INDEX idx_transactions_account_date ON transactions(account_id, transaction_date DESC);
CREATE INDEX idx_transactions_category ON transactions(category_id);
CREATE INDEX idx_transactions_created_by ON transactions(created_by);
CREATE INDEX idx_transactions_recurring ON transactions(is_recurring) WHERE is_recurring = TRUE;
CREATE INDEX idx_transactions_search ON transactions USING GIN (to_tsvector('english', description || ' ' || COALESCE(merchant, '')));

-- ============================================
-- BUDGETS
-- ============================================
CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  period TEXT NOT NULL CHECK (period IN ('weekly', 'monthly', 'quarterly', 'yearly')),
  amount NUMERIC(15, 2) NOT NULL,
  spent NUMERIC(15, 2) DEFAULT 0,
  start_date DATE NOT NULL,
  end_date DATE,
  alert_threshold NUMERIC(3, 2) DEFAULT 0.8, -- Alert at 80%
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(household_id, category_id, period, start_date)
);

-- ============================================
-- GOALS (Savings, Debt Payoff, Investment)
-- ============================================
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('savings', 'debt_payoff', 'investment', 'emergency_fund', 'custom')),
  target_amount NUMERIC(15, 2) NOT NULL,
  current_amount NUMERIC(15, 2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  target_date DATE,
  linked_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  linked_category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  auto_contribute BOOLEAN DEFAULT FALSE,
  contribution_amount NUMERIC(15, 2),
  contribution_frequency TEXT CHECK (contribution_frequency IN ('weekly', 'biweekly', 'monthly')),
  icon TEXT,
  color TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CREDIT CARD TRACKING
-- ============================================
CREATE TABLE credit_card_statements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  statement_date DATE NOT NULL,
  due_date DATE NOT NULL,
  statement_balance NUMERIC(15, 2) NOT NULL,
  minimum_payment NUMERIC(15, 2) NOT NULL,
  previous_balance NUMERIC(15, 2) DEFAULT 0,
  payments_received NUMERIC(15, 2) DEFAULT 0,
  new_charges NUMERIC(15, 2) DEFAULT 0,
  fees NUMERIC(15, 2) DEFAULT 0,
  interest_charged NUMERIC(15, 2) DEFAULT 0,
  is_paid BOOLEAN DEFAULT FALSE,
  paid_amount NUMERIC(15, 2) DEFAULT 0,
  paid_date DATE,
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(account_id, statement_date)
);

-- Projected credit card bill
CREATE TABLE credit_card_projections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  projection_date DATE NOT NULL, -- The statement date this projects
  projected_balance NUMERIC(15, 2) NOT NULL,
  projected_minimum_payment NUMERIC(15, 2) NOT NULL,
  days_until_due INTEGER NOT NULL,
  confidence_score NUMERIC(3, 2) DEFAULT 0.8,
  based_on_transactions UUID[], -- Transaction IDs used for projection
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- RECURRING RULES (for subscriptions, bills)
-- ============================================
CREATE TABLE recurring_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  amount NUMERIC(15, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  description TEXT,
  merchant TEXT,
  type TEXT NOT NULL CHECK (type IN ('expense', 'income', 'transfer')),
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly')),
  day_of_month INTEGER CHECK (day_of_month BETWEEN 1 AND 31),
  day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6),
  start_date DATE NOT NULL,
  end_date DATE,
  next_occurrence DATE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  auto_create BOOLEAN DEFAULT TRUE,
  notification_days_before INTEGER DEFAULT 3,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ATTACHMENTS (Receipts, Statements)
-- ============================================
CREATE TABLE attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  public_url TEXT,
  ocr_text TEXT,
  ocr_confidence NUMERIC(3, 2),
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INSIGHTS & ANALYTICS CACHE
-- ============================================
CREATE TABLE analytics_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  snapshot_type TEXT NOT NULL CHECK (snapshot_type IN ('daily', 'weekly', 'monthly', 'yearly')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(household_id, snapshot_type, period_start)
);

-- ============================================
-- NOTIFICATIONS
-- ============================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT FALSE,
  action_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AUDIT LOG
-- ============================================
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_household ON audit_logs(household_id, created_at DESC);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_card_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_card_projections ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to check household membership
CREATE OR REPLACE FUNCTION is_household_member(household_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM household_members
    WHERE household_id = household_uuid
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check household role
CREATE OR REPLACE FUNCTION get_household_role(household_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  role TEXT;
BEGIN
  SELECT role INTO role
  FROM household_members
  WHERE household_id = household_uuid
  AND user_id = auth.uid();
  RETURN COALESCE(role, 'none');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Households: Members can view, owners/admins can update
CREATE POLICY "Members can view household" ON households
  FOR SELECT USING (is_household_member(id));

CREATE POLICY "Owners can update household" ON households
  FOR UPDATE USING (get_household_role(id) IN ('owner', 'admin'));

CREATE POLICY "Owners can delete household" ON households
  FOR DELETE USING (get_household_role(id) = 'owner');

-- Profiles: Users can view/update their own
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (id = auth.uid());

-- Household members: Members can view, owners/admins can manage
CREATE POLICY "Members can view members" ON household_members
  FOR SELECT USING (is_household_member(household_id));

CREATE POLICY "Admins can insert members" ON household_members
  FOR INSERT WITH CHECK (get_household_role(household_id) IN ('owner', 'admin'));

CREATE POLICY "Admins can update members" ON household_members
  FOR UPDATE USING (get_household_role(household_id) IN ('owner', 'admin'));

CREATE POLICY "Owners can delete members" ON household_members
  FOR DELETE USING (get_household_role(household_id) = 'owner');

-- Accounts: Members can view, owners/admins can manage
CREATE POLICY "Members can view accounts" ON accounts
  FOR SELECT USING (is_household_member(household_id));

CREATE POLICY "Admins can manage accounts" ON accounts
  FOR ALL USING (get_household_role(household_id) IN ('owner', 'admin'));

-- Categories: Members can view, owners/admins can manage
CREATE POLICY "Members can view categories" ON categories
  FOR SELECT USING (is_household_member(household_id));

CREATE POLICY "Admins can manage categories" ON categories
  FOR ALL USING (get_household_role(household_id) IN ('owner', 'admin'));

-- Transactions: Members can view (based on visibility), creators can manage own
CREATE POLICY "Members can view transactions" ON transactions
  FOR SELECT USING (
    is_household_member(household_id) AND
    (visibility = 'household' OR created_by = auth.uid())
  );

CREATE POLICY "Users can insert own transactions" ON transactions
  FOR INSERT WITH CHECK (
    is_household_member(household_id) AND
    created_by = auth.uid()
  );

CREATE POLICY "Users can update own transactions" ON transactions
  FOR UPDATE USING (
    is_household_member(household_id) AND
    created_by = auth.uid()
  );

CREATE POLICY "Admins can manage all transactions" ON transactions
  FOR ALL USING (get_household_role(household_id) IN ('owner', 'admin'));

-- Budgets: Members can view, admins can manage
CREATE POLICY "Members can view budgets" ON budgets
  FOR SELECT USING (is_household_member(household_id));

CREATE POLICY "Admins can manage budgets" ON budgets
  FOR ALL USING (get_household_role(household_id) IN ('owner', 'admin'));

-- Goals: Members can view, creators can manage
CREATE POLICY "Members can view goals" ON goals
  FOR SELECT USING (is_household_member(household_id));

CREATE POLICY "Creators can manage goals" ON goals
  FOR ALL USING (created_by = auth.uid() OR get_household_role(household_id) IN ('owner', 'admin'));

-- Credit card statements: Members can view
CREATE POLICY "Members can view statements" ON credit_card_statements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM accounts a
      WHERE a.id = credit_card_statements.account_id
      AND is_household_member(a.household_id)
    )
  );

CREATE POLICY "Admins can manage statements" ON credit_card_statements
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM accounts a
      WHERE a.id = credit_card_statements.account_id
      AND get_household_role(a.household_id) IN ('owner', 'admin')
    )
  );

-- Credit card projections: Members can view
CREATE POLICY "Members can view projections" ON credit_card_projections
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM accounts a
      WHERE a.id = credit_card_projections.account_id
      AND is_household_member(a.household_id)
    )
  );

-- Recurring rules: Members can view, admins can manage
CREATE POLICY "Members can view recurring" ON recurring_rules
  FOR SELECT USING (is_household_member(household_id));

CREATE POLICY "Admins can manage recurring" ON recurring_rules
  FOR ALL USING (get_household_role(household_id) IN ('owner', 'admin'));

-- Attachments: Members can view, uploaders can manage
CREATE POLICY "Members can view attachments" ON attachments
  FOR SELECT USING (is_household_member(household_id));

CREATE POLICY "Users can upload attachments" ON attachments
  FOR INSERT WITH CHECK (
    is_household_member(household_id) AND
    uploaded_by = auth.uid()
  );

CREATE POLICY "Uploaders can manage attachments" ON attachments
  FOR ALL USING (uploaded_by = auth.uid() OR get_household_role(household_id) IN ('owner', 'admin'));

-- Analytics snapshots: Members can view
CREATE POLICY "Members can view analytics" ON analytics_snapshots
  FOR SELECT USING (is_household_member(household_id));

-- Notifications: Users can view/manage own
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

-- Audit logs: Admins can view
CREATE POLICY "Admins can view audit logs" ON audit_logs
  FOR SELECT USING (get_household_role(household_id) IN ('owner', 'admin'));

-- ============================================
-- TRIGGERS & FUNCTIONS
-- ============================================

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_households_updated_at BEFORE UPDATE ON households
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON budgets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_recurring_rules_updated_at BEFORE UPDATE ON recurring_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create household for new user
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_household UUID;
BEGIN
  -- Create personal household
  INSERT INTO households (name, slug, currency)
  VALUES (NEW.raw_user_meta_data->>'full_name' || '''s Household', 
          lower(regexp_replace(NEW.raw_user_meta_data->>'full_name' || '-' || gen_random_uuid()::text, '[^a-z0-9-]', '', 'g')),
          COALESCE(NEW.raw_user_meta_data->>'currency', 'USD'))
  RETURNING id INTO new_household;
  
  -- Create profile
  INSERT INTO profiles (id, email, full_name, default_household_id)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', new_household);
  
  -- Add as owner
  INSERT INTO household_members (household_id, user_id, role)
  VALUES (new_household, NEW.id, 'owner');
  
  -- Create default categories
  INSERT INTO categories (household_id, name, type, icon, color, keywords, is_system, sort_order) VALUES
  (new_household, 'Food & Dining', 'expense', 'utensils', '#f97316', ARRAY['restaurant', 'cafe', 'food', 'meal'], TRUE, 1),
  (new_household, 'Groceries', 'expense', 'shopping-cart', '#ea580c', ARRAY['grocery', 'supermarket', 'food shopping'], TRUE, 2),
  (new_household, 'Transport', 'expense', 'car', '#0d9488', ARRAY['uber', 'lyft', 'taxi', 'gas', 'fuel'], TRUE, 3),
  (new_household, 'Shopping', 'expense', 'shopping-bag', '#c2410c', ARRAY['amazon', 'store', 'clothing', 'electronics'], TRUE, 4),
  (new_household, 'Entertainment', 'expense', 'film', '#f97316', ARRAY['movie', 'netflix', 'concert', 'game'], TRUE, 5),
  (new_household, 'Health', 'expense', 'heart-pulse', '#14b8a6', ARRAY['pharmacy', 'doctor', 'gym', 'medicine'], TRUE, 6),
  (new_household, 'Utilities', 'expense', 'zap', '#0f766e', ARRAY['electric', 'water', 'internet', 'phone'], TRUE, 7),
  (new_household, 'Housing', 'expense', 'home', '#115e59', ARRAY['rent', 'mortgage', 'repair'], TRUE, 8),
  (new_household, 'Income', 'income', 'dollar-sign', '#168a47', ARRAY['salary', 'paycheck', 'freelance'], TRUE, 1),
  (new_household, 'Transfers', 'transfer', 'arrow-left-right', '#64748b', ARRAY['transfer', 'venmo', 'zelle'], TRUE, 1);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Update account balance on transaction
CREATE OR REPLACE FUNCTION update_account_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE accounts
    SET current_balance = current_balance + NEW.amount,
        updated_at = NOW()
    WHERE id = NEW.account_id;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE accounts
    SET current_balance = current_balance - OLD.amount + NEW.amount,
        updated_at = NOW()
    WHERE id = NEW.account_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE accounts
    SET current_balance = current_balance - OLD.amount,
        updated_at = NOW()
    WHERE id = OLD.account_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER update_account_balance_trigger
  AFTER INSERT OR UPDATE OR DELETE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_account_balance();

-- Update budget spent amount
CREATE OR REPLACE FUNCTION update_budget_spent()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.amount < 0 THEN
    UPDATE budgets
    SET spent = spent + ABS(NEW.amount),
        updated_at = NOW()
    WHERE household_id = NEW.household_id
    AND category_id = NEW.category_id
    AND NEW.transaction_date BETWEEN start_date AND COALESCE(end_date, 'infinity'::DATE);
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.amount < 0 THEN
      UPDATE budgets
      SET spent = spent - ABS(OLD.amount),
          updated_at = NOW()
      WHERE household_id = OLD.household_id
      AND category_id = OLD.category_id
      AND OLD.transaction_date BETWEEN start_date AND COALESCE(end_date, 'infinity'::DATE);
    END IF;
    IF NEW.amount < 0 THEN
      UPDATE budgets
      SET spent = spent + ABS(NEW.amount),
          updated_at = NOW()
      WHERE household_id = NEW.household_id
      AND category_id = NEW.category_id
      AND NEW.transaction_date BETWEEN start_date AND COALESCE(end_date, 'infinity'::DATE);
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.amount < 0 THEN
    UPDATE budgets
    SET spent = spent - ABS(OLD.amount),
        updated_at = NOW()
    WHERE household_id = OLD.household_id
    AND category_id = OLD.category_id
    AND OLD.transaction_date BETWEEN start_date AND COALESCE(end_date, 'infinity'::DATE);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER update_budget_spent_trigger
  AFTER INSERT OR UPDATE OR DELETE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_budget_spent();

-- Audit log trigger
CREATE OR REPLACE FUNCTION log_audit()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (household_id, user_id, action, entity_type, entity_id, new_data)
    VALUES (
      COALESCE(NEW.household_id, (SELECT household_id FROM accounts WHERE id = NEW.account_id LIMIT 1)),
      auth.uid(),
      'CREATE',
      TG_TABLE_NAME,
      NEW.id,
      to_jsonb(NEW)
    );
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (household_id, user_id, action, entity_type, entity_id, old_data, new_data)
    VALUES (
      COALESCE(NEW.household_id, (SELECT household_id FROM accounts WHERE id = NEW.account_id LIMIT 1)),
      auth.uid(),
      'UPDATE',
      TG_TABLE_NAME,
      NEW.id,
      to_jsonb(OLD),
      to_jsonb(NEW)
    );
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (household_id, user_id, action, entity_type, entity_id, old_data)
    VALUES (
      COALESCE(OLD.household_id, (SELECT household_id FROM accounts WHERE id = OLD.account_id LIMIT 1)),
      auth.uid(),
      'DELETE',
      TG_TABLE_NAME,
      OLD.id,
      to_jsonb(OLD)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit triggers to key tables
CREATE TRIGGER audit_accounts AFTER INSERT OR UPDATE OR DELETE ON accounts
  FOR EACH ROW EXECUTE FUNCTION log_audit();

CREATE TRIGGER audit_transactions AFTER INSERT OR UPDATE OR DELETE ON transactions
  FOR EACH ROW EXECUTE FUNCTION log_audit();

CREATE TRIGGER audit_budgets AFTER INSERT OR UPDATE OR DELETE ON budgets
  FOR EACH ROW EXECUTE FUNCTION log_audit();

CREATE TRIGGER audit_goals AFTER INSERT OR UPDATE OR DELETE ON goals
  FOR EACH ROW EXECUTE FUNCTION log_audit();

-- ============================================
-- HELPER VIEWS
-- ============================================

-- Monthly spending by category
CREATE VIEW monthly_spending AS
SELECT
  t.household_id,
  DATE_TRUNC('month', t.transaction_date)::DATE AS month,
  c.name AS category,
  c.color AS category_color,
  c.icon AS category_icon,
  SUM(CASE WHEN t.amount < 0 THEN ABS(t.amount) ELSE 0 END) AS total_spent,
  SUM(CASE WHEN t.amount > 0 THEN t.amount ELSE 0 END) AS total_income,
  COUNT(*) FILTER (WHERE t.amount < 0) AS expense_count,
  COUNT(*) FILTER (WHERE t.amount > 0) AS income_count
FROM transactions t
LEFT JOIN categories c ON t.category_id = c.id
WHERE t.status = 'posted'
GROUP BY t.household_id, DATE_TRUNC('month', t.transaction_date), c.id, c.name, c.color, c.icon;

-- Account balances with credit card info
CREATE VIEW account_summary AS
SELECT
  a.*,
  CASE 
    WHEN a.type = 'credit_card' THEN
      jsonb_build_object(
        'statement_balance', a.current_balance,
        'available_credit', GREATEST(a.credit_limit + a.current_balance, 0),
        'utilization', CASE WHEN a.credit_limit > 0 THEN ABS(a.current_balance) / a.credit_limit ELSE 0 END,
        'days_until_due', CASE 
          WHEN a.due_day IS NOT NULL THEN
            (DATE_TRUNC('month', CURRENT_DATE + INTERVAL '1 month') + (a.due_day - 1) * INTERVAL '1 day')::DATE - CURRENT_DATE
          ELSE NULL
        END
      )
    ELSE NULL
  END AS credit_info
FROM accounts a
WHERE a.is_active = TRUE;

-- ============================================
-- DEFAULT DATA (Inserted via migration)
-- ============================================

-- This will be seeded via the on_new_user trigger
-- But we can also insert system-wide defaults here if needed