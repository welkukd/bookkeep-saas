import { NextRequest, NextResponse } from 'next/server';
import { parseNaturalLanguage, ParsedQuery, ParsedExpense } from '@/lib/nlp/expense-parser';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, context } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const result = parseNaturalLanguage(text);

    // Enhance with context if provided (e.g., user's categories, accounts, merchants)
    if (context?.categories && result.data.category) {
      const matchedCategory = context.categories.find(
        (c: any) => c.name.toLowerCase() === result.data.category?.toLowerCase() ||
                    c.keywords?.some((k: string) => result.data.category?.includes(k))
      );
      if (matchedCategory) {
        (result.data as ParsedExpense).category_id = matchedCategory.id;
      }
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('NLP parse error:', error);
    return NextResponse.json({ error: 'Failed to parse' }, { status: 500 });
  }
}