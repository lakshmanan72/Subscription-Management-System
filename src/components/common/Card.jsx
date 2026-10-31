import React from 'react';

export const Card = ({
  children,
  title,
  subtitle,
  actions,
  className = '',
  bodyClassName = 'p-5 sm:p-6',
  headerClassName = 'px-5 py-4 border-b border-slate-100',
  footer,
}) => {
  return (
    <div className={`bg-white rounded-xl border border-slate-200/80 shadow-subtle overflow-hidden transition-all ${className}`}>
      {(title || subtitle || actions) && (
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${headerClassName}`}>
          <div>
            {title && <h3 className="text-base font-semibold text-slate-900">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2.5 shrink-0">{actions}</div>}
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
      {footer && <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100">{footer}</div>}
    </div>
  );
};

export default Card;

