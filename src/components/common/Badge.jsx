import React from 'react';
import { getStatusBadge } from '../../utils/formatters';

export const Badge = ({ status, text, variant }) => {
  const badgeConfig = getStatusBadge(status || text || variant);
  const displayText = text || badgeConfig.label;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${badgeConfig.bg}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${badgeConfig.dot}`} />
      <span className="capitalize">{displayText}</span>
    </span>
  );
};

export default Badge;

