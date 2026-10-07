'use client';

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { cn } from '@/lib/utils';
import { formatCurrency, formatNumber } from '@/lib/utils';

interface PieChartDataPoint {
  name: string;
  value: number;
  color?: string;
  [key: string]: string | number | undefined;
}

interface PieChartProps extends React.HTMLAttributes<HTMLDivElement> {
  data: PieChartDataPoint[];
  nameKey?: string;
  valueKey?: string;
  colors?: string[];
  height?: number;
  showTooltip?: boolean;
  showLegend?: boolean;
  currency?: string;
  innerRadius?: number;
  outerRadius?: number;
  animate?: boolean;
  showLabels?: boolean;
  labelFormat?: 'currency' | 'number' | 'percentage' | 'both';
}

const DEFAULT_COLORS = [
  'var(--color-trust-500)',
  'var(--color-coral-500)',
  'var(--color-sage-500)',
  'var(--color-slate-500)',
  '#8b5cf6',
  '#ec4899',
  '#f97316',
  '#06b6d4',
];

export function PieChartComponent({
  data,
  nameKey = 'name',
  valueKey = 'value',
  colors = DEFAULT_COLORS,
  height = 300,
  showTooltip = true,
  showLegend = true,
  currency = 'USD',
  innerRadius = 60,
  outerRadius = 100,
  animate = true,
  showLabels = false,
  labelFormat = 'percentage',
  className,
  ...props
}: PieChartProps) {
  const total = data.reduce((sum, item) => sum + (item[valueKey] as number), 0);

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }> }) => {
    if (!active || !payload || !payload.length) return null;
    
    const entry = payload[0];
    const percentage = total > 0 ? ((entry.value / total) * 100).toFixed(1) : '0';
    
    return (
      <div className="glass-card-elevated p-3 rounded-xl shadow-glass-lg border border-border min-w-[180px]">
        <p className="text-body font-medium text-text-primary flex items-center gap-2">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
          {entry.name}
        </p>
        <div className="flex items-center justify-between mt-1">
          <span className="text-body-sm text-text-muted">{formatCurrency(entry.value, currency)}</span>
          <span className="text-body-sm font-medium text-text-secondary">{percentage}%</span>
        </div>
      </div>
    );
  };

  const CustomLegend = ({ payload }: { payload?: Array<{ value: string; color: string }> }) => {
    const legendData = payload?.map((entry, index) => {
      const item = data[index];
      const value = item ? (item[valueKey] as number) : 0;
      const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
      return { ...entry, value, percentage };
    }) || [];

    return (
      <div className="flex flex-col gap-2 pt-4">
        {legendData.map((entry, index) => (
          <div key={index} className="flex items-center gap-3 text-body-sm">
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
            <div className="flex-1 min-w-0">
              <p className="text-text-primary truncate font-medium">{entry.value}</p>
              <p className="text-text-muted text-caption">{entry.percentage}% · {formatCurrency(entry.value, currency)}</p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const CustomLabel = ({ name, percent }: { name: string; percent: number }) => {
    if (!showLabels) return null;
    const percentage = (percent * 100).toFixed(1);
    
    let label = '';
    if (labelFormat === 'percentage') label = `${percentage}%`;
    else if (labelFormat === 'currency') label = formatCurrency(percent * total, currency);
    else if (labelFormat === 'number') label = formatNumber(percent * total);
    else label = `${percentage}%`;

    return (
      <text
        fill="var(--color-text-primary)"
        fontSize="11"
        fontFamily="var(--font-sans)"
        fontWeight={500}
        textAnchor="middle"
        dominantBaseline="middle"
        pointerEvents="none"
      >
        {label}
      </text>
    );
  };

  return (
    <div className={cn('w-full', className)} {...props}>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          {showTooltip && <Tooltip content={<CustomTooltip />} />}
          {showLegend && <Legend content={<CustomLegend />} />}
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={2}
            dataKey={valueKey}
            nameKey={nameKey}
            label={showLabels ? CustomLabel : false}
            labelLine={showLabels}
            startAngle={90}
            endAngle={450}
            animationDuration={animate ? 1000 : 0}
            animationEasing="ease-out"
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

interface DonutChartProps extends Omit<PieChartProps, 'innerRadius' | 'outerRadius'> {
  centerContent?: React.ReactNode;
  centerValue?: number;
  centerLabel?: string;
  centerCurrency?: string;
  innerRadius?: number;
  outerRadius?: number;
}

export function DonutChart({
  data,
  nameKey = 'name',
  valueKey = 'value',
  colors = DEFAULT_COLORS,
  height = 300,
  showTooltip = true,
  showLegend = true,
  currency = 'USD',
  innerRadius = 70,
  outerRadius = 100,
  animate = true,
  showLabels = false,
  labelFormat = 'percentage',
  centerContent,
  centerValue,
  centerLabel,
  centerCurrency = 'USD',
  className,
  ...props
}: DonutChartProps) {
  const total = data.reduce((sum, item) => sum + (item[valueKey] as number), 0);
  const displayValue = centerValue ?? total;

  return (
    <div className={cn('relative w-full', className)} {...props}>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          {showTooltip && <Tooltip content={<CustomTooltip />} />}
          {showLegend && <Legend content={<CustomLegend />} />}
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={2}
            dataKey={valueKey}
            nameKey={nameKey}
            label={showLabels ? CustomLabel : false}
            labelLine={showLabels}
            startAngle={90}
            endAngle={450}
            animationDuration={animate ? 1000 : 0}
            animationEasing="ease-out"
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {centerContent || (
          <div className="text-center">
            <p className="text-display-sm font-display font-medium text-text-primary gradient-text-trust">
              {formatCurrency(displayValue, centerCurrency)}
            </p>
            {centerLabel && (
              <p className="text-body-sm text-text-muted mt-1">{centerLabel}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }> }) => {
  if (!active || !payload || !payload.length) return null;
  const entry = payload[0];
  return (
    <div className="glass-card-elevated p-3 rounded-xl shadow-glass-lg border border-border min-w-[180px]">
      <p className="text-body font-medium text-text-primary flex items-center gap-2">
        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
        {entry.name}
      </p>
    </div>
  );
};

const CustomLegend = ({ payload }: { payload?: Array<{ value: string; color: string }> }) => {
  return (
    <div className="flex flex-wrap gap-4 justify-center pt-4">
      {payload?.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 text-body-sm text-text-secondary">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
          <span>{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

const CustomLabel = ({ name, percent }: { name: string; percent: number }) => {
  return (
    <text
      fill="var(--color-text-primary)"
      fontSize="11"
      fontFamily="var(--font-sans)"
      fontWeight={500}
      textAnchor="middle"
      dominantBaseline="middle"
      pointerEvents="none"
    >
      {(percent * 100).toFixed(0)}%
    </text>
  );
}