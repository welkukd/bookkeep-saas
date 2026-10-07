import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('default_household_id')
      .eq('id', user.id)
      .single();

    if (!profile?.default_household_id) {
      return NextResponse.json({ error: 'No household found' }, { status: 400 });
    }

    // Get credit card accounts
    const { data: accounts, error: accountsError } = await supabase
      .from('accounts')
      .select('*')
      .eq('household_id', profile.default_household_id)
      .eq('type', 'credit_card')
      .eq('is_active', true);

    if (accountsError) {
      return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 });
    }

    if (!accounts || accounts.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // Get latest statements for each card
    const accountIds = accounts.map(a => a.id);
    const { data: statements } = await supabase
      .from('credit_card_statements')
      .select('*')
      .in('account_id', accountIds)
      .order('statement_date', { ascending: false });

    // Get projections
    const { data: projections } = await supabase
      .from('credit_card_projections')
      .select('*')
      .in('account_id', accountIds)
      .order('projection_date', { ascending: false });

    // Combine data
    const result = accounts.map(account => {
      const latestStatement = statements?.find(s => s.account_id === account.id);
      const latestProjection = projections?.find(p => p.account_id === account.id);
      
      const daysUntilDue = account.due_day 
        ? Math.ceil((new Date(new Date().getFullYear(), new Date().getMonth() + 1, account.due_day).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : null;

      return {
        ...account,
        latest_statement: latestStatement,
        latest_projection: latestProjection,
        days_until_due: daysUntilDue,
        utilization: account.credit_limit ? Math.abs(account.current_balance) / account.credit_limit : 0,
        available_credit: account.credit_limit ? Math.max(account.credit_limit + account.current_balance, 0) : 0,
      };
    });

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('Credit cards GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}