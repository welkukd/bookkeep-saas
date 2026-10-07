/**
 * Natural Language Expense Parser
 * Parses phrases like:
 * - "morning tea at tim hortons 10 dollars"
 * - "evening party at zaza 190 dollars"
 * - "i paid credit card bill half of 150"
 * - "groceries at whole foods 85.50"
 * - "uber to airport 45"
 */

export interface ParsedExpense {
  amount: number;
  currency: string;
  description: string;
  merchant?: string;
  category?: string;
  category_id?: string;
  date?: Date;
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  isRecurring?: boolean;
  recurrencePattern?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  paymentMethod?: 'cash' | 'card' | 'credit' | 'debit' | 'upi' | 'bank' | 'other';
  split?: {
    type: 'half' | 'percentage' | 'amount';
    value: number;
    withWhom?: string;
  };
  tags?: string[];
  confidence: number; // 0-1
  originalText: string;
}

export interface ParsedQuery {
  type: 'expense' | 'income' | 'transfer' | 'query' | 'credit_card_check' | 'category_summary';
  data: ParsedExpense | ParsedQueryData;
  confidence: number;
}

export interface ParsedQueryData {
  question: string;
  timeRange?: { start: Date; end: Date };
  category?: string;
  creditCard?: string;
  metric?: 'total' | 'average' | 'count' | 'projection';
}

const CURRENCY_PATTERNS = [
  { regex: /\$(\d+(?:,\d{3})*(?:\.\d{2})?)/g, currency: 'USD' },
  { regex: /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:dollars?|usd|\$)/gi, currency: 'USD' },
  { regex: /₹(\d+(?:,\d{3})*(?:\.\d{2})?)/g, currency: 'INR' },
  { regex: /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:rupees?|inr|rs\.?)/gi, currency: 'INR' },
  { regex: /€(\d+(?:,\d{3})*(?:\.\d{2})?)/g, currency: 'EUR' },
  { regex: /£(\d+(?:,\d{3})*(?:\.\d{2})?)/g, currency: 'GBP' },
  { regex: /CA\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/g, currency: 'CAD' },
  { regex: /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:cad|canadian dollars?)/gi, currency: 'CAD' },
];

const TIME_OF_DAY_PATTERNS = [
  { regex: /\b(morning|breakfast|brunch)\b/i, value: 'morning' as const },
  { regex: /\b(afternoon|lunch)\b/i, value: 'afternoon' as const },
  { regex: /\b(evening|dinner|party|drinks)\b/i, value: 'evening' as const },
  { regex: /\b(night|late|midnight)\b/i, value: 'night' as const },
];

