'use client';

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';

interface ChartDataPoint {
  date: string;
  value: number;
  [key: string]: string | number;
}

interface AreaChartProps extends React.HTMLAttributes<HTMLDivElement> {
  data: ChartDataPoint[];
  xKey?: string;
  yKey?: string;
  color?: string;
  gradientColor?: string;
  height?: number;
  showGrid?: boolean;
  showTooltip?: boolean;
  currency?: string;
  animate?: boolean;
}

export function AreaChartComponent({
  data,
  xKey = 'date',
  yKey = 'value',
  color = 'var(--color-trust-500)',
  gradientColor,
  height = 300,
  showGrid = false,
  showTooltip = true,
  currency = 'USD',
  animate = true,
  className,
  ...props
}: AreaChartProps) {
  const gradientId = `gradient-${yKey}-${Math.random().toString(36).substr(2, 9)}`;
  const gradientStopColor = gradientColor || color;

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) => {
    if (!active || !payload || !payload.length) return null;
    
    return (
      <div className="glass-card-elevated p-3 rounded-xl shadow-glass-lg border border-border min-w-[160px]">
        <p className="text-caption text-text-muted mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-body font-medium text-text-primary flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            {formatCurrency(entry.value, currency)}
          </p>
        ))}
      </div>
    );
  };

  const formatXAxis = (value: string) => {
    const date = new Date(value);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className={cn('w-full', className)} {...props}>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={gradientStopColor} stopOpacity={0.3} />
              <stop offset="95%" stopColor={gradientStopColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          
          {showGrid && (
            <CartesianGrid
              strokeDasharray="4 4"
              stroke="var(--color-border)"
              vertical={false}
              horizontal={true}
            />
          )}
          
          <XAxis
            dataKey={xKey}
            tickFormatter={formatXAxis}
            tick={{ fill: 'var(--color-text-muted)', fontSize: 11, fontFamily: 'var(--font-sans)' }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          
          <YAxis
            tickFormatter={(value) => formatCurrency(value, currency).replace(/\.00$/, '')}
            tick={{ fill: 'var(--color-text-muted)', fontSize: 11, fontFamily: 'var(--font-sans)' }}
            axisLine={false}
            tickLine={false}
            width={60}
          />
          
          {showTooltip && <Tooltip content={<CustomTooltip />} />}
          
          <Area
            type="monotone"
            dataKey={yKey}
            stroke={color}
            strokeWidth={2}
            fillOpacity={1}
            fill={`url(#${gradientId})`}
            animationDuration={animate ? 1000 : 0}
            animationEasing="ease-out"
            isAnimationActive={animate}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

interface MultiAreaChartProps extends React.HTMLAttributes<HTMLDivElement> {
  data: ChartDataPoint[];
  xKey?: string;
  series: Array<{
    key: string;
    name: string;
    color: string;
    gradientColor?: string;
  }>;
  height?: number;
  showGrid?: boolean;
  showTooltip?: boolean;
  showLegend?: boolean;
  currency?: string;
  animate?: boolean;
  stacked?: boolean;
}

export function MultiAreaChart({
  data,
  xKey = 'date',
  series,
  height = 300,
  showGrid = false,
  showTooltip = true,
  showLegend = true,
  currency = 'USD',
  animate = true,
  stacked = false,
  className,
  ...props
}: MultiAreaChartProps) {
  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string; dataKey: string }>; label?: string }) => {
    if (!active || !payload || !payload.length) return null;
    
    return (
      <div className="glass-card-elevated p-3 rounded-xl shadow-glass-lg border border-border min-w-[180px]">
        <p className="text-caption text-text-muted mb-2">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-body-sm font-medium flex items-center gap-2" style={{ color: entry.color }}>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span>{entry.name}:</span>
            <span className="ml-auto text-text-primary">{formatCurrency(entry.value, currency)}</span>
          </p>
        ))}
      </div>
    );
  };

  const formatXAxis = (value: string) => {
    const date = new Date(value);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className={cn('w-full', className)} {...props}>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart
          data={data}
          margin={{ top: 10, right: showLegend ? 20 : 10, left: 0, bottom: 0 }}
        >
          {series.map((s, i) => (
            <defs key={s.key}>
              <linearGradient id={`gradient-${s.key}-${Math.random().toString(36).substr(2, 9)}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={s.gradientColor || s.color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={s.gradientColor || s.color} stopOpacity={0} />
              </linearGradient>
            </defs>
          ))}
          
          {showGrid && (
            <CartesianGrid
              strokeDasharray="4 4"
              stroke="var(--color-border)"
              vertical={false}
              horizontal={true}
            />
          )}
          
          <XAxis
            dataKey={xKey}
            tickFormatter={formatXAxis}
            tick={{ fill: 'var(--color-text-muted)', fontSize: 11, fontFamily: 'var(--font-sans)' }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          
          <YAxis
            tickFormatter={(value) => formatCurrency(value, currency).replace(/\.00$/, '')}
            tick={{ fill: 'var(--color-text-muted)', fontSize: 11, fontFamily: 'var(--font-sans)' }}
            axisLine={false}
            tickLine={false}
            width={60}
          />
          
          {showTooltip && <Tooltip content={<CustomTooltip />} />}
          
          {showLegend && (
            <Legend
              wrapperStyle={{ paddingTop: 20 }}
              formatter={(value) => value}
            />
          )}
          
          {series.map((s, i) => (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name}
              stroke={s.color}
              strokeWidth={2}
              fillOpacity={1}
              fill={`url(#gradient-${s.key}-${Math.random().toString(36).substr(2, 9)})`}
              animationDuration={animate ? 800 + i * 100 : 0}
              animationEasing="ease-out"
              isAnimationActive={animate}
              stackId={stacked ? 'stack' : undefined}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}