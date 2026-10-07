'use client';

import { useState, useEffect } from 'react';
import { formatCurrency, formatRelativeTime, cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton, SkeletonStatCard, SkeletonChart, SkeletonCard } from '@/components/ui/Skeleton';
import { 
  AreaChartComponent, 
  MultiAreaChart, 
  BarChartComponent, 
  GroupedBarChart, 
  PieChartComponent, 
  DonutChart,
  LineChartComponent,
  MultiLineChart
} from '@/components/charts';
import { NaturalLanguageInput } from '@/components/nlp/NaturalLanguageInput';
import { 
  TrendingUp, TrendingDown, DollarSign, CreditCard, 
  Wallet, Target, ArrowUpRight, ArrowDownRight,
  Calendar, Clock, Users, Shield, Sparkles
} from 'lucide-react';

function generateMockTransactions() {
  const categories = [
    { name: 'Food & Dining', color: '#f97316', icon: 'utensils' },
    { name: 'Groceries', color: '#ea580c', icon: 'shopping-cart' },
    { name: 'Transport', color: '#0d9488', icon: 'car' },
    { name: 'Shopping', color: '#c2410c', icon: 'shopping-bag' },
    { name: 'Entertainment', color: '#f97316', icon: 'film' },
    { name: 'Health', color: '#14b8a6', icon: 'heart-pulse' },
    { name: 'Utilities', color: '#0f766e', icon: 'zap' },
    { name: 'Housing', color: '#115e59', icon: 'home' },
  ];

  const merchants = {
    'Food & Dining': ['Starbucks', 'Tim Hortons', 'McDonald&rsquo;s', 'Chipotle', 'Local Bistro'],
    'Groceries': ['Whole Foods', 'Walmart', 'Costco', 'Trader Joe&rsquo;s', 'Local Market'],
    'Transport': ['Uber', 'Lyft', 'Shell Gas', 'Metro Transit', 'Parking'],
    'Shopping': ['Amazon', 'Target', 'Best Buy', 'Nike', 'Zara'],
    'Entertainment': ['Netflix', 'Spotify', 'AMC Theaters', 'Steam', 'Concert Tickets'],
    'Health': ['CVS Pharmacy', 'Gym Membership', 'Dentist', 'Therapy', 'Supplements'],
    'Utilities': ['Electric Bill', 'Internet', 'Phone Bill', 'Water', 'Gas'],
    'Housing': ['Rent', 'Mortgage', 'Home Depot', 'IKEA', 'Repairs'],
  };

  const transactions = [];
  const now = new Date();
  
  for (let i = 0; i < 50; i++) {
    const daysAgo = Math.floor(Math.random() * 90);
    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);
    
    const category = categories[Math.floor(Math.random() * categories.length)];
    const merchantList = merchants[category.name as keyof typeof merchants] || ['Various'];
    const merchant = merchantList[Math.floor(Math.random() * merchantList.length)];
    
    const isIncome = Math.random() < 0.1;
    const amount = isIncome 
      ? Math.round((Math.random() * 3000 + 500) * 100) / 100
      : -Math.round((Math.random() * 200 + 5) * 100) / 100;

    transactions.push({
      id: `txn-${i}`,
      amount,
      currency: 'USD',
      description: `${merchant} - ${category.name}`,
      merchant,
      category: category.name.toLowerCase().replace(' & ', '_').replace(' ', '_'),
      category_color: category.color,
      category_icon: category.icon,
      transaction_date: date.toISOString().split('T')[0],
      time_of_day: ['morning', 'afternoon', 'evening', 'night'][Math.floor(Math.random() * 4)] as any,
      type: isIncome ? 'income' : 'expense',
      status: 'posted',
    });
  }

  return transactions.sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime());
}

function generateMonthlyTrends(transactions: any[]) {
  const months: Record<string, { income: number; expenses: number }> = {};
  
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const key = date.toISOString().slice(0, 7);
    months[key] = { income: 0, expenses: 0 };
  }

  transactions.forEach(txn => {
    const key = txn.transaction_date.slice(0, 7);
    if (months[key]) {
      if (txn.amount > 0) months[key].income += txn.amount;
      else months[key].expenses += Math.abs(txn.amount);
    }
  });

  return Object.entries(months).map(([month, data]) => ({
    month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
    income: data.income,
    expenses: data.expenses,
    net: data.income - data.expenses,
    savings_rate: data.income > 0 ? ((data.income - data.expenses) / data.income) * 100 : 0,
  }));
}

