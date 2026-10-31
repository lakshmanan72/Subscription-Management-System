import React, { useState, useRef, useEffect } from 'react';
import { Bell, CheckCircle2, AlertCircle, Clock, CreditCard, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth, ROLES } from '../../context/AuthContext';

export const NotificationsDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const isStaff = user?.role === ROLES.STAFF;

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'Invoice Overdue Warning',
      description: 'Invoice INV-2024-0081 for Zenith Tech is past its due date (₹11,352).',
      time: '12m ago',
      type: 'warning',
      read: false,
      link: '/invoices/INV-2024-001',
    },
    {
      id: 2,
      title: 'Payment Reconciled',
      description: '₹26,550 received via Card from Apex Dynamics.',
      time: '1h ago',
      type: 'success',
      read: false,
      link: '/payments',
    },
    {
      id: 3,
      title: 'Subscription Paused',
      description: 'Subscription SUB-2024-0004 for Starlight Logistics was paused.',
      time: '3h ago',
      type: 'info',
      read: true,
      link: '/subscriptions/SUB-2024-004',
    },
  ]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const handleNotificationClick = (link) => {
    setIsOpen(false);
    const target = isStaff ? `/staff${link}` : link;
    navigate(target);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-modal border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/70">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-sm text-slate-900">Notifications</h4>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-brand-100 text-brand-700">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-brand-600 hover:text-brand-800 font-medium"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n.link)}
                className={`p-3.5 hover:bg-slate-50 cursor-pointer transition-colors flex items-start gap-3 ${!n.read ? 'bg-brand-50/20' : ''}`}
              >
                <div className="mt-0.5 shrink-0">
                  {n.type === 'warning' ? (
                    <AlertCircle className="w-4 h-4 text-rose-500" />
                  ) : n.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Clock className="w-4 h-4 text-blue-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="text-xs font-semibold text-slate-800 truncate">{n.title}</p>
                    <span className="text-[10px] text-slate-400 shrink-0">{n.time}</span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{n.description}</p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0 self-center" />
              </div>
            ))}
          </div>

          <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 text-center">
            <span className="text-xs text-slate-400">All alerts synchronized with billing engine</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsDropdown;
