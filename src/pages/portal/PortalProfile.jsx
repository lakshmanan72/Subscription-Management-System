import React, { useState, useEffect } from 'react';
import { User, Building, Mail, Phone, MapPin, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useData } from '../../context/DataContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';

export const PortalProfile = () => {
  const { portalCustomer, updateCustomer } = useData();

  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    gstin: '',
  });

  useEffect(() => {
    if (portalCustomer) {
      setFormData({
        name: portalCustomer.name || '',
        company: portalCustomer.company || '',
        email: portalCustomer.email || '',
        phone: portalCustomer.phone || '',
        address: portalCustomer.address || '',
        city: portalCustomer.city || '',
        gstin: portalCustomer.gstin || '',
      });
    }
  }, [portalCustomer]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (portalCustomer) {
      updateCustomer(portalCustomer.id, formData);
      toast.success('Your profile details have been updated.');
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">Account & Billing Profile</h1>
        <p className="text-xs text-slate-500 mt-1">
          Maintain your corporate legal entity information for GST tax invoice generation.
        </p>
      </div>

      <Card bodyClassName="p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
            <img
              src={portalCustomer?.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'}
              alt={formData.name}
              className="w-16 h-16 rounded-2xl object-cover ring-2 ring-slate-200"
            />
            <div>
              <h3 className="text-base font-bold text-slate-900">{formData.name}</h3>
              <p className="text-xs text-brand-600 font-semibold">{formData.company}</p>
              <span className="text-[11px] text-slate-400">Customer ID: {portalCustomer?.id}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Primary Contact Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Registered Company Name *
              </label>
              <input
                type="text"
                required
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Billing Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Contact Phone
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Indian GSTIN Tax ID
              </label>
              <input
                type="text"
                value={formData.gstin}
                onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-brand-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                City, State, Country
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Registered Office Address
            </label>
            <textarea
              rows="2"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
          </div>

          <div className="flex justify-end pt-3">
            <Button type="submit" variant="primary" icon={CheckCircle2}>
              Save Profile Changes
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default PortalProfile;

