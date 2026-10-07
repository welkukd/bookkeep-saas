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
      .select('default_household_id, *')
      .eq('id', user.id)
      .single();

    if (!profile?.default_household_id) {
      return NextResponse.json({ error: 'No household found' }, { status: 400 });
    }

    // Get subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('household_id', profile.default_household_id)
      .single();

    // Get household with member count
    const { data: household } = await supabase
      .from('households')
      .select('*, members:household_members(count)')
      .eq('id', profile.default_household_id)
      .single();

    return NextResponse.json({
      data: {
        profile,
        subscription,
        household,
        limits: subscription ? getLimitsForTier(subscription.tier) : getLimitsForTier('free'),
      },
    });
  } catch (error) {
    console.error('Billing status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function getLimitsForTier(tier: string) {
  const limits = {
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
  return limits[tier as keyof typeof limits] || limits.free;
}