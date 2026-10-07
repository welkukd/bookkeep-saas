'use client';

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Dot } from 'recharts';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';

interface ChartDataPoint {
  date: string;
  value: number;
  [key: string]: string | number;
}

interface LineChartProps extends React.HTMLAttributes<HTMLDivElement> {
  data: ChartDataPoint[];
  xKey?: string;
  yKey?: string;
  color?: string;
  strokeWidth?: number;
  dotRadius?: number;
  height?: number;
  showGrid?: boolean;
  showTooltip?: boolean;
  showLegend?: boolean;
  currency?: string;
  animate?: boolean;
  curveType?: 'basis' | 'linear' | 'monotone' | 'natural' | 'step' | 'stepAfter' | 'stepBefore';
}

export function LineChartComponent({
  data,
  xKey = 'date',
  yKey = 'value',
  color = 'var(--color-trust-500)',
  strokeWidth = 2,
  dotRadius = 4,
  height = 300,
  showGrid = false,
  showTooltip = true,
  showLegend = false,
  currency = 'USD',
  animate = true,
  curveType = 'monotone',
  className,
  ...props
}: LineChartProps) {
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
        <LineChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
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
          {showLegend && <Legend />}
          
          <Line
            type={curveType}
            dataKey={yKey}
            stroke={color}
            strokeWidth={strokeWidth}
            dot={false}
            activeDot={{ r: dotRadius + 2, strokeWidth: 2, stroke: color, fill: 'var(--color-background)' }}
            animationDuration={animate ? 1000 : 0}
            animationEasing="ease-out"
            isAnimationActive={animate}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

interface MultiLineChartProps extends React.HTMLAttributes<HTMLDivElement> {
  data: ChartDataPoint[];
  xKey?: string;
  series: Array<{
    key: string;
    name: string;
    color: string;
    strokeWidth?: number;
    dotRadius?: number;
    dashArray?: string;
  }>;
  height?: number;
  showGrid?: boolean;
  showTooltip?: boolean;
  showLegend?: boolean;
  currency?: string;
  animate?: boolean;
  curveType?: 'basis' | 'linear' | 'monotone' | 'natural' | 'step' | 'stepAfter' | 'stepBefore';
}

export function MultiLineChart({
  data,
  xKey = 'date',
  series,
  height = 300,
  showGrid = false,
  showTooltip = true,
  showLegend = true,
  currency = 'USD',
  animate = true,
  curveType = 'monotone',
  className,
  ...props
}: MultiLineChartProps) {
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
        <LineChart
          data={data}
          margin={{ top: 10, right: showLegend ? 20 : 10, left: 0, bottom: 0 }}
        >
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
          {showLegend && <Legend />}
          
          {series.map((s, i) => (
            <Line
              key={s.key}
              type={curveType}
              dataKey={s.key}
              name={s.name}
              stroke={s.color}
              strokeWidth={s.strokeWidth || 2}
              strokeDasharray={s.dashArray}
              dot={false}
              activeDot={{ r: (s.dotRadius || 4) + 2, strokeWidth: 2, stroke: s.color, fill: 'var(--color-background)' }}
              animationDuration={animate ? 800 + i * 100 : 0}
              animationEasing="ease-out"
              isAnimationActive={animate}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}