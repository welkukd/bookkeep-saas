import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createServerClient();
    
    // Generate daily analytics snapshots for all active households
    const { data: households } = await supabase
      .from('households')
      .select('id')
      .eq('is_active', true); // You might want to add an is_active column

    if (!households || households.length === 0) {
      return NextResponse.json({ message: 'No households to process' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let processed = 0;
    let errors = 0;

    for (const household of households) {
      try {
        // Get transactions for yesterday
        const { data: transactions } = await supabase
          .from('transactions')
          .select('*')
          .eq('household_id', household.id)
          .eq('status', 'posted')
          .gte('transaction_date', yesterday.toISOString().split('T')[0])
          .lt('transaction_date', today.toISOString().split('T')[0]);

        if (!transactions) continue;

        const income = transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
        const expenses = transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
        
        // Category breakdown
        const categoryBreakdown: Record<string, { amount: number; count: number }> = {};
        transactions.filter(t => t.amount < 0).forEach(t => {
          const cat = t.category_id || 'uncategorized';
          if (!categoryBreakdown[cat]) categoryBreakdown[cat] = { amount: 0, count: 0 };
          categoryBreakdown[cat].amount += Math.abs(t.amount);
          categoryBreakdown[cat].count += 1;
        });

        // Account balances
        const { data: accounts } = await supabase
          .from('accounts')
          .select('id, name, type, current_balance, credit_limit')
          .eq('household_id', household.id)
          .eq('is_active', true);

        const netWorth = accounts?.reduce((sum, a) => sum + (a.current_balance || 0), 0) || 0;
        const liabilities = accounts?.filter(a => a.type === 'credit_card' || a.type === 'loan').reduce((sum, a) => sum + Math.abs(a.current_balance || 0), 0) || 0;
        const assets = netWorth + liabilities;

        // Upsert daily snapshot
        await supabase
          .from('analytics_snapshots')
          .upsert({
            household_id: household.id,
            snapshot_type: 'daily',
            period_start: yesterday.toISOString().split('T')[0],
            period_end: yesterday.toISOString().split('T')[0],
            data: {
              income,
              expenses,
              net: income - expenses,
              transaction_count: transactions.length,
              category_breakdown: categoryBreakdown,
              account_balances: accounts?.map(a => ({ id: a.id, name: a.name, type: a.type, balance: a.current_balance })) || [],
              net_worth: netWorth,
              assets,
              liabilities,
              savings_rate: income > 0 ? ((income - expenses) / income) * 100 : 0,
            },
          }, {
            onConflict: 'household_id,snapshot_type,period_start',
          });

        processed++;
      } catch (err) {
        console.error(`Error processing household ${household.id}:`, err);
        errors++;
      }
    }

    return NextResponse.json({ 
      message: 'Daily snapshots completed',
      processed,
      errors,
      date: yesterday.toISOString().split('T')[0],
    });
  } catch (error) {
    console.error('Cron daily snapshots error:', error);
    return NextResponse.json({ error: 'Cron job failed' }, { status: 500 });
  }
}