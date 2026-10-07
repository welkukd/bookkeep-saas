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

export async function GET(request: NextRequest) {
  try {
    const prices = await Promise.all(
      Object.entries(PRICE_IDS).map(async ([key, priceId]) => {
        const price = await stripe.prices.retrieve(priceId);
        return {
          key,
          id: price.id,
          amount: price.unit_amount,
          currency: price.currency,
          interval: price.recurring?.interval,
          product: price.product,
        };
      })
    );

    return NextResponse.json({ data: prices });
  } catch (error) {
    console.error('Stripe prices error:', error);
    return NextResponse.json({ error: 'Failed to fetch prices' }, { status: 500 });
  }
}