function generateCategoryBreakdown(transactions: any[]) {
  const categoryTotals: Record<string, { amount: number; count: number; color: string; icon: string }> = {};
  
  transactions
    .filter(t => t.amount < 0)
    .forEach(txn => {
      const cat = txn.category;
      if (!categoryTotals[cat]) {
        categoryTotals[cat] = { amount: 0, count: 0, color: txn.category_color, icon: txn.category_icon };
      }
      categoryTotals[cat].amount += Math.abs(txn.amount);
      categoryTotals[cat].count += 1;
    });

  const total = Object.values(categoryTotals).reduce((sum, c) => sum + c.amount, 0);
  
  return Object.entries(categoryTotals)
    .map(([category, data]) => ({
      category: category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      category_id: category,
      amount: data.amount,
      percentage: total > 0 ? (data.amount / total) * 100 : 0,
      color: data.color,
      icon: data.icon,
      count: data.count,
    }))
    .sort((a, b) => b.amount - a.amount);
}

function generateCashFlow(transactions: any[]) {
  const dailyFlow: Record<string, { inflow: number; outflow: number }> = {};
  const now = new Date();
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const key = date.toISOString().split('T')[0];
    dailyFlow[key] = { inflow: 0, outflow: 0 };
  }

  transactions.forEach(txn => {
    const key = txn.transaction_date;
    if (dailyFlow[key]) {
      if (txn.amount > 0) dailyFlow[key].inflow += txn.amount;
      else dailyFlow[key].outflow += Math.abs(txn.amount);
    }
  });

  let runningBalance = 5000;
  return Object.entries(dailyFlow).map(([date, data]) => {
    runningBalance += data.inflow - data.outflow;
    return {
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      inflow: data.inflow,
      outflow: data.outflow,
      net: data.inflow - data.outflow,
      balance: runningBalance,
    };
  });
}

function generateNetWorth(transactions: any[]) {
  const monthlyNetWorth: Record<string, { assets: number; liabilities: number }> = {};
  let assets = 15000;
  let liabilities = 3000;
  
  for (let i = 11; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const key = date.toISOString().slice(0, 7);
    
    assets += (Math.random() - 0.3) * 1000;
    liabilities += (Math.random() - 0.5) * 200;
    liabilities = Math.max(liabilities, 0);
    
    monthlyNetWorth[key] = { assets, liabilities };
  }

  return Object.entries(monthlyNetWorth).map(([month, data]) => ({
    date: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
    assets: data.assets,
    liabilities: data.liabilities,
    net_worth: data.assets - data.liabilities,
  }));
}

