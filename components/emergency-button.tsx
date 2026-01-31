'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface EmergencyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'safe' | 'caution' | 'danger' | 'primary';
  size?: 'default' | 'lg' | 'xl';
  icon?: React.ReactNode;
  label: string;
  vibrate?: boolean;
}

export function EmergencyButton({
  variant = 'primary',
  size = 'lg',
  icon,
  label,
  vibrate = true,
  className,
  onClick,
  ...props
}: EmergencyButtonProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (vibrate && navigator.vibrate) {
      navigator.vibrate(50);
    }
    onClick?.(e);
  };

  const baseStyles = 'font-bold rounded-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantStyles = {
    safe: 'bg-safe text-safe-foreground hover:brightness-110 focus:ring-2 focus:ring-safe focus:ring-offset-2',
    caution: 'bg-caution text-caution-foreground hover:brightness-110 focus:ring-2 focus:ring-caution focus:ring-offset-2',
    danger: 'bg-danger text-danger-foreground hover:brightness-110 focus:ring-2 focus:ring-danger focus:ring-offset-2',
    primary: 'bg-primary text-primary-foreground hover:brightness-110 focus:ring-2 focus:ring-primary focus:ring-offset-2',
  };

  const sizeStyles = {
    default: 'px-6 py-3 text-base min-h-14 min-w-14',
    lg: 'px-8 py-4 text-lg min-h-20 min-w-20',
    xl: 'px-10 py-6 text-2xl min-h-24 min-w-24',
  };

  return (
    <button
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        'flex flex-col items-center justify-center gap-2',
        className
      )}
      onClick={handleClick}
      {...props}
    >
      {icon && <div className="text-4xl">{icon}</div>}
      <span className="text-center font-bold">{label}</span>
    </button>
  );
}
