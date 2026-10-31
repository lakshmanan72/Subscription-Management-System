// Currency, Date and String Formatters

export const formatINR = (amount) => {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹0';
  const numeric = Number(amount);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(numeric);
};

export const formatINRWithDecimals = (amount) => {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹0.00';
  const numeric = Number(amount);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numeric);
};

export const formatDate = (dateString) => {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateString;
  }
};

export const formatDateTime = (dateString) => {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(d);
  } catch {
    return dateString;
  }
};

export const getStatusBadge = (status) => {
  const s = (status || '').toLowerCase();
  switch (s) {
    case 'active':
    case 'paid':
    case 'completed':
    case 'confirmed':
      return {
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
        dot: 'bg-emerald-500',
        label: status,
      };
    case 'quotation':
    case 'pending':
    case 'processing':
    case 'trialing':
      return {
        bg: 'bg-amber-50 text-amber-700 border-amber-200/80',
        dot: 'bg-amber-500',
        label: status,
      };
    case 'draft':
      return {
        bg: 'bg-slate-100 text-slate-700 border-slate-200',
        dot: 'bg-slate-400',
        label: status,
      };
    case 'paused':
      return {
        bg: 'bg-blue-50 text-blue-700 border-blue-200/80',
        dot: 'bg-blue-500',
        label: status,
      };
    case 'overdue':
    case 'cancelled':
    case 'closed':
    case 'failed':
      return {
        bg: 'bg-rose-50 text-rose-700 border-rose-200/80',
        dot: 'bg-rose-500',
        label: status,
      };
    default:
      return {
        bg: 'bg-slate-50 text-slate-600 border-slate-200',
        dot: 'bg-slate-400',
        label: status || 'Unknown',
      };
  }
};

export const exportToCSV = (filename, data, columns) => {
  if (!data || !data.length) return;
  const headerRow = columns.map(c => `"${c.label.replace(/"/g, '""')}"`).join(',');
  const rows = data.map(row => {
    return columns.map(c => {
      let val = row[c.key];
      if (typeof c.accessor === 'function') {
        val = c.accessor(row);
      }
      if (val === undefined || val === null) val = '';
      return `"${String(val).replace(/"/g, '""')}"`;
    }).join(',');
  });

  const csvContent = 'data:text/csv;charset=utf-8,' + [headerRow, ...rows].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

