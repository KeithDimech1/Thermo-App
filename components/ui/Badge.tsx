/**
 * Badge Component
 *
 * Small status indicator for quality ratings and other labels
 */

import React from 'react';
import { cn } from '@/lib/utils/cn';
import { QualityRating } from '@/lib/types/qc-data';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'excellent' | 'good' | 'acceptable' | 'poor' | 'unknown' | 'curated' | 'nat' | 'serology';
  size?: 'sm' | 'md' | 'lg';
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center rounded-full font-medium border';

    const variants = {
      default: 'bg-gray-100 text-gray-800 border-gray-200',
      excellent: 'bg-green-100 text-green-800 border-green-200',
      good: 'bg-blue-100 text-blue-800 border-blue-200',
      acceptable: 'bg-amber-100 text-amber-800 border-amber-200',
      poor: 'bg-red-100 text-red-800 border-red-200',
      unknown: 'bg-gray-100 text-gray-600 border-gray-200',
      curated: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      nat: 'bg-purple-100 text-purple-800 border-purple-200',
      serology: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    };

    const sizes = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-0.5 text-sm',
      lg: 'px-3 py-1 text-base',
    };

    return (
      <span
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

/**
 * Quality Rating Badge
 * Automatically styles based on quality rating
 */
export interface QualityBadgeProps extends Omit<BadgeProps, 'variant'> {
  rating: QualityRating;
  showIcon?: boolean;
}

export const QualityBadge = React.forwardRef<HTMLSpanElement, QualityBadgeProps>(
  ({ rating, showIcon = false, className, ...props }, ref) => {
    const icons = {
      excellent: '★',
      good: '✓',
      acceptable: '!',
      poor: '✗',
      unknown: '?',
    };

    return (
      <Badge
        ref={ref}
        variant={rating}
        className={className}
        {...props}
      >
        {showIcon && <span className="mr-1">{icons[rating]}</span>}
        {rating.charAt(0).toUpperCase() + rating.slice(1)}
      </Badge>
    );
  }
);

QualityBadge.displayName = 'QualityBadge';

/**
 * Dataset Badge
 * Shows the dataset source (Curated, NAT, or Serology Extended)
 */
export interface DatasetBadgeProps extends Omit<BadgeProps, 'variant'> {
  inclusionGroup: string;
}

export const DatasetBadge = React.forwardRef<HTMLSpanElement, DatasetBadgeProps>(
  ({ inclusionGroup, className, ...props }, ref) => {
    // Map CSV filenames to badge variants and display labels
    const getConfig = (group: string) => {
      switch (group) {
        case 'SEROLOGY to include.csv':
          return { variant: 'curated' as const, label: 'Curated (SEROLOGY to include.csv)' };
        case 'NAT raw data.csv':
          return { variant: 'nat' as const, label: 'NAT (NAT raw data.csv)' };
        case 'SEROLOGY raw data.csv':
          return { variant: 'serology' as const, label: 'Extended (SEROLOGY raw data.csv)' };
        // Legacy support (in case old values still exist)
        case 'original_curated':
          return { variant: 'curated' as const, label: 'Curated' };
        case 'nat_data':
          return { variant: 'nat' as const, label: 'NAT' };
        case 'serology_extended':
          return { variant: 'serology' as const, label: 'Serology Extended' };
        default:
          return { variant: 'default' as const, label: group };
      }
    };

    const config = getConfig(inclusionGroup);

    return (
      <Badge
        ref={ref}
        variant={config.variant}
        className={className}
        title={inclusionGroup} // Show full CSV path on hover
        {...props}
      >
        {config.label}
      </Badge>
    );
  }
);

DatasetBadge.displayName = 'DatasetBadge';
