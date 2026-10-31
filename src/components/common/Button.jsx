import React from 'react';
import { Loader2 } from 'lucide-react';

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  icon: Icon,
  className = '',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

  const variants = {
    primary: 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm focus:ring-brand-500 border border-transparent',
    secondary: 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 shadow-sm focus:ring-brand-500',
    outline: 'bg-transparent text-brand-600 border border-brand-300 hover:bg-brand-50 focus:ring-brand-500',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 shadow-sm focus:ring-rose-500 border border-transparent',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm focus:ring-emerald-500 border border-transparent',
  };

  const sizes = {
    sm: 'text-xs px-2.5 py-1.5 gap-1.5',
    md: 'text-sm px-3.5 py-2 gap-2',
    lg: 'text-base px-4 py-2.5 gap-2.5',
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : Icon ? (
        <Icon className="w-4 h-4 shrink-0" />
      ) : null}
      {children}
    </button>
  );
};

export default Button;