const MERCHANT_PATTERNS = [
  // "at <merchant>" or "<merchant> for"
  /\bat\s+([a-zA-Z][a-zA-Z0-9\s&'.-]{1,50}?)(?:\s+(?:for|cost|was|is|total|paid|spent|\d|$))/i,
  // "from <merchant>"
  /\bfrom\s+([a-zA-Z][a-zA-Z0-9\s&'.-]{1,50}?)(?:\s+(?:for|cost|was|is|total|paid|spent|\d|$))/i,
  // "<merchant> <amount>" at end
  /([a-zA-Z][a-zA-Z0-9\s&'.-]{2,50}?)\s+\$?\d+(?:,\d{3})*(?:\.\d{2})?\s*$/i,
];

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'food_dining': ['restaurant', 'cafe', 'coffee', 'tea', 'lunch', 'dinner', 'breakfast', 'brunch', 'food', 'meal', 'eat', 'dining', 'pizza', 'burger', 'sushi', 'taco', 'starbucks', 'tim hortons', 'tim horton', 'mcdonald', 'subway', 'chipotle', 'zaza', 'bar', 'pub', 'drinks', 'alcohol', 'beer', 'wine', 'cocktail'],
  'groceries': ['grocery', 'groceries', 'supermarket', 'whole foods', 'walmart', 'target', 'costco', 'kroger', 'safeway', 'aldi', 'trader joe', 'market', 'produce', 'food shopping'],
  'transport': ['uber', 'lyft', 'taxi', 'cab', 'bus', 'train', 'subway', 'metro', 'transit', 'gas', 'fuel', 'parking', 'toll', 'flight', 'airline', 'airport', 'airbnb', 'hotel'],
  'shopping': ['amazon', 'store', 'shop', 'mall', 'outlet', 'clothing', 'clothes', 'shoes', 'electronics', 'best buy', 'apple store', 'nike', 'adidas', 'zara', 'h&m', 'uniqlo'],
  'entertainment': ['movie', 'cinema', 'theater', 'concert', 'show', 'netflix', 'spotify', 'disney', 'hulu', 'prime', 'gaming', 'game', 'steam', 'playstation', 'xbox', 'nintendo', 'party', 'event', 'ticket'],
  'health': ['pharmacy', 'drugstore', 'cvs', 'walgreens', 'doctor', 'hospital', 'clinic', 'dentist', 'therapy', 'medicine', 'vitamin', 'supplement', 'gym', 'fitness', 'yoga', 'pilates'],
  'utilities': ['electric', 'electricity', 'water', 'gas bill', 'internet', 'wifi', 'phone', 'mobile', 'cable', 'streaming', 'utility', 'bill'],
  'housing': ['rent', 'mortgage', 'hoa', 'maintenance', 'repair', 'furniture', 'appliance', 'home depot', 'lowes', 'ikea'],
  'education': ['tuition', 'course', 'class', 'book', 'textbook', 'udemy', 'coursera', 'skillshare', 'workshop', 'training', 'certification'],
  'personal': ['haircut', 'salon', 'spa', 'massage', 'nails', 'barber', 'grooming', 'beauty', 'cosmetics', 'skincare', 'laundry', 'dry cleaning'],
  'subscriptions': ['subscription', 'monthly', 'annual', 'yearly', 'membership', 'prime', 'netflix', 'spotify', 'github', 'notion', 'figma', 'adobe'],
  'income': ['salary', 'paycheck', 'wage', 'income', 'freelance', 'client', 'project', 'bonus', 'commission', 'dividend', 'interest', 'refund', 'reimbursement'],
  'transfer': ['transfer', 'sent', 'received', 'venmo', 'zelle', 'paypal', 'wise', 'revolut', 'bank transfer', 'wire', 'ach'],
  'credit_card': ['credit card', 'cc bill', 'card payment', 'statement balance', 'minimum payment', 'full payment', 'paid off'],
  'investment': ['invest', 'stock', 'etf', 'mutual fund', 'crypto', 'bitcoin', 'ethereum', 'roth ira', '401k', 'pension', 'retirement'],
  'insurance': ['insurance', 'premium', 'geico', 'progressive', 'state farm', 'allstate', 'health insurance', 'car insurance', 'home insurance', 'life insurance'],
};

const RECURRING_PATTERNS = [
  { regex: /\b(daily|every day)\b/i, pattern: 'daily' as const },
  { regex: /\b(weekly|every week|each week)\b/i, pattern: 'weekly' as const },
  { regex: /\b(monthly|every month|each month)\b/i, pattern: 'monthly' as const },
  { regex: /\b(yearly|annually|every year|each year)\b/i, pattern: 'yearly' as const },
];

const PAYMENT_METHOD_PATTERNS = [
  { regex: /\b(cash)\b/i, method: 'cash' as const },
  { regex: /\b(credit card|cc|visa|mastercard|amex|discover)\b/i, method: 'credit' as const },
  { regex: /\b(debit card|debit)\b/i, method: 'debit' as const },
  { regex: /\b(upi|google pay|apple pay|phonepe|paytm)\b/i, method: 'upi' as const },
  { regex: /\b(bank|bank transfer|ach|wire)\b/i, method: 'bank' as const },
  { regex: /\b(card)\b/i, method: 'card' as const },
];

const SPLIT_PATTERNS = [
  { regex: /\bhalf\b(?: of)?/i, type: 'half' as const, value: 0.5 },
  { regex: /\b(\d+(?:\.\d+)?)\s*%\b/i, type: 'percentage' as const, valueGroup: 1, value: 0 },
  { regex: /\bsplit\s+(?:with|between)\s+([a-zA-Z\s]+)/i, type: 'half' as const, value: 0.5, withWhomGroup: 1 },
  { regex: /\bmy share\b/i, type: 'half' as const, value: 0.5 },
];

const QUERY_PATTERNS = [
  { regex: /\bhow much\b.*\b(?:spent|spend|paid|pay)\b/i, type: 'category_summary' as const },
  { regex: /\bwhat (?:did i|do i)\b.*\b(?:spent|spend|paid|pay)\b/i, type: 'category_summary' as const },
  { regex: /\bshow me\b.*\b(?:spending|expenses|transactions)\b/i, type: 'category_summary' as const },
  { regex: /\bcredit card\b.*\b(?:how much|what|balance|due|payment|bill)\b/i, type: 'credit_card_check' as const },
  { regex: /\b(?:what|how much)\b.*\b(?:do i owe|owe|balance)\b.*\bcredit card\b/i, type: 'credit_card_check' as const },
  { regex: /\bprojection\b|\bpredict\b|\bforecast\b/i, type: 'category_summary' as const },
];

function extractAmount(text: string): { amount: number; currency: string; remaining: string } | null {
  for (const { regex, currency } of CURRENCY_PATTERNS) {
    const matches = [...text.matchAll(regex)];
    if (matches.length > 0) {
      // Take the last match (usually the total)
      const match = matches[matches.length - 1];
      const amountStr = match[1].replace(/,/g, '');
      const amount = parseFloat(amountStr);
      if (!isNaN(amount)) {
        const remaining = text.replace(match[0], '').trim();
        return { amount, currency, remaining };
      }
    }
  }
  return null;
}

function extractTimeOfDay(text: string): 'morning' | 'afternoon' | 'evening' | 'night' | null {
  for (const { regex, value } of TIME_OF_DAY_PATTERNS) {
    if (regex.test(text)) return value;
  }
  return null;
}

function extractMerchant(text: string): string | null {
  for (const regex of MERCHANT_PATTERNS) {
    const match = text.match(regex);
    if (match && match[1]) {
      let merchant = match[1].trim();
      // Clean up common trailing words
      merchant = merchant.replace(/\b(for|cost|was|is|total|paid|spent)\b$/i, '').trim();
      if (merchant.length >= 2) return merchant;
    }
  }
  return null;
}

function extractCategory(text: string, merchant?: string | null): string | null {
  const searchText = `${text} ${merchant || ''}`.toLowerCase();
  
  let bestMatch: { category: string; score: number } | null = null;
  
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let score = 0;
    for (const keyword of keywords) {
      if (searchText.includes(keyword.toLowerCase())) {
        score += keyword.length; // Longer matches = more specific
      }
    }
    if (score > 0 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { category, score };
    }
  }
  
  return bestMatch?.category || null;
}

function extractRecurring(text: string): { pattern: 'daily' | 'weekly' | 'monthly' | 'yearly' } | null {
  for (const { regex, pattern } of RECURRING_PATTERNS) {
    if (regex.test(text)) return { pattern };
  }
  return null;
}

function extractPaymentMethod(text: string): 'cash' | 'card' | 'credit' | 'debit' | 'upi' | 'bank' | 'other' | null {
  for (const { regex, method } of PAYMENT_METHOD_PATTERNS) {
    if (regex.test(text)) return method;
  }
  return null;
}

function extractSplit(text: string): { type: 'half' | 'percentage' | 'amount'; value: number; withWhom?: string } | null {
  for (const pattern of SPLIT_PATTERNS) {
    const match = text.match(pattern.regex);
    if (match) {
      if (pattern.type === 'percentage' && pattern.valueGroup) {
        return { type: 'percentage', value: parseFloat(match[pattern.valueGroup]) / 100 };
      }
      if (pattern.withWhomGroup && match[pattern.withWhomGroup]) {
        return { type: pattern.type, value: pattern.value, withWhom: match[pattern.withWhomGroup].trim() };
      }
      return { type: pattern.type, value: pattern.value ?? 0.5 };
    }
  }
  return null;
}

function extractDate(text: string): Date | null {
  // Today, yesterday, tomorrow
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (/\b(today)\b/i.test(text)) return today;
  if (/\b(yesterday)\b/i.test(text)) {
    const d = new Date(today);
    d.setDate(d.getDate() - 1);
    return d;
  }
  if (/\b(tomorrow)\b/i.test(text)) {
    const d = new Date(today);
    d.setDate(d.getDate() + 1);
    return d;
  }
  
  // Day names
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  for (let i = 0; i < days.length; i++) {
    if (new RegExp(`\\b${days[i]}\\b`, 'i').test(text)) {
      const d = new Date(today);
      const targetDay = i;
      const currentDay = d.getDay();
      let diff = targetDay - currentDay;
      if (diff < 0) diff += 7; // Next week
      d.setDate(d.getDate() + diff);
      return d;
    }
  }
  
  // MM/DD or DD/MM
  const dateMatch = text.match(/\b(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?\b/);
  if (dateMatch) {
    const month = parseInt(dateMatch[1], 10) - 1;
    const day = parseInt(dateMatch[2], 10);
    const year = dateMatch[3] ? parseInt(dateMatch[3], 10) : today.getFullYear();
    const fullYear = year < 100 ? 2000 + year : year;
    const d = new Date(fullYear, month, day);
    if (!isNaN(d.getTime())) return d;
  }
  
  // Month name + day
  const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
  for (let i = 0; i < months.length; i++) {
    const regex = new RegExp(`\\b${months[i]}\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b`, 'i');
    const match = text.match(regex);
    if (match) {
      const day = parseInt(match[1], 10);
      const d = new Date(today.getFullYear(), i, day);
      if (!isNaN(d.getTime())) return d;
    }
  }
  
  return null;
}

function isQuery(text: string): ParsedQueryData | null {
  const lower = text.toLowerCase();
  
  // Credit card check
  for (const { regex, type } of QUERY_PATTERNS) {
    if (regex.test(lower)) {
      let timeRange: { start: Date; end: Date } | undefined;
      let category: string | undefined;
      let creditCard: string | undefined;
      let metric: 'total' | 'average' | 'count' | 'projection' = 'total';
      
      // Extract time range
      if (/\bthis month\b/i.test(lower)) {
        timeRange = { start: getMonthStart(), end: getMonthEnd() };
      } else if (/\blast month\b/i.test(lower)) {
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        timeRange = { start: getMonthStart(lastMonth), end: getMonthEnd(lastMonth) };
      } else if (/\bthis week\b/i.test(lower)) {
        timeRange = { start: getWeekStart(), end: new Date() };
      } else if (/\blast week\b/i.test(lower)) {
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);
        timeRange = { start: getWeekStart(lastWeek), end: new Date(lastWeek) };
      } else if (/\bthis year\b/i.test(lower)) {
        timeRange = { start: getYearStart(), end: getYearEnd() };
      }
      
      // Extract category
      for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        for (const kw of keywords) {
          if (lower.includes(kw.toLowerCase())) {
            category = cat;
            break;
          }
        }
        if (category) break;
      }
      
      // Extract credit card name
      const ccMatch = lower.match(/(?:credit card|card)\s+([a-zA-Z0-9\s]+?)(?:\s|$)/);
      if (ccMatch) creditCard = ccMatch[1].trim();
      
      // Metric
      if (/\baverage\b/i.test(lower)) metric = 'average';
      else if (/\bcount\b|\bnumber\b|\bhow many\b/i.test(lower)) metric = 'count';
      else if (/\bprojection\b|\bpredict\b|\bforecast\b/i.test(lower)) metric = 'projection';
      
      return { question: text, timeRange, category, creditCard, metric };
    }
  }
  
  return null;
}

export function parseNaturalLanguage(text: string): ParsedQuery {
  const originalText = text;
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();
  
  // First check if it's a query
  const queryData = isQuery(trimmed);
  if (queryData) {
    return {
      type: queryData.category ? 'category_summary' : (queryData.creditCard ? 'credit_card_check' : 'query'),
      data: queryData,
      confidence: 0.85,
    };
  }
  
  // Check for income keywords
  const isIncome = /\b(received|got|earned|salary|paycheck|income|freelance|client|bonus|refund|reimbursement|dividend|interest)\b/i.test(lower);
  const isTransfer = /\b(transfer|sent|received|venmo|zelle|paypal|wise|revolut)\b/i.test(lower);
  
  // Extract amount
  const amountResult = extractAmount(trimmed);
  if (!amountResult) {
    return {
      type: 'expense',
      data: {
        amount: 0,
        currency: 'USD',
        description: trimmed,
        confidence: 0.1,
        originalText: trimmed,
      },
      confidence: 0.1,
    };
  }
  
  const { amount, currency, remaining } = amountResult;
  
  // Extract other components from remaining text
  const timeOfDay = extractTimeOfDay(remaining);
  const merchant = extractMerchant(remaining);
  const category = extractCategory(remaining, merchant);
  const recurring = extractRecurring(remaining);
  const paymentMethod = extractPaymentMethod(remaining);
  const split = extractSplit(remaining);
  const date = extractDate(remaining);
  
  // Build description
  let description = merchant || remaining.replace(/^\s*(?:at|from|for)\s+/i, '').trim();
  if (timeOfDay) description = `${timeOfDay} ${description}`;
  
  // Tags
  const tags: string[] = [];
  if (timeOfDay) tags.push(timeOfDay);
  if (recurring) tags.push('recurring', recurring.pattern);
  if (paymentMethod) tags.push(paymentMethod);
  if (split) tags.push('split');
  
  const parsedExpense: ParsedExpense = {
    amount: isIncome ? Math.abs(amount) : -Math.abs(amount), // Negative for expenses
    currency,
    description: description || 'Uncategorized',
    merchant: merchant || undefined,
    category: category || 'uncategorized',
    date: date || new Date(),
    timeOfDay: timeOfDay ?? undefined,
    isRecurring: !!recurring,
    recurrencePattern: recurring?.pattern,
    paymentMethod: paymentMethod || undefined,
    split: split ?? undefined,
    tags: tags || [],
    confidence: 0.9,
    originalText: trimmed,
  };
  
  return {
    type: isIncome ? 'income' : (isTransfer ? 'transfer' : 'expense'),
    data: parsedExpense,
    confidence: 0.9,
  };
}

// Helper functions for date ranges
function getMonthStart(date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getMonthEnd(date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
}

function getWeekStart(date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
}

function getYearStart(date = new Date()): Date {
  return new Date(date.getFullYear(), 0, 1);
}

function getYearEnd(date = new Date()): Date {
  return new Date(date.getFullYear(), 11, 31, 23, 59, 59);
}

export function parseMultipleEntries(text: string): ParsedQuery[] {
  // Split by common separators
  const entries = text.split(/(?:\n|;|,|\.| and | then )+/).filter(e => e.trim().length > 2);
  return entries.map(e => parseNaturalLanguage(e.trim()));
}

export function formatParsedExpense(expense: ParsedExpense): string {
  const parts: string[] = [];
  parts.push(`${expense.amount < 0 ? '💸' : '💰'} ${formatCurrency(Math.abs(expense.amount), expense.currency)}`);
  if (expense.merchant) parts.push(`@ ${expense.merchant}`);
  if (expense.category && expense.category !== 'uncategorized') parts.push(`[${expense.category.replace('_', ' ')}]`);
  if (expense.timeOfDay) parts.push(`🕐 ${expense.timeOfDay}`);
  if (expense.split) parts.push(`🔀 split ${expense.split.type === 'half' ? '50%' : `${expense.split.value * 100}%`}`);
  if (expense.isRecurring) parts.push(`🔄 ${expense.recurrencePattern}`);
  return parts.join(' · ');
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 2 }).format(amount);
}