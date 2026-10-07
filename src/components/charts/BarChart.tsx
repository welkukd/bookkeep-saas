'use client';

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from 'recharts';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';

interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: string | number;
}

interface BarChartProps extends React.HTMLAttributes<HTMLDivElement> {
  data: ChartDataPoint[];
  xKey?: string;
  yKey?: string;
  color?: string;
  gradientColors?: string[];
  height?: number;
  showGrid?: boolean;
  showTooltip?: boolean;
  showLegend?: boolean;
  currency?: string;
  horizontal?: boolean;
  animate?: boolean;
  radius?: [number, number, number, number];
}

export function BarChartComponent({
  data,
  xKey = 'name',
  yKey = 'value',
  color = 'var(--color-trust-500)',
  gradientColors,
  height = 300,
  showGrid = false,
  showTooltip = true,
  showLegend = false,
  currency = 'USD',
  horizontal = false,
  animate = true,
  radius = [6, 6, 0, 0] as [number, number, number, number],
  className,
  ...props
}: BarChartProps) {
  const gradientId = `bar-gradient-${yKey}-${Math.random().toString(36).substr(2, 9)}`;

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) => {
    if (!active || !payload || !payload.length) return null;
    
    return (
      <div className="glass-card-elevated p-3 rounded-xl shadow-glass-lg border border-border min-w-[160px]">
        <p className="text-caption text-text-muted mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-body font-medium text-text-primary flex items-center gap-2">
            <span className="w-2 h-2 rounded" style={{ backgroundColor: entry.color }} />
            {formatCurrency(entry.value, currency)}
          </p>
        ))}
      </div>
    );
  };

  const CustomLegend = ({ payload }: { payload?: Array<{ value: string; color: string }> }) => (
    <div className="flex flex-wrap gap-4 justify-center pt-4">
      {payload?.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 text-body-sm text-text-secondary">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: entry.color }} />
          <span>{entry.value}</span>
        </div>
      ))}
    </div>
  );

  if (horizontal) {
    return (
      <div className={cn('w-full', className)} {...props}>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            {gradientColors && (
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={gradientColors[0]} stopOpacity={1} />
                  <stop offset="100%" stopColor={gradientColors[1] || gradientColors[0]} stopOpacity={1} />
                </linearGradient>
              </defs>
            )}
            
            {showGrid && (
              <CartesianGrid
                strokeDasharray="4 4"
                stroke="var(--color-border)"
                vertical={true}
                horizontal={false}
              />
            )}
            
            <YAxis
              type="category"
              dataKey={xKey}
              tick={{ fill: 'var(--color-text-secondary)', fontSize: 12, fontFamily: 'var(--font-sans)' }}
              axisLine={false}
              tickLine={false}
              width={120}
            />
            
            <XAxis
              tickFormatter={(value) => formatCurrency(value, currency).replace(/\.00$/, '')}
              tick={{ fill: 'var(--color-text-muted)', fontSize: 11, fontFamily: 'var(--font-sans)' }}
              axisLine={false}
              tickLine={false}
            />
            
            {showTooltip && <Tooltip content={<CustomTooltip />} />}
            {showLegend && <Legend content={<CustomLegend />} />}
            
            <Bar
              dataKey={yKey}
              fill={gradientColors ? `url(#${gradientId})` : color}
              radius={radius}
              maxBarSize={40}
              animationDuration={animate ? 1000 : 0}
              animationEasing="ease-out"
              isAnimationActive={animate}
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={gradientColors ? `url(#${gradientId})` : color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className={cn('w-full', className)} {...props}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          {gradientColors && (
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={gradientColors[0]} stopOpacity={1} />
                <stop offset="100%" stopColor={gradientColors[1] || gradientColors[0]} stopOpacity={1} />
              </linearGradient>
            </defs>
          )}
          
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
            tick={{ fill: 'var(--color-text-secondary)', fontSize: 12, fontFamily: 'var(--font-sans)' }}
            axisLine={false}
            tickLine={false}
            tickMargin={8}
          />
          
          <YAxis
            tickFormatter={(value) => formatCurrency(value, currency).replace(/\.00$/, '')}
            tick={{ fill: 'var(--color-text-muted)', fontSize: 11, fontFamily: 'var(--font-sans)' }}
            axisLine={false}
            tickLine={false}
            width={60}
          />
          
          {showTooltip && <Tooltip content={<CustomTooltip />} />}
          {showLegend && <Legend content={<CustomLegend />} />}
          
          <Bar
            dataKey={yKey}
            fill={gradientColors ? `url(#${gradientId})` : color}
            radius={radius}
            maxBarSize={50}
            animationDuration={animate ? 1000 : 0}
            animationEasing="ease-out"
            isAnimationActive={animate}
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={gradientColors ? `url(#${gradientId})` : color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface GroupedBarChartProps extends React.HTMLAttributes<HTMLDivElement> {
  data: ChartDataPoint[];
  xKey: string;
  series: Array<{
    key: string;
    name: string;
    color: string;
  }>;
  height?: number;
  showGrid?: boolean;
  showTooltip?: boolean;
  showLegend?: boolean;
  currency?: string;
  animate?: boolean;
}

export function GroupedBarChart({
  data,
  xKey,
  series,
  height = 300,
  showGrid = false,
  showTooltip = true,
  showLegend = true,
  currency = 'USD',
  animate = true,
  className,
  ...props
}: GroupedBarChartProps) {
  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string; dataKey: string }>; label?: string }) => {
    if (!active || !payload || !payload.length) return null;
    
    return (
      <div className="glass-card-elevated p-3 rounded-xl shadow-glass-lg border border-border min-w-[180px]">
        <p className="text-caption text-text-muted mb-2">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-body-sm font-medium flex items-center gap-2" style={{ color: entry.color }}>
            <span className="w-2 h-2 rounded" style={{ backgroundColor: entry.color }} />
            <span>{entry.name}:</span>
            <span className="ml-auto text-text-primary">{formatCurrency(entry.value, currency)}</span>
          </p>
        ))}
      </div>
    );
  };

  const CustomLegend = ({ payload }: { payload?: Array<{ value: string; color: string }> }) => (
    <div className="flex flex-wrap gap-4 justify-center pt-4">
      {payload?.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 text-body-sm text-text-secondary">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: entry.color }} />
          <span>{entry.value}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div className={cn('w-full', className)} {...props}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
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
            tick={{ fill: 'var(--color-text-secondary)', fontSize: 12, fontFamily: 'var(--font-sans)' }}
            axisLine={false}
            tickLine={false}
            tickMargin={8}
          />
          
          <YAxis
            tickFormatter={(value) => formatCurrency(value, currency).replace(/\.00$/, '')}
            tick={{ fill: 'var(--color-text-muted)', fontSize: 11, fontFamily: 'var(--font-sans)' }}
            axisLine={false}
            tickLine={false}
            width={60}
          />
          
          {showTooltip && <Tooltip content={<CustomTooltip />} />}
          {showLegend && <Legend content={<CustomLegend />} />}
          
          {series.map((s, i) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.name}
              fill={s.color}
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
              animationDuration={animate ? 800 + i * 100 : 0}
              animationEasing="ease-out"
              isAnimationActive={animate}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}