import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for class merging
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 1. BUTTON
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'warning' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({
  className,
  variant = 'secondary',
  size = 'md',
  children,
  ...props
}) => {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-elem border-thin-gray font-medium transition-all active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 select-none outline-none focus:ring-1 focus:ring-[#0C447C]/40',
        {
          // Clinical primary: Deep blue
          'bg-[#0C447C] text-white hover:bg-[#0B3D70] border-transparent': variant === 'primary',
          // Secondary: Neutral outline
          'bg-[#FFFFFF] dark:bg-[#1A1A1A] hover:bg-[#F5F5F5] dark:hover:bg-[#262626] text-[#333333] dark:text-[#E0E0E0] border-thin-gray':
            variant === 'secondary',
          // Danger: Red outline or background
          'bg-[#A32D2D]/10 hover:bg-[#A32D2D]/20 text-[#A32D2D] border-[#A32D2D]/35': variant === 'danger',
          // Warning: Amber
          'bg-[#633806]/10 hover:bg-[#633806]/20 text-[#D97706] border-[#633806]/35': variant === 'warning',
          // Ghost: minimal padding/borderless
          'bg-transparent hover:bg-black/5 dark:hover:bg-white/5 border-transparent text-[#666666] dark:text-[#A0A0A0]':
            variant === 'ghost',
        },
        {
          'px-3 py-1.5 text-xs': size === 'sm',
          'px-4 py-2 text-sm': size === 'md',
          'px-6 py-3 text-base': size === 'lg',
        },
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

// 2. BADGE
interface BadgeProps {
  variant?: 'success' | 'danger' | 'warning' | 'info' | 'neutral';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'neutral', children, className }) => {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-pill px-2.5 py-0.5 text-xs border border-transparent select-none font-medium',
        {
          'bg-[#0F6E56]/10 text-[#0F6E56] border-[#0F6E56]/20': variant === 'success',
          'bg-[#A32D2D]/10 text-[#A32D2D] border-[#A32D2D]/20': variant === 'danger',
          'bg-[#633806]/10 text-[#D97706] border-[#633806]/20': variant === 'warning',
          'bg-[#0C447C]/10 text-[#0C447C] border-[#0C447C]/20': variant === 'info',
          'bg-[#888888]/10 text-[#888888] border-[#888888]/20': variant === 'neutral',
        },
        className
      )}
    >
      {children}
    </span>
  );
};

// 3. CARD
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({ className, hoverEffect = false, children, ...props }) => {
  return (
    <div
      className={cn(
        'bg-[#FFFFFF] dark:bg-[#161616] rounded-card border-thin-gray p-5 transition-all text-[#333333] dark:text-[#E0E0E0]',
        hoverEffect && 'hover:border-[#0C447C]/30 hover:bg-[#FAFAFA] dark:hover:bg-[#1D1D1D]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

// 4. TOGGLE
interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
}

export const Toggle: React.FC<ToggleProps> = ({ checked, onChange, disabled = false, id }) => {
  return (
    <button
      id={id}
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-pill border border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-40 disabled:pointer-events-none',
        checked ? 'bg-[#0F6E56]' : 'bg-[#E5E5E5] dark:bg-[#2C2C2C]'
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
          checked ? 'translate-x-4' : 'translate-x-0.5',
          'mt-[1px]'
        )}
      />
    </button>
  );
};

// 5. METRIC CARD
interface MetricCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subValue,
  icon,
  badge,
  className,
}) => {
  return (
    <Card className={cn('flex items-start justify-between min-h-[96px]', className)}>
      <div className="flex flex-col gap-1">
        <span className="text-xs text-[#888888] dark:text-[#A0A0A0] tracking-wider uppercase">{title}</span>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-2xl font-medium tracking-tight text-[#111111] dark:text-white">{value}</span>
          {badge}
        </div>
        {subValue && <span className="text-xs text-[#666666] dark:text-[#888888]">{subValue}</span>}
      </div>
      {icon && <div className="text-[#888888] dark:text-[#888888] p-1.5 bg-black/5 dark:bg-white/5 rounded-elem">{icon}</div>}
    </Card>
  );
};

// 6. SKELETON
interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className }) => {
  return (
    <div
      className={cn(
        'animate-pulse bg-[#F0F0F0] dark:bg-[#222222] rounded-elem',
        className
      )}
    />
  );
};

// 7. TOAST
interface ToastProps {
  message: string;
  type?: 'success' | 'danger' | 'warning' | 'info';
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'info', onClose }) => {
  React.useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={cn(
        'fixed bottom-5 right-5 flex items-center gap-3 px-4 py-3 rounded-card border-thin-gray shadow-md z-50 animate-slide-up text-sm',
        {
          'bg-white dark:bg-[#1E1E1E] border-l-4 border-l-[#0F6E56] text-[#333333] dark:text-[#E0E0E0]': type === 'success',
          'bg-white dark:bg-[#1E1E1E] border-l-4 border-l-[#A32D2D] text-[#333333] dark:text-[#E0E0E0]': type === 'danger',
          'bg-white dark:bg-[#1E1E1E] border-l-4 border-l-[#633806] text-[#333333] dark:text-[#E0E0E0]': type === 'warning',
          'bg-white dark:bg-[#1E1E1E] border-l-4 border-l-[#0C447C] text-[#333333] dark:text-[#E0E0E0]': type === 'info',
        }
      )}
    >
      <span className="flex-1 font-medium">{message}</span>
      <button onClick={onClose} className="text-[#888888] hover:text-black dark:hover:text-white text-xs p-1">
        ✕
      </button>
    </div>
  );
};

// 8. MODAL
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footerActions?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footerActions,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#111111]/40 dark:bg-[#000000]/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      {/* Content Card */}
      <div className="relative bg-white dark:bg-[#161616] border-thin-gray rounded-card w-full max-w-lg overflow-hidden shadow-xl z-10 animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E5E5]/60 dark:border-[#2C2C2C]/60">
          <h3 className="text-base font-medium text-[#111111] dark:text-white">{title}</h3>
          <button
            onClick={onClose}
            className="text-[#888888] hover:text-[#333333] dark:hover:text-white transition-colors p-1"
          >
            ✕
          </button>
        </div>
        {/* Body */}
        <div className="px-5 py-5 max-h-[70vh] overflow-y-auto text-[#666666] dark:text-[#A0A0A0] text-sm">
          {children}
        </div>
        {/* Footer */}
        {footerActions && (
          <div className="flex items-center justify-end gap-3 px-5 py-3.5 border-t border-[#E5E5E5]/60 dark:border-[#2C2C2C]/60 bg-[#FAFAFA] dark:bg-[#1A1A1A]">
            {footerActions}
          </div>
        )}
      </div>
    </div>
  );
};
