import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20',
  typescript: true,
});

const PRICE_IDS = {
  pro_monthly: process.env.STRIPE_PRICE_ID_PRO_MONTHLY || '',
  pro_yearly: process.env.STRIPE_PRICE_ID_PRO_YEARLY || '',
  team_monthly: process.env.STRIPE_PRICE_ID_TEAM_MONTHLY || '',
  team_yearly: process.env.STRIPE_PRICE_ID_TEAM_YEARLY || '',
};

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export async function POST(request: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY || !webhookSecret) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });
  }

  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
    }

    const supabase = await createServerClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(supabase, session);
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(supabase, subscription);
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(supabase, subscription);
        break;
      }
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentSucceeded(supabase, invoice);
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(supabase, invoice);
        break;
      }
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

async function handleCheckoutCompleted(supabase: any, session: Stripe.Checkout.Session) {
  const householdId = session.metadata?.household_id;
  const userId = session.metadata?.user_id;
  const priceKey = session.metadata?.price_key;

  if (!householdId || !userId) return;

  // Get subscription details
  const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
  const priceId = subscription.items.data[0]?.price.id;

  // Determine tier from price
  let tier = 'pro';
  if (priceId === PRICE_IDS.team_monthly || priceId === PRICE_IDS.team_yearly) {
    tier = 'team';
  }

  // Upsert subscription
  await supabase
    .from('subscriptions')
    .upsert({
      household_id: householdId,
      user_id: userId,
      stripe_customer_id: session.customer as string,
      stripe_subscription_id: subscription.id,
      stripe_price_id: priceId,
      status: subscription.status,
      tier,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
    }, {
      onConflict: 'household_id',
    });
}

async function handleSubscriptionUpdated(supabase: any, subscription: Stripe.Subscription) {
  const priceId = subscription.items.data[0]?.price.id;
  
  let tier = 'pro';
  if (priceId === PRICE_IDS.team_monthly || priceId === PRICE_IDS.team_yearly) {
    tier = 'team';
  }

  await supabase
    .from('subscriptions')
    .update({
      stripe_price_id: priceId,
      status: subscription.status,
      tier,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);
}

async function handleSubscriptionDeleted(supabase: any, subscription: Stripe.Subscription) {
  await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      tier: 'free',
      cancel_at_period_end: false,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);
}

async function handleInvoicePaymentSucceeded(supabase: any, invoice: Stripe.Invoice) {
  // Log successful payment
  if (invoice.subscription) {
    await supabase
      .from('payments')
      .insert({
        stripe_invoice_id: invoice.id,
        stripe_customer_id: invoice.customer as string,
        amount: invoice.amount_paid,
        currency: invoice.currency,
        status: 'succeeded',
        paid_at: new Date().toISOString(),
      });
  }
}

async function handleInvoicePaymentFailed(supabase: any, invoice: Stripe.Invoice) {
  // Log failed payment and notify user
  if (invoice.subscription) {
    await supabase
      .from('payments')
      .insert({
        stripe_invoice_id: invoice.id,
        stripe_customer_id: invoice.customer as string,
        amount: invoice.amount_due,
        currency: invoice.currency,
        status: 'failed',
        failed_at: new Date().toISOString(),
      });

    // Get household for notification
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('household_id, user_id')
      .eq('stripe_subscription_id', invoice.subscription as string)
      .single();

    if (subscription) {
      await supabase
        .from('notifications')
        .insert({
          user_id: subscription.user_id,
          household_id: subscription.household_id,
          type: 'payment_failed',
          title: 'Payment Failed',
          message: `Your subscription payment of ${invoice.amount_due / 100} ${invoice.currency.toUpperCase()} failed. Please update your payment method.`,
          data: { invoice_id: invoice.id },
        });
    }
  }
}