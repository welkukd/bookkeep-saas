'use client';

import { forwardRef, HTMLAttributes, ReactNode, isValidElement, cloneElement, ReactElement } from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'trust' | 'coral' | 'sage' | 'slate' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'trust', size = 'md', dot, children, ...props }, ref) => {
    const variantClasses = {
      trust: 'badge-trust',
      coral: 'badge-coral',
      sage: 'badge-sage',
      slate: 'badge-slate',
      outline: 'badge-outline',
    };

    const sizeClasses = {
      sm: 'px-2 py-0.5 text-[0.625rem]',
      md: 'px-3 py-1 text-caption',
      lg: 'px-4 py-1.5 text-body-sm',
    };

    const dotClasses = dot ? 'badge-dot' : '';

    return (
      <span
        ref={ref}
        className={cn('badge', variantClasses[variant], sizeClasses[size], dotClasses, variant && dot && variant, className)}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  name?: string;
  src?: string;
  fallbackColor?: string;
}

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, size = 'md', name, src, fallbackColor, children, ...props }, ref) => {
    const sizeClasses = {
      xs: 'avatar-xs',
      sm: 'avatar-sm',
      md: 'avatar-md',
      lg: 'avatar-lg',
      xl: 'avatar-xl',
    };

    const getInitials = (name: string) => {
      return name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    };

    const getColor = (name: string) => {
      let hash = 0;
      for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
      }
      const hue = hash % 360;
      return `hsl(${hue}, 65%, 55%)`;
    };

    const bgColor = fallbackColor || (name ? getColor(name) : 'var(--color-trust-500)');
    const initials = name ? getInitials(name) : '?';

    return (
      <div
        ref={ref}
        className={cn('avatar', sizeClasses[size], className)}
        style={{ backgroundColor: bgColor }}
        {...props}
      >
        {src ? (
          <img src={src} alt={name || 'Avatar'} className="w-full h-full object-cover" />
        ) : children ? (
          children
        ) : (
          initials
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

interface TooltipProps extends HTMLAttributes<HTMLDivElement> {
  tooltipContent: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  children: ReactElement;
}

export function Tooltip({ tooltipContent, position = 'top', children, className, ...props }: TooltipProps) {
  if (!isValidElement(children)) {
    return <>{children}</>;
  }

  const tooltipClasses = {
    top: 'tooltip tooltip-top',
    bottom: 'tooltip tooltip-bottom',
    left: 'tooltip tooltip-left',
    right: 'tooltip tooltip-right',
  };

  return (
    <div className={cn('relative inline-flex', className)} {...props}>
      {cloneElement(children as ReactElement, {
        className: cn((children as ReactElement).props.className, 'has-tooltip'),
      })}
      <div className={cn('tooltip', tooltipClasses[position])}>
        {tooltipContent}
      </div>
    </div>
  );
}