export default function DashboardContent() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthlyTrends, setMonthlyTrends] = useState<any[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<any[]>([]);
  const [cashFlow, setCashFlow] = useState<any[]>([]);
  const [netWorth, setNetWorth] = useState<any[]>([]);
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    netFlow: 0,
    savingsRate: 0,
    creditCardDue: 0,
    creditCardBalance: 0,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      const txns = generateMockTransactions();
      setTransactions(txns);
      setMonthlyTrends(generateMonthlyTrends(txns));
      setCategoryBreakdown(generateCategoryBreakdown(txns));
      setCashFlow(generateCashFlow(txns));
      setNetWorth(generateNetWorth(txns));
      
      const thisMonth = txns.filter(t => {
        const txnDate = new Date(t.transaction_date);
        const now = new Date();
        return txnDate.getMonth() === now.getMonth() && txnDate.getFullYear() === now.getFullYear();
      });
      
      const income = thisMonth.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
      const expenses = thisMonth.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
      setSummary({
        totalIncome: income,
        totalExpenses: expenses,
        netFlow: income - expenses,
        savingsRate: income > 0 ? ((income - expenses) / income) * 100 : 0,
        creditCardDue: 245.50,
        creditCardBalance: 1234.56,
      });
      
      setLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  const handleNaturalLanguageSubmit = async (parsed: any) => {
    const newTxn = {
      id: `txn-${Date.now()}`,
      ...parsed,
      transaction_date: parsed.date?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
      status: 'posted',
      type: parsed.amount < 0 ? 'expense' : 'income',
    };
    setTransactions(prev => [newTxn, ...prev]);
    
    if (parsed.amount < 0) {
      setSummary(prev => ({
        ...prev,
        totalExpenses: prev.totalExpenses + Math.abs(parsed.amount),
        netFlow: prev.netFlow - Math.abs(parsed.amount),
      }));
    } else {
      setSummary(prev => ({
        ...prev,
        totalIncome: prev.totalIncome + parsed.amount,
        netFlow: prev.netFlow + parsed.amount,
      }));
    }
  };

  const handleQuery = async (query: any) => {
    console.log('Query:', query.data.question);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <SkeletonStatCard key={i} />
          ))}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonChart />
          <SkeletonChart />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonChart />
          <SkeletonChart />
        </div>

        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div className="container-main space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-display-md font-display font-medium text-text-primary">Dashboard</h1>
          <p className="text-body text-text-muted mt-1">Welcome back! Here&rsquo;s your financial overview.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="trust" dot size="sm">
            <Sparkles className="w-3 h-3" />
            Demo Data
          </Badge>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="elevated">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-caption text-text-muted">Total Income</p>
                <p className="text-heading-lg font-display font-medium gradient-text-trust mt-1">
                  {formatCurrency(summary.totalIncome)}
                </p>
              </div>
              <div className="p-3 bg-sage-100 dark:bg-sage-900/30 rounded-xl">
                <DollarSign className="w-6 h-6 text-sage-600 dark:text-sage-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-body-sm text-sage-600 dark:text-sage-400">
              <TrendingUp className="w-4 h-4" />
              <span>+12.5% vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-caption text-text-muted">Total Expenses</p>
                <p className="text-heading-lg font-display font-medium gradient-text-coral mt-1">
                  {formatCurrency(summary.totalExpenses)}
                </p>
              </div>
              <div className="p-3 bg-coral-100 dark:bg-coral-900/30 rounded-xl">
                <CreditCard className="w-6 h-6 text-coral-600 dark:text-coral-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-body-sm text-coral-600 dark:text-coral-400">
              <TrendingDown className="w-4 h-4" />
              <span>-8.2% vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-caption text-text-muted">Net Cash Flow</p>
                <p className="text-heading-lg font-display font-medium gradient-text-trust mt-1">
                  {formatCurrency(summary.netFlow)}
                </p>
              </div>
              <div className="p-3 bg-trust-100 dark:bg-trust-900/30 rounded-xl">
                <ArrowUpRight className="w-6 h-6 text-trust-600 dark:text-trust-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-body-sm text-trust-600 dark:text-trust-400">
              <TrendingUp className="w-4 h-4" />
              <span>Positive cash flow</span>
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-caption text-text-muted">Savings Rate</p>
                <p className="text-heading-lg font-display font-medium gradient-text-sage mt-1">
                  {summary.savingsRate.toFixed(1)}%
                </p>
              </div>
              <div className="p-3 bg-sage-100 dark:bg-sage-900/30 rounded-xl">
                <Target className="w-6 h-6 text-sage-600 dark:text-sage-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-body-sm text-sage-600 dark:text-sage-400">
              <Shield className="w-4 h-4" />
              <span>Target: 20%+</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Credit Card Alert */}
      <Card variant="elevated" className="border-border-accent">
        <CardContent className="p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-coral-100 dark:bg-coral-900/30 rounded-xl">
                <CreditCard className="w-6 h-6 text-coral-600 dark:text-coral-400" />
              </div>
              <div>
                <p className="text-caption text-text-muted">Credit Card Payment Due</p>
                <p className="text-heading-md font-display font-medium gradient-text-coral">
                  {formatCurrency(summary.creditCardDue)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-body-sm text-text-muted">Current Balance</p>
              <p className="text-heading-sm font-display font-medium text-text-primary">
                {formatCurrency(summary.creditCardBalance)}
              </p>
              <p className="text-caption text-coral-600 dark:text-coral-400 mt-1">
                Due in 12 days • Minimum payment calculated
              </p>
            </div>
            <Button variant="primary" size="sm">
              Make Payment
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Monthly Income vs Expenses</CardTitle>
            <CardDescription>6-month trend with savings rate</CardDescription>
          </CardHeader>
          <CardContent>
            <MultiAreaChart
              data={monthlyTrends}
              xKey="month"
              series={[
                { key: 'income', name: 'Income', color: 'var(--color-sage-500)', gradientColor: 'var(--color-sage-400)' },
                { key: 'expenses', name: 'Expenses', color: 'var(--color-coral-500)', gradientColor: 'var(--color-coral-400)' },
              ]}
              height={300}
              showGrid
              showTooltip
              showLegend
              currency="USD"
            />
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
              {monthlyTrends.slice(-2).map((trend, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-caption text-text-muted">{trend.month}:</span>
                  <span className="text-body-sm font-medium text-text-primary">
                    {trend.savingsRate >= 0 ? '+' : ''}{trend.savingsRate.toFixed(1)}%
                  </span>
                  <span className="text-caption text-text-muted">savings rate</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
            <CardDescription>This month&rsquo;s expense breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <DonutChart
              data={categoryBreakdown.slice(0, 6)}
              height={300}
              showTooltip
              showLegend
              currency="USD"
              innerRadius={70}
              outerRadius={100}
              centerValue={summary.totalExpenses}
              centerLabel="Total Spent"
            />
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Daily Cash Flow</CardTitle>
            <CardDescription>30-day inflow vs outflow</CardDescription>
          </CardHeader>
          <CardContent>
            <GroupedBarChart
              data={cashFlow}
              xKey="date"
              series={[
                { key: 'inflow', name: 'Income', color: 'var(--color-sage-500)' },
                { key: 'outflow', name: 'Expenses', color: 'var(--color-coral-500)' },
              ]}
              height={300}
              showGrid
              showTooltip
              showLegend
              currency="USD"
            />
            <div className="mt-4 flex items-center justify-between text-body-sm">
              <span className="text-text-muted">Net this month:</span>
              <span className="font-medium" style={{ color: summary.netFlow >= 0 ? 'var(--color-sage-600)' : 'var(--color-coral-600)' }}>
                {formatCurrency(cashFlow.reduce((sum, d) => sum + d.net, 0))}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Net Worth Growth</CardTitle>
            <CardDescription>12-month trajectory</CardDescription>
          </CardHeader>
          <CardContent>
            <MultiLineChart
              data={netWorth}
              xKey="date"
              series={[
                { key: 'assets', name: 'Assets', color: 'var(--color-trust-500)', strokeWidth: 2.5 },
                { key: 'liabilities', name: 'Liabilities', color: 'var(--color-coral-500)', strokeWidth: 2 },
                { key: 'net_worth', name: 'Net Worth', color: 'var(--color-sage-500)', strokeWidth: 3 },
              ]}
              height={300}
              showGrid
              showTooltip
              showLegend
              currency="USD"
            />
            <div className="mt-4 flex items-center justify-between text-body-sm">
              <span className="text-text-muted">Current:</span>
              <span className="font-medium gradient-text-trust">
                {formatCurrency(netWorth[netWorth.length - 1]?.net_worth || 0)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Natural Language Input */}
      <Card variant="elevated">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Quick Entry</CardTitle>
              <CardDescription>Type naturally - AI understands context</CardDescription>
            </div>
            <Badge variant="trust" dot>
              <Sparkles className="w-3 h-3" />
              AI Powered
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <NaturalLanguageInput
            onSubmit={handleNaturalLanguageSubmit}
            onQuery={handleQuery}
            placeholder="Try: 'morning coffee at tim hortons $5' or 'how much did I spend on groceries this month?'"
          />
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card variant="elevated">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Latest activity across all accounts</CardDescription>
            </div>
            <Button variant="ghost" size="sm">
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {transactions.slice(0, 10).map((txn, index) => (
              <div
                key={txn.id}
                className="flex items-center justify-between p-4 hover:bg-surface-hover transition-colors"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: txn.category_color + '20' }}
                  >
                    <span className="text-lg" style={{ color: txn.category_color }}>📍</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-body font-medium text-text-primary truncate">
                      {txn.merchant}
                    </p>
                    <p className="text-body-sm text-text-muted flex items-center gap-2">
                      <span>{txn.category.replace('_', ' ')}</span>
                      <span>•</span>
                      <span>{formatRelativeTime(txn.transaction_date)}</span>
                      {txn.time_of_day && (
                        <>
                          <span>•</span>
                          <span className="capitalize">{txn.time_of_day}</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <p className={cn(
                    'text-body font-medium font-mono',
                    txn.amount > 0 ? 'text-sage-600 dark:text-sage-400' : 'text-coral-600 dark:text-coral-400'
                  )}>
                    {txn.amount > 0 ? '+' : ''}{formatCurrency(txn.amount)}
                  </p>
                  <Badge
                    variant={txn.amount > 0 ? 'sage' : 'coral'}
                    size="sm"
                    className="mt-1"
                  >
                    {txn.type}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="ghost" fullWidth>
            Load More Transactions
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}