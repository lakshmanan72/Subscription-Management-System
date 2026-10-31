import React, { useState } from 'react';
import { Plus, Search, Filter, Edit, Power, Check, X, Layers, Calendar, Clock } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { formatINR, formatDate } from '../../utils/formatters';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import PlanModal from './PlanModal';

export const PlansList = () => {
  const { plans, addPlan, updatePlan, togglePlanStatus } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [freqFilter, setFreqFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [planToEdit, setPlanToEdit] = useState(null);

  const filtered = plans.filter((pl) => {
    const matchesQuery =
      pl.planName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pl.productName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pl.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFreq = freqFilter === 'ALL' || pl.billingFrequency === freqFilter;
    const matchesStatus = statusFilter === 'ALL' || pl.status === statusFilter;

    return matchesQuery && matchesFreq && matchesStatus;
  });

  const handleSave = (planData) => {
    if (planToEdit) {
      updatePlan(planToEdit.id, planData);
    } else {
      addPlan(planData);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Subscription Plans</h1>
          <p className="text-xs text-slate-500 mt-1">
            Standard recurring packaging across Daily, Weekly, Monthly, and Yearly cadences.
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          icon={Plus}
          onClick={() => {
            setPlanToEdit(null);
            setIsModalOpen(true);
          }}
        >
          Create Plan
        </Button>
      </div>

      {/* Filter & Search */}
      <Card bodyClassName="p-3 sm:p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search plan title, linked product..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white text-slate-800"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={freqFilter}
              onChange={(e) => setFreqFilter(e.target.value)}
              className="text-xs px-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-700 outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
            >
              <option value="ALL">All Frequencies</option>
              <option value="Daily">Daily</option>
              <option value="Weekly">Weekly</option>
              <option value="Monthly">Monthly</option>
              <option value="Yearly">Yearly</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs px-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-700 outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
            >
              <option value="ALL">All Status</option>
              <option value="Active">Active</option>
              <option value="Disabled">Disabled</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Plans Grid */}
      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={Layers}
            title="No subscription plans found"
            description="Create your first subscription packaging structure to begin billing."
            actionLabel="Create Plan"
            onAction={() => {
              setPlanToEdit(null);
              setIsModalOpen(true);
            }}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((plan) => {
            const isActive = plan.status === 'Active';

            return (
              <div
                key={plan.id}
                className={`bg-white rounded-2xl border transition-all duration-200 shadow-subtle hover:shadow-card flex flex-col justify-between overflow-hidden ${
                  isActive ? 'border-slate-200/90' : 'border-slate-200 opacity-70 bg-slate-50/50'
                }`}
              >
                <div className="p-5 sm:p-6 space-y-4">
                  {/* Top row: frequency pill & status toggle */}
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200/70">
                      {plan.billingFrequency} Cadence
                    </span>
                    <button
                      onClick={() => togglePlanStatus(plan.id)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                          : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                      }`}
                      title={isActive ? 'Click to disable' : 'Click to activate'}
                    >
                      <Power className="w-3.5 h-3.5" />
                      <span>{isActive ? 'Active' : 'Disabled'}</span>
                    </button>
                  </div>

                  {/* Plan Name & Pricing */}
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{plan.planName}</h3>
                    <p className="text-xs text-brand-600 font-medium mt-0.5">
                      {plan.productName || 'Brightloop Service'}
                    </p>
                    <div className="mt-3 flex items-baseline gap-1">
                      <span className="text-2xl font-black text-slate-900 tracking-tight">
                        {formatINR(plan.price)}
                      </span>
                      <span className="text-xs text-slate-500">
                        / {plan.billingFrequency.toLowerCase()}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {plan.description || 'Enterprise recurring plan with standard SLAs.'}
                  </p>

                  {/* Permissions & Rules Checklist */}
                  <div className="pt-3 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Min Order Qty:</span>
                      <span className="font-semibold text-slate-800">{plan.minQuantity || 1} seat(s)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Customer Pause:</span>
                      <span className={plan.allowPause ? 'text-emerald-600 font-medium' : 'text-slate-400'}>
                        {plan.allowPause ? 'Allowed' : 'Disabled'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Early Termination:</span>
                      <span className={plan.allowEarlyClosure ? 'text-emerald-600 font-medium' : 'text-slate-400'}>
                        {plan.allowEarlyClosure ? 'Allowed' : 'Not permitted'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Contract End Date:</span>
                      <span className="font-medium text-slate-700">{formatDate(plan.endDate)}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Edit Button */}
                <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    ID: {plan.id}
                  </span>
                  <button
                    onClick={() => {
                      setPlanToEdit(plan);
                      setIsModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-800 transition-colors"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Edit Plan</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Plan Modal */}
      <PlanModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setPlanToEdit(null);
        }}
        onSave={handleSave}
        planToEdit={planToEdit}
      />
    </div>
  );
};

export default PlansList;

