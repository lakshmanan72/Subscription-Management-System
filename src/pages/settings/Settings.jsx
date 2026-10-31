import React, { useState } from 'react';
import {
  Building2,
  Receipt,
  Users,
  Shield,
  Bell,
  Plus,
  Trash2,
  CheckCircle2,
  Save,
  RotateCcw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';

export const Settings = () => {
  const { user } = useAuth();
  const {
    settings,
    updateCompanyProfile,
    addStaffMember,
    deleteStaffMember,
    updateTaxConfig,
    updateNotificationPreferences,
    resetAllData,
  } = useData();

  const [activeSection, setActiveSection] = useState('company'); // 'company' | 'taxes' | 'staff' | 'roles' | 'notifications'

  // Company Profile form state
  const [profileForm, setProfileForm] = useState(settings.companyProfile);

  // Staff creation state
  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const [newStaff, setNewStaff] = useState({
    name: '',
    email: '',
    role: 'Billing Admin',
    department: 'Finance',
  });

  // Notification preferences
  const [notifications, setNotifications] = useState(settings.notificationPreferences);

  // Taxes
  const [taxList, setTaxList] = useState(settings.taxConfig);

  const isAdmin = user?.role === 'Super Admin' || !user?.isCustomer;

  const handleSaveProfile = (e) => {
    e.preventDefault();
    updateCompanyProfile(profileForm);
  };

  const handleSaveNotifications = () => {
    updateNotificationPreferences(notifications);
  };

  const handleCreateStaff = (e) => {
    e.preventDefault();
    if (!newStaff.name || !newStaff.email) return;
    addStaffMember(newStaff);
    setIsAddingStaff(false);
    setNewStaff({ name: '', email: '', role: 'Billing Admin', department: 'Finance' });
  };

  const rolesMatrix = [
    { role: 'Super Admin', canProducts: true, canPlans: true, canQuotes: true, canSubs: true, canPayments: true, canStaff: true, canExport: true },
    { role: 'Billing Admin', canProducts: true, canPlans: true, canQuotes: true, canSubs: true, canPayments: true, canStaff: false, canExport: true },
    { role: 'Sales Representative', canProducts: false, canPlans: false, canQuotes: true, canSubs: true, canPayments: false, canStaff: false, canExport: false },
    { role: 'Support Specialist', canProducts: false, canPlans: false, canQuotes: false, canSubs: false, canPayments: false, canStaff: false, canExport: false },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">System Settings</h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure organization legal entity, Indian GST compliance, staff roles, and notifications.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          icon={RotateCcw}
          onClick={resetAllData}
        >
          Reset Demo State
        </Button>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex space-x-1 sm:space-x-2 border-b border-slate-200 overflow-x-auto pb-1">
        {[
          { id: 'company', label: 'Company Profile', icon: Building2 },
          { id: 'taxes', label: 'Tax Configuration', icon: Receipt },
          { id: 'staff', label: 'Staff Management', icon: Users },
          { id: 'roles', label: 'Roles & Permissions', icon: Shield },
          { id: 'notifications', label: 'Notification Rules', icon: Bell },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSection === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-brand-50 text-brand-700 border border-brand-200 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* SECTION 1: COMPANY PROFILE */}
      {activeSection === 'company' && (
        <Card title="Company Profile & Legal Entity" subtitle="Used on computer-generated tax invoices and customer statements">
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Brand Name *
                </label>
                <input
                  type="text"
                  required
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Legal Entity Name *
                </label>
                <input
                  type="text"
                  required
                  value={profileForm.legalName}
                  onChange={(e) => setProfileForm({ ...profileForm, legalName: e.target.value })}
                  className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  GSTIN Tax ID *
                </label>
                <input
                  type="text"
                  required
                  value={profileForm.taxId}
                  onChange={(e) => setProfileForm({ ...profileForm, taxId: e.target.value })}
                  className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-200 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Company PAN
                </label>
                <input
                  type="text"
                  value={profileForm.pan}
                  onChange={(e) => setProfileForm({ ...profileForm, pan: e.target.value })}
                  className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-200 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Currency Symbol & Code
                </label>
                <input
                  type="text"
                  disabled
                  value="INR (₹) — Indian Rupee"
                  className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Billing Email
                </label>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Phone
                </label>
                <input
                  type="text"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Registered Office Address
              </label>
              <textarea
                rows="2"
                value={profileForm.address}
                onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-200 resize-none"
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" variant="primary" icon={Save}>
                Save Company Profile
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* SECTION 2: TAX CONFIGURATION */}
      {activeSection === 'taxes' && (
        <Card title="Indian GST Slabs & Tax Rules" subtitle="Automated tax calculation applied during quotation and invoice creation">
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-4">Tax Description</th>
                    <th className="py-2.5 px-4">Rate (%)</th>
                    <th className="py-2.5 px-4">Applicability</th>
                    <th className="py-2.5 px-4 text-center">Default</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {taxList.map((t) => (
                    <tr key={t.id}>
                      <td className="py-3 px-4 font-semibold text-slate-800">{t.name}</td>
                      <td className="py-3 px-4 font-bold text-brand-600">{t.rate}%</td>
                      <td className="py-3 px-4 text-slate-500">{t.appliesTo}</td>
                      <td className="py-3 px-4 text-center">
                        {t.isDefault ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Default
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-xs text-slate-400 bg-slate-50 p-3 rounded-lg border border-slate-200">
              Tax rules comply with Indian CBIC Goods & Services Tax (GST) e-invoicing architecture standards.
            </p>
          </div>
        </Card>
      )}

      {/* SECTION 3: STAFF MANAGEMENT (Admin only controls!) */}
      {activeSection === 'staff' && (
        <Card
          title="Staff & Internal Team Access"
          subtitle="Users with operational access to the Brightloop billing console"
          actions={
            isAdmin && (
              <Button
                variant="primary"
                size="sm"
                icon={Plus}
                onClick={() => setIsAddingStaff(true)}
              >
                Add Staff Member
              </Button>
            )
          }
          bodyClassName="p-0 overflow-x-auto"
        >
          {!isAdmin && (
            <div className="p-4 bg-amber-50 border-b border-amber-200 text-xs text-amber-800">
              Only Administrators have permission to invite or modify internal staff members.
            </div>
          )}

          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Console Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Last Activity</th>
                {isAdmin && <th className="py-3 px-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {settings.staffMembers?.map((staff) => (
                <tr key={staff.id} className="hover:bg-slate-50/50">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{staff.name}</div>
                    <div className="text-[11px] text-slate-400">{staff.email}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{staff.department}</td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-brand-600 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                      {staff.role}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <Badge status={staff.status} />
                  </td>
                  <td className="py-3 px-4 text-slate-500">{staff.lastActive}</td>
                  {isAdmin && (
                    <td className="py-3 px-4 text-right">
                      {staff.role !== 'Super Admin' && (
                        <button
                          onClick={() => deleteStaffMember(staff.id)}
                          className="p-1 text-slate-400 hover:text-rose-600"
                          title="Remove staff"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Add Staff Drawer/Form */}
          {isAddingStaff && (
            <div className="p-4 bg-slate-50 border-t border-slate-200">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                Invite New Staff Member
              </h4>
              <form onSubmit={handleCreateStaff} className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 items-end">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Aditya Verma"
                    value={newStaff.name}
                    onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    placeholder="aditya@brightloop.io"
                    value={newStaff.email}
                    onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Role Assignment</label>
                  <select
                    value={newStaff.role}
                    onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                  >
                    <option value="Billing Admin">Billing Admin</option>
                    <option value="Sales Representative">Sales Representative</option>
                    <option value="Support Specialist">Support Specialist</option>
                    <option value="Super Admin">Super Admin</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" variant="primary" size="sm">
                    Invite Staff
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsAddingStaff(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          )}
        </Card>
      )}

      {/* SECTION 4: ROLES & PERMISSIONS DISPLAY */}
      {activeSection === 'roles' && (
        <Card title="Role-Based Access Control (RBAC) Matrix" subtitle="Granular permission mapping across billing modules" bodyClassName="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Role Title</th>
                <th className="py-3 px-4 text-center">Manage Products</th>
                <th className="py-3 px-4 text-center">Manage Plans</th>
                <th className="py-3 px-4 text-center">Create Quotes</th>
                <th className="py-3 px-4 text-center">Confirm Subs</th>
                <th className="py-3 px-4 text-center">Record Payments</th>
                <th className="py-3 px-4 text-center">Staff Admin</th>
                <th className="py-3 px-4 text-center">Export Reports</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rolesMatrix.map((r, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 font-bold text-slate-900">{r.role}</td>
                  <td className="py-3 px-4 text-center">{r.canProducts ? <span className="text-emerald-600 font-bold">✓</span> : <span className="text-slate-300">—</span>}</td>
                  <td className="py-3 px-4 text-center">{r.canPlans ? <span className="text-emerald-600 font-bold">✓</span> : <span className="text-slate-300">—</span>}</td>
                  <td className="py-3 px-4 text-center">{r.canQuotes ? <span className="text-emerald-600 font-bold">✓</span> : <span className="text-slate-300">—</span>}</td>
                  <td className="py-3 px-4 text-center">{r.canSubs ? <span className="text-emerald-600 font-bold">✓</span> : <span className="text-slate-300">—</span>}</td>
                  <td className="py-3 px-4 text-center">{r.canPayments ? <span className="text-emerald-600 font-bold">✓</span> : <span className="text-slate-300">—</span>}</td>
                  <td className="py-3 px-4 text-center">{r.canStaff ? <span className="text-emerald-600 font-bold">✓</span> : <span className="text-slate-300">—</span>}</td>
                  <td className="py-3 px-4 text-center">{r.canExport ? <span className="text-emerald-600 font-bold">✓</span> : <span className="text-slate-300">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* SECTION 5: NOTIFICATION PREFERENCES */}
      {activeSection === 'notifications' && (
        <Card title="Automated Event & Notification Dispatch" subtitle="Triggers for invoice dispatch, dunning reminders, and webhooks">
          <div className="space-y-4">
            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications.emailOnInvoiceCreated}
                  onChange={(e) => setNotifications({ ...notifications, emailOnInvoiceCreated: e.target.checked })}
                  className="w-4 h-4 text-brand-600 rounded border-slate-300 mt-0.5 focus:ring-brand-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800">Email Customer on Invoice Generation</span>
                  <p className="text-[11px] text-slate-500">Automatically dispatches PDF copy to client billing contact upon invoice confirmation.</p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications.emailOnPaymentSuccess}
                  onChange={(e) => setNotifications({ ...notifications, emailOnPaymentSuccess: e.target.checked })}
                  className="w-4 h-4 text-brand-600 rounded border-slate-300 mt-0.5 focus:ring-brand-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800">Email Payment Settlement Receipt</span>
                  <p className="text-[11px] text-slate-500">Generates computer-generated payment voucher upon payment recording.</p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications.emailOnSubscriptionExpiry}
                  onChange={(e) => setNotifications({ ...notifications, emailOnSubscriptionExpiry: e.target.checked })}
                  className="w-4 h-4 text-brand-600 rounded border-slate-300 mt-0.5 focus:ring-brand-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800">Subscription Renewal Notice (14 Days Prior)</span>
                  <p className="text-[11px] text-slate-500">Sends reminder notification to customer before auto-billing triggers.</p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications.smsAlertsForOverdue}
                  onChange={(e) => setNotifications({ ...notifications, smsAlertsForOverdue: e.target.checked })}
                  className="w-4 h-4 text-brand-600 rounded border-slate-300 mt-0.5 focus:ring-brand-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800">SMS / WhatsApp Overdue Dunning Alerts</span>
                  <p className="text-[11px] text-slate-500">Dispatches automated reminders for invoices past grace period.</p>
                </div>
              </label>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Slack / Teams Outgoing Webhook URL
              </label>
              <input
                type="text"
                value={notifications.slackWebhookUrl}
                onChange={(e) => setNotifications({ ...notifications, slackWebhookUrl: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 font-mono"
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="primary" onClick={handleSaveNotifications} icon={Save}>
                Save Preferences
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Settings;

