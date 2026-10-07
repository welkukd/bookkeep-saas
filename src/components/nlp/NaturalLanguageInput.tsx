'use client';

import { useState, useRef, useEffect, FormEvent } from 'react';
import { cn } from '@/lib/utils';
import { parseNaturalLanguage, ParsedQuery, ParsedExpense, ParsedQueryData, formatParsedExpense } from '@/lib/nlp/expense-parser';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Mic, Send, X, Sparkles, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface NaturalLanguageInputProps {
  onSubmit: (parsed: ParsedExpense) => Promise<void>;
  onQuery?: (query: ParsedQuery) => Promise<void>;
  placeholder?: string;
  disabled?: boolean;
  showExamples?: boolean;
}

export function NaturalLanguageInput({
  onSubmit,
  onQuery,
  placeholder = 'Type naturally: "morning coffee at tim hortons $5" or ask "how much did i spend on groceries this month?"',
  disabled = false,
  showExamples = true,
}: NaturalLanguageInputProps) {
  const [input, setInput] = useState('');
  const [parsed, setParsed] = useState<ParsedQuery | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Type guard for ParsedExpense
  const isParsedExpense = (data: ParsedExpense | ParsedQueryData): data is ParsedExpense => {
    return 'amount' in data;
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInput(value);
    setError(null);

    // Debounced parsing
    clearTimeout((window as any).parseTimeout);
    (window as any).parseTimeout = setTimeout(() => {
      if (value.trim().length > 3) {
        const result = parseNaturalLanguage(value);
        setParsed(result);
        setShowPreview(true);
      } else {
        setParsed(null);
        setShowPreview(false);
      }
    }, 300);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    setIsProcessing(true);
    setError(null);

    try {
      if (parsed && (parsed.type === 'query' || parsed.type === 'credit_card_check' || parsed.type === 'category_summary')) {
        if (onQuery) {
          await onQuery(parsed);
        }
      } else if (parsed && (parsed.type === 'expense' || parsed.type === 'income' || parsed.type === 'transfer')) {
        await onSubmit(parsed.data as ParsedExpense);
        setInput('');
        setParsed(null);
        setShowPreview(false);
      } else {
        // Fallback: try to parse as expense
        const result = parseNaturalLanguage(input);
        if (result.type !== 'query') {
          await onSubmit(result.data as ParsedExpense);
          setInput('');
          setParsed(null);
          setShowPreview(false);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const examples = [
    'morning tea at tim hortons 10 dollars',
    'evening party at zaza 190 dollars',
    'i paid credit card bill half of 150',
    'groceries at whole foods 85.50',
    'uber to airport 45',
    'salary received 5000',
    'how much did i spend on groceries this month?',
    'what is my credit card balance?',
  ];

  return (
    <Card variant="elevated" className="w-full">
      <CardContent className="p-6 space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled || isProcessing}
              className={cn(
                'w-full min-h-[56px] max-h-[200px] px-4 py-3 bg-surface border border-border rounded-xl',
                'text-text-primary placeholder-text-muted',
                'focus:outline-none focus:border-border-accent focus:ring-2 focus:ring-trust-500/20',
                'resize-none transition-all duration-200',
                'font-sans text-body',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
              rows={2}
              aria-label="Natural language input"
            />
            <div className="absolute bottom-3 right-3 flex items-center gap-2">
              {parsed && parsed.confidence > 0.5 && (
                <Badge variant="trust" size="sm" className="animate-fade-in">
                  <Sparkles className="w-3 h-3" />
                  Understood
                </Badge>
              )}
              <Button
                type="submit"
                variant="primary"
                size="icon"
                disabled={!input.trim() || isProcessing}
                aria-label="Send"
              >
                {isProcessing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>

          {/* Parsed Preview */}
          {showPreview && parsed && (
            <div className={cn(
              'animate-slide-up p-4 rounded-xl border transition-all duration-300',
              parsed.confidence > 0.7
                ? 'bg-sage-50 dark:bg-sage-900/20 border-sage-200 dark:border-sage-800'
                : 'bg-coral-50 dark:bg-coral-900/20 border-coral-200 dark:border-coral-800'
            )}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {parsed.type === 'query' || parsed.type === 'credit_card_check' || parsed.type === 'category_summary' ? (
                    <div className="flex items-center gap-2 text-body-sm text-text-secondary">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>Question detected: {("question" in parsed.data ? parsed.data.question : "")}</span>\n                    </div>
                  ) : isParsedExpense(parsed.data) ? (
                    <>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge
                          variant={parsed.data.amount < 0 ? 'coral' : 'sage'}
                          size="sm"
                          dot
                        >
                          {parsed.data.amount < 0 ? 'Expense' : 'Income'}
                        </Badge>
                        <span className="text-heading-sm font-display font-medium gradient-text-trust">
                          {formatCurrency(Math.abs(parsed.data.amount), parsed.data.currency)}
                        </span>
                      </div>
                      <p className="text-body text-text-primary">{parsed.data.description}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {parsed.data.merchant && (
                          <Badge variant="slate" size="sm">
                            {parsed.data.merchant}
                          </Badge>
                        )}
                        {parsed.data.category && parsed.data.category !== 'uncategorized' && (
                          <Badge variant="trust" size="sm">
                            {parsed.data.category.replace('_', ' ')}
                          </Badge>
                        )}
                        {parsed.data.timeOfDay && (
                          <Badge variant="slate" size="sm">
                            {parsed.data.timeOfDay}
                          </Badge>
                        )}
                        {parsed.data.split && (
                          <Badge variant="coral" size="sm">
                            Split {parsed.data.split.type === 'half' ? '50%' : `${parsed.data.split.value * 100}%`}
                          </Badge>
                        )}
                        {parsed.data.isRecurring && (
                          <Badge variant="sage" size="sm">
                            🔄 {parsed.data.recurrencePattern}
                          </Badge>
                        )}
                      </div>
                      <p className="text-caption text-text-muted mt-2">
                        Confidence: {Math.round(parsed.confidence * 100)}%
                      </p>
                    </>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => { setParsed(null); setShowPreview(false); }}
                  className="btn-ghost btn-icon-sm text-text-muted hover:text-text-primary flex-shrink-0"
                  aria-label="Dismiss preview"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="animate-slide-down p-3 rounded-xl bg-coral-50 dark:bg-coral-900/20 border border-coral-200 dark:border-coral-800 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-coral-500 flex-shrink-0" />
              <p className="text-body-sm text-coral-700 dark:text-coral-300">{error}</p>
            </div>
          )}

          {showExamples && !input && (
            <div className="pt-2 space-y-2">
              <p className="text-caption text-text-muted">Try saying:</p>
              <div className="flex flex-wrap gap-2">
                {examples.map((ex, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setInput(ex);
                      handleInputChange({ target: { value: ex } } as any);
                      textareaRef.current?.focus();
                    }}
                    className="btn-ghost btn-sm text-body-sm text-text-muted hover:text-text-primary hover:bg-surface px-3 py-1.5"
                    tabIndex={-1}
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}