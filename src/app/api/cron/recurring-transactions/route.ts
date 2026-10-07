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
    today.setHours(0, 0, 0, 0);

    // Get active recurring rules due today
    const { data: rules } = await supabase
      .from('recurring_rules')
      .select('*, account:accounts(*)')
      .eq('is_active', true)
      .eq('auto_create', true)
      .lte('next_occurrence', today.toISOString().split('T')[0]);

    if (!rules || rules.length === 0) {
      return NextResponse.json({ message: 'No recurring transactions due today' });
    }

    let created = 0;
    let errors = 0;

    for (const rule of rules) {
      try {
        // Create transaction
        const { data: transaction, error } = await supabase
          .from('transactions')
          .insert({
            household_id: rule.household_id,
            account_id: rule.account_id,
            category_id: rule.category_id,
            created_by: rule.created_by,
            amount: rule.type === 'expense' ? -Math.abs(rule.amount) : Math.abs(rule.amount),
            currency: rule.currency,
            description: rule.description || rule.name,
            merchant: rule.merchant,
            transaction_date: today.toISOString().split('T')[0],
            status: 'posted',
            type: rule.type,
            is_recurring: true,
            parent_transaction_id: null,
            visibility: 'household',
            metadata: { recurring_rule_id: rule.id },
          })
          .select()
          .single();

        if (error) throw error;

        // Calculate next occurrence
        let nextDate = new Date(rule.next_occurrence);
        switch (rule.frequency) {
          case 'daily':
            nextDate.setDate(nextDate.getDate() + 1);
            break;
          case 'weekly':
            nextDate.setDate(nextDate.getDate() + 7);
            break;
          case 'biweekly':
            nextDate.setDate(nextDate.getDate() + 14);
            break;
          case 'monthly':
            nextDate.setMonth(nextDate.getMonth() + 1);
            break;
          case 'quarterly':
            nextDate.setMonth(nextDate.getMonth() + 3);
            break;
          case 'yearly':
            nextDate.setFullYear(nextDate.getFullYear() + 1);
            break;
        }

        // Check if past end date
        const shouldDeactivate = rule.end_date && nextDate > new Date(rule.end_date);

        await supabase
          .from('recurring_rules')
          .update({
            next_occurrence: nextDate.toISOString().split('T')[0],
            is_active: !shouldDeactivate,
            updated_at: new Date().toISOString(),
          })
          .eq('id', rule.id);

        // Send notification if configured
        if (rule.notification_days_before > 0) {
          const notificationDate = new Date(nextDate);
          notificationDate.setDate(notificationDate.getDate() - rule.notification_days_before);
          
          if (notificationDate <= today) {
            await supabase
              .from('notifications')
              .insert({
                user_id: rule.created_by,
                household_id: rule.household_id,
                type: 'recurring_upcoming',
                title: 'Upcoming Recurring Transaction',
                message: `"${rule.name}" of ${rule.amount} ${rule.currency} is scheduled for ${nextDate.toLocaleDateString()}`,
                data: { rule_id: rule.id, transaction_id: transaction.id },
              });
          }
        }

        created++;
      } catch (err) {
        console.error(`Error processing recurring rule ${rule.id}:`, err);
        errors++;
      }
    }

    return NextResponse.json({ 
      message: 'Recurring transactions processed',
      created,
      errors,
      date: today.toISOString().split('T')[0],
    });
  } catch (error) {
    console.error('Cron recurring transactions error:', error);
    return NextResponse.json({ error: 'Cron job failed' }, { status: 500 });
  }
}