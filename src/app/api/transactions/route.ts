import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createTransactionSchema = z.object({
  account_id: z.string().uuid(),
  category_id: z.string().uuid().optional(),
  amount: z.number(),
  currency: z.enum(['USD', 'CAD', 'EUR', 'GBP', 'INR', 'AUD']).default('USD'),
  description: z.string().min(1).max(500),
  merchant: z.string().max(200).optional(),
  notes: z.string().max(2000).optional(),
  transaction_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  transaction_time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  time_of_day: z.enum(['morning', 'afternoon', 'evening', 'night']).optional(),
  type: z.enum(['expense', 'income', 'transfer', 'refund', 'fee', 'interest']),
  tags: z.array(z.string()).optional(),
  is_recurring: z.boolean().default(false),
  recurrence_rule: z.record(z.unknown()).optional(),
  split_details: z.array(z.object({
    user_id: z.string().uuid(),
    amount: z.number(),
    percentage: z.number().optional(),
  })).optional(),
  visibility: z.enum(['private', 'household', 'shared']).default('household'),
});

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's default household
    const { data: profile } = await supabase
      .from('profiles')
      .select('default_household_id')
      .eq('id', user.id)
      .single();

    if (!profile?.default_household_id) {
      return NextResponse.json({ error: 'No household found' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '50'), 100);
    const accountId = searchParams.get('account_id');
    const categoryId = searchParams.get('category_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const type = searchParams.get('type');
    const search = searchParams.get('search');

    let query = supabase
      .from('transactions')
      .select(`
        *,
        account:accounts(*),
        category:categories(*),
        creator:profiles!transactions_created_by_fkey(*)
      `, { count: 'exact' })
      .eq('household_id', profile.default_household_id)
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (accountId) query = query.eq('account_id', accountId);
    if (categoryId) query = query.eq('category_id', categoryId);
    if (startDate) query = query.gte('transaction_date', startDate);
    if (endDate) query = query.lte('transaction_date', endDate);
    if (type) query = query.eq('type', type);
    if (search) {
      query = query.or(`description.ilike.%${search}%,merchant.ilike.%${search}%,notes.ilike.%${search}%`);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('Transaction fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
    }

    return NextResponse.json({
      data: data || [],
      count: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    });
  } catch (error) {
    console.error('Transactions GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's default household
    const { data: profile } = await supabase
      .from('profiles')
      .select('default_household_id')
      .eq('id', user.id)
      .single();

    if (!profile?.default_household_id) {
      return NextResponse.json({ error: 'No household found' }, { status: 400 });
    }

    const body = await request.json();
    const validation = createTransactionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid input', details: validation.error.flatten() }, { status: 400 });
    }

    const data = validation.data;

    // Verify account belongs to household
    const { data: account } = await supabase
      .from('accounts')
      .select('id')
      .eq('id', data.account_id)
      .eq('household_id', profile.default_household_id)
      .single();

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Create transaction
    const { data: transaction, error } = await supabase
      .from('transactions')
      .insert({
        ...data,
        household_id: profile.default_household_id,
        created_by: user.id,
        split_details: data.split_details || [],
      })
      .select(`
        *,
        account:accounts(*),
        category:categories(*),
        creator:profiles!transactions_created_by_fkey(*)
      `)
      .single();

    if (error) {
      console.error('Transaction create error:', error);
      return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
    }

    // Create split transactions if needed
    if (data.split_details && data.split_details.length > 0) {
      const splits = data.split_details.map((split, index) => ({
        household_id: profile.default_household_id,
        account_id: data.account_id,
        category_id: data.category_id,
        created_by: split.user_id,
        amount: split.amount,
        currency: data.currency,
        description: `${data.description} (split ${index + 1})`,
        merchant: data.merchant,
        transaction_date: data.transaction_date,
        transaction_time: data.transaction_time,
        time_of_day: data.time_of_day,
        status: 'posted',
        type: data.type,
        is_split: true,
        split_from_id: transaction.id,
        split_details: [],
        visibility: data.visibility,
      }));

      await supabase.from('transactions').insert(splits);
    }

    return NextResponse.json({ data: transaction }, { status: 201 });
  } catch (error) {
    console.error('Transactions POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}