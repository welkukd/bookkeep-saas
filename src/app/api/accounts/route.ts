import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createAccountSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['checking', 'savings', 'credit_card', 'cash', 'investment', 'loan', 'other']),
  institution: z.string().max(100).optional(),
  last_four: z.string().length(4).optional(),
  currency: z.enum(['USD', 'CAD', 'EUR', 'GBP', 'INR', 'AUD']).default('USD'),
  current_balance: z.number().default(0),
  credit_limit: z.number().positive().optional(),
  statement_day: z.number().min(1).max(31).optional(),
  due_day: z.number().min(1).max(31).optional(),
  apr: z.number().min(0).max(100).optional(),
  icon: z.string().max(50).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

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

    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('household_id', profile.default_household_id)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 });
    }

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    console.error('Accounts GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('default_household_id, id')
      .eq('id', user.id)
      .single();

    if (!profile?.default_household_id) {
      return NextResponse.json({ error: 'No household found' }, { status: 400 });
    }

    // Check role
    const { data: membership } = await supabase
      .from('household_members')
      .select('role')
      .eq('household_id', profile.default_household_id)
      .eq('user_id', user.id)
      .single();

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const validation = createAccountSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid input', details: validation.error.flatten() }, { status: 400 });
    }

    const data = validation.data;

    // Get max sort order
    const { data: maxOrder } = await supabase
      .from('accounts')
      .select('sort_order')
      .eq('household_id', profile.default_household_id)
      .order('sort_order', { ascending: false })
      .limit(1)
      .single();

    const { data: account, error } = await supabase
      .from('accounts')
      .insert({
        ...data,
        household_id: profile.default_household_id,
        sort_order: (maxOrder?.sort_order || 0) + 1,
      })
      .select()
      .single();

    if (error) {
      console.error('Account create error:', error);
      return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
    }

    return NextResponse.json({ data: account }, { status: 201 });
  } catch (error) {
    console.error('Accounts POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}