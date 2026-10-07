export interface Household {
  id: string;
  name: string;
  slug: string;
  currency: Currency;
  timezone: string;
  settings: HouseholdSettings;
  created_at: string;
  updated_at: string;
}

export interface HouseholdSettings {
  defaultView?: 'dashboard' | 'transactions' | 'budgets';
  weekStartsOn?: 0 | 1; // 0 = Sunday, 1 = Monday
  fiscalYearStart?: number; // Month 1-12
  categories?: CategorySettings;
}

export interface CategorySettings {
  autoCategorize?: boolean;
  learnFromCorrections?: boolean;
}

export type Currency = 'USD' | 'CAD' | 'EUR' | 'GBP' | 'INR' | 'AUD';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  default_household_id: string | null;
  preferences: UserPreferences;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  currency: Currency;
  dateFormat: string;
  notifications: boolean;
  weeklyDigest: boolean;
  privacyMode: 'private' | 'household' | 'shared';
  language: string;
}

export interface HouseholdMember {
  id: string;
  household_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  invited_by: string | null;
  joined_at: string;
  profile?: Profile;
}

export type AccountType = 'checking' | 'savings' | 'credit_card' | 'cash' | 'investment' | 'loan' | 'other';

export interface Account {
  id: string;
  household_id: string;
  name: string;
  type: AccountType;
  institution: string | null;
  last_four: string | null;
  currency: Currency;
  current_balance: number;
  available_balance: number | null;
  credit_limit: number | null;
  statement_day: number | null;
  due_day: number | null;
  apr: number | null;
  is_active: boolean;
  is_manual: boolean;
  sync_provider: string | null;
  sync_data: Record<string, unknown>;
  icon: string | null;
  color: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  household_id: string;
  name: string;
  parent_id: string | null;
  type: 'expense' | 'income' | 'transfer';
  icon: string | null;
  color: string | null;
  keywords: string[];
  is_system: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  children?: Category[];
}

export type TransactionStatus = 'pending' | 'posted' | 'cancelled' | 'failed';
export type TransactionType = 'expense' | 'income' | 'transfer' | 'refund' | 'fee' | 'interest';
export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';
export type Visibility = 'private' | 'household' | 'shared';

export interface Transaction {
  id: string;
  household_id: string;
  account_id: string;
  category_id: string | null;
  created_by: string | null;
  amount: number; // Positive for income, negative for expense
  currency: Currency;
  description: string;
  merchant: string | null;
  notes: string | null;
  transaction_date: string;
  transaction_time: string | null;
  time_of_day: TimeOfDay | null;
  status: TransactionStatus;
  type: TransactionType;
  is_recurring: boolean;
  recurrence_rule: Record<string, unknown> | null;
  recurrence_end_date: string | null;
  parent_transaction_id: string | null;
  is_split: boolean;
  split_from_id: string | null;
  split_details: SplitDetail[];
  is_reconciled: boolean;
  reconciled_at: string | null;
  reconciled_by: string | null;
  tags: string[];
  metadata: Record<string, unknown>;
  visibility: Visibility;
  created_at: string;
  updated_at: string;
  // Joined fields
  account?: Account;
  category?: Category;
  creator?: Profile;
  splits?: TransactionSplit[];
}

export interface SplitDetail {
  user_id: string;
  amount: number;
  percentage?: number;
}

export interface TransactionSplit {
  id: string;
  transaction_id: string;
  user_id: string;
  amount: number;
  percentage: number;
  user?: Profile;
}

