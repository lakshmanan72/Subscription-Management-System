import React from 'react';
import { PackageOpen } from 'lucide-react';
import Button from './Button';

export const EmptyState = ({
  icon: Icon = PackageOpen,
  title = 'No records found',
  description = 'Get started by creating your first entry.',
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 ${className}`}>
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3.5 border border-slate-200">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-slate-800 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mb-5">{description}</p>
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;

