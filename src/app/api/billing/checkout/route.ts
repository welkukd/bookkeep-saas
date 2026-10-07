import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
  typescript: true,
});

const PRICE_IDS = {
  pro_monthly: process.env.STRIPE_PRICE_ID_PRO_MONTHLY!,
  pro_yearly: process.env.STRIPE_PRICE_ID_PRO_YEARLY!,
  team_monthly: process.env.STRIPE_PRICE_ID_TEAM_MONTHLY!,
  team_yearly: process.env.STRIPE_PRICE_ID_TEAM_YEARLY!,
};

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('default_household_id, email, full_name')
      .eq('id', user.id)
      .single();

    if (!profile?.default_household_id) {
      return NextResponse.json({ error: 'No household found' }, { status: 400 });
    }

    const body = await request.json();
    const { priceKey, successUrl, cancelUrl } = body;

    if (!priceKey || !PRICE_IDS[priceKey as keyof typeof PRICE_IDS]) {
      return NextResponse.json({ error: 'Invalid price key' }, { status: 400 });
    }

    const priceId = PRICE_IDS[priceKey as keyof typeof PRICE_IDS];

    // Check if customer exists
    let customerId: string;
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('household_id', profile.default_household_id)
      .single();

    if (subscription?.stripe_customer_id) {
      customerId = subscription.stripe_customer_id;
    } else {
      // Create Stripe customer
      const customer = await stripe.customers.create({
        email: profile.email,
        name: profile.full_name || undefined,
        metadata: {
          household_id: profile.default_household_id,
          user_id: user.id,
        },
      });
      customerId = customer.id;
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
      metadata: {
        household_id: profile.default_household_id,
        user_id: user.id,
        price_key: priceKey,
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      subscription_data: {
        metadata: {
          household_id: profile.default_household_id,
          user_id: user.id,
        },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}