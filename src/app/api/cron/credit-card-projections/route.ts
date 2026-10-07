import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createServerClient();
    const today = new Date();

    // Get active credit card accounts
    const { data: accounts } = await supabase
      .from('accounts')
      .select('*')
      .eq('type', 'credit_card')
      .eq('is_active', true);

    if (!accounts || accounts.length === 0) {
      return NextResponse.json({ message: 'No credit card accounts' });
    }

    let updated = 0;

    for (const account of accounts) {
      if (!account.statement_day || !account.due_day) continue;

      // Calculate next statement date
      let statementDate = new Date(today.getFullYear(), today.getMonth(), account.statement_day);
      if (statementDate < today) {
        statementDate.setMonth(statementDate.getMonth() + 1);
      }

      // Calculate due date
      let dueDate = new Date(statementDate.getFullYear(), statementDate.getMonth(), account.due_day);
      if (dueDate < statementDate) {
        dueDate.setMonth(dueDate.getMonth() + 1);
      }

      // Get transactions since last statement
      const { data: lastStatement } = await supabase
        .from('credit_card_statements')
        .select('statement_date')
        .eq('account_id', account.id)
        .order('statement_date', { ascending: false })
        .limit(1)
        .single();

      const startDate = lastStatement 
        ? new Date(lastStatement.statement_date)
        : new Date(today.getFullYear(), today.getMonth() - 1, 1);
      startDate.setDate(startDate.getDate() + 1);

      const { data: transactions } = await supabase
        .from('transactions')
        .select('id, amount, transaction_date')
        .eq('account_id', account.id)
        .eq('status', 'posted')
        .gte('transaction_date', startDate.toISOString().split('T')[0])
        .lt('transaction_date', statementDate.toISOString().split('T')[0]);

      const newCharges = transactions?.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0;
      const paymentsReceived = transactions?.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0) || 0;

      const previousBalance = account.current_balance;
      const projectedBalance = previousBalance - newCharges + paymentsReceived;
      const projectedMinPayment = Math.max(projectedBalance * 0.02, 25); // 2% or $25 minimum
      const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      // Calculate confidence based on transaction history
      const recentTransactions = transactions?.length || 0;
      const confidenceScore = Math.min(0.5 + (recentTransactions * 0.05), 0.95);

      await supabase
        .from('credit_card_projections')
        .upsert({
          account_id: account.id,
          projection_date: statementDate.toISOString().split('T')[0],
          projected_balance: projectedBalance,
          projected_minimum_payment: projectedMinPayment,
          days_until_due: daysUntilDue,
          confidence_score: confidenceScore,
          based_on_transactions: transactions?.map(t => t.id) || [],
        }, {
          onConflict: 'account_id,projection_date',
        });

      updated++;
    }

    return NextResponse.json({ 
      message: 'Credit card projections updated',
      updated,
      date: today.toISOString().split('T')[0],
    });
  } catch (error) {
    console.error('Cron credit card projections error:', error);
    return NextResponse.json({ error: 'Cron job failed' }, { status: 500 });
  }
}