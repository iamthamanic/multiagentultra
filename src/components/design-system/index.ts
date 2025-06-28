/**
 * MultiAgent Ultra Design System Components
 *
 * Type-safe, reusable components following the design system
 * All components are production-ready and lint-compliant
 */

// Component Types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface ButtonProps extends BaseComponentProps {
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

export interface CardProps extends BaseComponentProps {
  variant?: 'default' | 'interactive' | 'selected';
  padding?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

export interface BadgeProps extends BaseComponentProps {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md';
}

export interface InputProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  type?: 'text' | 'email' | 'password' | 'number';
  disabled?: boolean;
  error?: string;
  required?: boolean;
  className?: string;
}

export interface AlertProps extends BaseComponentProps {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  onClose?: () => void;
}

// Design System Constants
export const DS_CLASSES = {
  // Button variants
  button: {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
    success: 'bg-success-600 text-white hover:bg-success-700 focus:ring-success-500',
    warning: 'bg-warning-500 text-white hover:bg-warning-600 focus:ring-warning-500',
    error: 'bg-error-600 text-white hover:bg-error-700 focus:ring-error-500',
    secondary: 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 focus:ring-neutral-500',
    ghost: 'text-neutral-600 hover:bg-neutral-100 focus:ring-neutral-500',
  },

  // Card variants
  card: {
    default: 'bg-white rounded-lg shadow-sm p-6 border border-neutral-200',
    interactive:
      'bg-white p-6 rounded-lg shadow-sm border border-neutral-200 cursor-pointer transition-all hover:shadow-md',
    selected:
      'bg-white p-6 rounded-lg shadow-sm border-2 border-primary-500 ring-2 ring-primary-100',
  },

  // Badge variants
  badge: {
    default: 'px-2 py-1 bg-neutral-100 text-neutral-700 rounded-full text-xs font-medium',
    primary: 'px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-medium',
    success: 'px-2 py-1 bg-success-100 text-success-800 rounded-full text-xs font-medium',
    warning: 'px-2 py-1 bg-warning-100 text-warning-800 rounded-full text-xs font-medium',
    error: 'px-2 py-1 bg-error-100 text-error-800 rounded-full text-xs font-medium',
  },

  // Input states
  input: {
    base: 'w-full border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 placeholder-neutral-500',
    focus: 'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
    error: 'border-error-300 focus:border-error-500 focus:ring-error-500',
    disabled: 'bg-neutral-50 text-neutral-500 cursor-not-allowed',
  },

  // Alert variants
  alert: {
    info: 'bg-primary-50 border border-primary-200 text-primary-800',
    success: 'bg-success-50 border border-success-200 text-success-800',
    warning: 'bg-warning-50 border border-warning-200 text-warning-800',
    error: 'bg-error-50 border border-error-200 text-error-800',
  },

  // Common utilities
  transition: 'transition-colors duration-200',
  focus: 'focus:outline-none focus:ring-2 focus:ring-offset-2',
  disabled: 'disabled:opacity-50 disabled:cursor-not-allowed',
} as const;

// Utility functions
export const cn = (...classes: (string | undefined | false | null)[]): string => {
  return classes.filter(Boolean).join(' ');
};

export const getButtonClasses = (
  variant: ButtonProps['variant'] = 'primary',
  size: ButtonProps['size'] = 'md'
): string => {
  const baseClasses =
    'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses = DS_CLASSES.button[variant];

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return cn(baseClasses, variantClasses, sizeClasses[size]);
};

export const getCardClasses = (variant: CardProps['variant'] = 'default'): string => {
  return DS_CLASSES.card[variant];
};

export const getBadgeClasses = (
  variant: BadgeProps['variant'] = 'default',
  size: BadgeProps['size'] = 'md'
): string => {
  const baseClasses = DS_CLASSES.badge[variant];
  const sizeClasses = size === 'sm' ? 'text-xs px-1.5 py-0.5' : 'text-xs px-2 py-1';

  return cn(baseClasses, sizeClasses);
};

export const getInputClasses = (hasError: boolean = false, disabled: boolean = false): string => {
  return cn(
    DS_CLASSES.input.base,
    DS_CLASSES.input.focus,
    hasError && DS_CLASSES.input.error,
    disabled && DS_CLASSES.input.disabled
  );
};

export const getAlertClasses = (variant: AlertProps['variant'] = 'info'): string => {
  return cn('rounded-lg p-4', DS_CLASSES.alert[variant]);
};

// Export all types
export type { BaseComponentProps, ButtonProps, CardProps, BadgeProps, InputProps, AlertProps };