export interface Budget {
  id: string;
  household_id: string;
  category_id: string;
  period: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  amount: number;
  spent: number;
  start_date: string;
  end_date: string | null;
  alert_threshold: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export type GoalType = 'savings' | 'debt_payoff' | 'investment' | 'emergency_fund' | 'custom';

export interface Goal {
  id: string;
  household_id: string;
  created_by: string | null;
  name: string;
  type: GoalType;
  target_amount: number;
  current_amount: number;
  currency: Currency;
  target_date: string | null;
  linked_account_id: string | null;
  linked_category_id: string | null;
  auto_contribute: boolean;
  contribution_amount: number | null;
  contribution_frequency: 'weekly' | 'biweekly' | 'monthly' | null;
  icon: string | null;
  color: string | null;
  is_active: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  creator?: Profile;
  linked_account?: Account;
  linked_category?: Category;
}

export interface CreditCardStatement {
  id: string;
  account_id: string;
  statement_date: string;
  due_date: string;
  statement_balance: number;
  minimum_payment: number;
  previous_balance: number;
  payments_received: number;
  new_charges: number;
  fees: number;
  interest_charged: number;
  is_paid: boolean;
  paid_amount: number;
  paid_date: string | null;
  pdf_url: string | null;
  created_at: string;
}

export interface CreditCardProjection {
  id: string;
  account_id: string;
  projection_date: string;
  projected_balance: number;
  projected_minimum_payment: number;
  days_until_due: number;
  confidence_score: number;
  based_on_transactions: string[];
  created_at: string;
}

export interface RecurringRule {
  id: string;
  household_id: string;
  created_by: string | null;
  account_id: string;
  category_id: string | null;
  name: string;
  amount: number;
  currency: Currency;
  description: string | null;
  merchant: string | null;
  type: TransactionType;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';
  day_of_month: number | null;
  day_of_week: number | null;
  start_date: string;
  end_date: string | null;
  next_occurrence: string;
  is_active: boolean;
  auto_create: boolean;
  notification_days_before: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  account?: Account;
  category?: Category;
}

export interface Attachment {
  id: string;
  household_id: string;
  transaction_id: string | null;
  uploaded_by: string | null;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  public_url: string | null;
  ocr_text: string | null;
  ocr_confidence: number | null;
  processed: boolean;
  created_at: string;
  uploader?: Profile;
}

export interface Notification {
  id: string;
  user_id: string;
  household_id: string | null;
  type: string;
  title: string;
  message: string | null;
  data: Record<string, unknown>;
  read: boolean;
  action_url: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  household_id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface AnalyticsSnapshot {
  id: string;
  household_id: string;
  snapshot_type: 'daily' | 'weekly' | 'monthly' | 'yearly';
  period_start: string;
  period_end: string;
  data: Record<string, unknown>;
  created_at: string;
}

// Chart data types
export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: string | number;
}

export interface TimeSeriesDataPoint {
  date: string;
  value: number;
  [key: string]: string | number;
}

export interface CategoryBreakdown {
  category: string;
  category_id: string;
  amount: number;
  percentage: number;
  color: string;
  icon: string;
  count: number;
}

export interface MonthlyTrend {
  month: string;
  income: number;
  expenses: number;
  net: number;
  savings_rate: number;
}

export interface CashFlowData {
  date: string;
  inflow: number;
  outflow: number;
  net: number;
  balance: number;
}

export interface NetWorthData {
  date: string;
  assets: number;
  liabilities: number;
  net_worth: number;
}

// NLP Types
export interface ParsedExpense {
  amount: number;
  currency: string;
  description: string;
  merchant?: string;
  category?: string;
  date?: Date;
  timeOfDay?: TimeOfDay;
  isRecurring?: boolean;
  recurrencePattern?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  paymentMethod?: 'cash' | 'card' | 'credit' | 'debit' | 'upi' | 'bank' | 'other';
  split?: {
    type: 'half' | 'percentage' | 'amount';
    value: number;
    withWhom?: string;
  };
  tags?: string[];
  confidence: number;
  originalText: string;
}

export interface ParsedQuery {
  type: 'expense' | 'income' | 'transfer' | 'query' | 'credit_card_check' | 'category_summary';
  data: ParsedExpense | ParsedQueryData;
  confidence: number;
}

export interface ParsedQueryData {
  question: string;
  timeRange?: { start: Date; end: Date };
  category?: string;
  creditCard?: string;
  metric?: 'total' | 'average' | 'count' | 'projection';
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Form types
export interface CreateTransactionForm {
  account_id: string;
  category_id?: string;
  amount: number;
  currency: Currency;
  description: string;
  merchant?: string;
  notes?: string;
  transaction_date: string;
  transaction_time?: string;
  time_of_day?: TimeOfDay;
  type: TransactionType;
  tags?: string[];
  is_recurring?: boolean;
  recurrence_rule?: Record<string, unknown>;
  split_details?: SplitDetail[];
  visibility?: Visibility;
}

export interface CreateAccountForm {
  name: string;
  type: AccountType;
  institution?: string;
  last_four?: string;
  currency: Currency;
  current_balance?: number;
  credit_limit?: number;
  statement_day?: number;
  due_day?: number;
  apr?: number;
  icon?: string;
  color?: string;
}

export interface CreateBudgetForm {
  category_id: string;
  period: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  amount: number;
  start_date: string;
  end_date?: string;
  alert_threshold?: number;
}

export interface CreateGoalForm {
  name: string;
  type: GoalType;
  target_amount: number;
  currency: Currency;
  target_date?: string;
  linked_account_id?: string;
  linked_category_id?: string;
  auto_contribute?: boolean;
  contribution_amount?: number;
  contribution_frequency?: 'weekly' | 'biweekly' | 'monthly';
  icon?: string;
  color?: string;
}

// Subscription tiers
export type SubscriptionTier = 'free' | 'pro' | 'team' | 'enterprise';

export interface SubscriptionLimits {
  households: number;
  membersPerHousehold: number;
  accountsPerHousehold: number;
  transactionsPerMonth: number;
  budgets: number;
  goals: number;
  attachments: number; // MB
  ocrCredits: number;
  apiAccess: boolean;
  prioritySupport: boolean;
  advancedReports: boolean;
  customCategories: boolean;
  recurringRules: boolean;
  creditCardTracking: boolean;
  projections: boolean;
}

export const SUBSCRIPTION_LIMITS: Record<SubscriptionTier, SubscriptionLimits> = {
  free: {
    households: 1,
    membersPerHousehold: 1,
    accountsPerHousehold: 3,
    transactionsPerMonth: 100,
    budgets: 5,
    goals: 3,
    attachments: 50,
    ocrCredits: 10,
    apiAccess: false,
    prioritySupport: false,
    advancedReports: false,
    customCategories: false,
    recurringRules: false,
    creditCardTracking: true,
    projections: false,
  },
  pro: {
    households: 3,
    membersPerHousehold: 2,
    accountsPerHousehold: 10,
    transactionsPerMonth: 1000,
    budgets: 20,
    goals: 10,
    attachments: 500,
    ocrCredits: 100,
    apiAccess: false,
    prioritySupport: false,
    advancedReports: true,
    customCategories: true,
    recurringRules: true,
    creditCardTracking: true,
    projections: true,
  },
  team: {
    households: 10,
    membersPerHousehold: 10,
    accountsPerHousehold: 25,
    transactionsPerMonth: 5000,
    budgets: 50,
    goals: 25,
    attachments: 2000,
    ocrCredits: 500,
    apiAccess: true,
    prioritySupport: true,
    advancedReports: true,
    customCategories: true,
    recurringRules: true,
    creditCardTracking: true,
    projections: true,
  },
  enterprise: {
    households: 999,
    membersPerHousehold: 999,
    accountsPerHousehold: 999,
    transactionsPerMonth: 999999,
    budgets: 999,
    goals: 999,
    attachments: 999999,
    ocrCredits: 999999,
    apiAccess: true,
    prioritySupport: true,
    advancedReports: true,
    customCategories: true,
    recurringRules: true,
    creditCardTracking: true,
    projections: true,
  },
};