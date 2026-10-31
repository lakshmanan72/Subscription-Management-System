import React, { useState } from 'react';
import {
  ShoppingBag,
  CheckCircle2,
  Filter,
  ArrowRight,
  ShieldCheck,
  Zap,
  Clock,
  Sparkles,
  HelpCircle,
  FileCheck2,
  DollarSign,
  Layers,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { formatINR, formatDate } from '../../utils/formatters';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';

export const PortalOutcomeExchange = () => {
  const {
    portalCustomer,
    exchangeProviders,
    exchangeOfferings,
    exchangeInterestRequests,
    submitOfferingInterest,
  } = useData();

  // Filters
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [maxPrice, setMaxPrice] = useState('');
  const [minAvailability, setMinAvailability] = useState('');

  // Interest Modal
  const [selectedOffering, setSelectedOffering] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [timeline, setTimeline] = useState('Immediate (Next 7 Days)');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter offerings
  const filteredOfferings = exchangeOfferings.filter((offering) => {
    if (selectedCategory !== 'All' && offering.category && offering.category !== selectedCategory) {
      return false;
    }
    if (maxPrice && offering.price > Number(maxPrice)) {
      return false;
    }
    if (minAvailability) {
      const avail = offering.commitments?.find((c) =>
        c.commitment_type?.toLowerCase().includes('avail')
      );
      if (avail && avail.target_value < Number(minAvailability)) {
        return false;
      }
    }
    return true;
  });

  // Filter interest requests for this customer
  const myInterests = exchangeInterestRequests.filter(
    (r) =>
      r.customerId === portalCustomer?.id ||
      (portalCustomer?.id && r.customer_id === portalCustomer.id) ||
      (portalCustomer?.email && r.customer_email?.toLowerCase() === portalCustomer.email.toLowerCase())
  );

  const handleOpenInterestModal = (offering) => {
    setSelectedOffering(offering);
    setQuantity(1);
    setTimeline('Immediate (Next 7 Days)');
    setNotes('');
  };

  const handleSubmitInterest = async (e) => {
    e.preventDefault();
    if (!selectedOffering) return;
    setIsSubmitting(true);
    try {
      await submitOfferingInterest({
        offering_id: selectedOffering.id,
        quantity: Number(quantity),
        expected_implementation_timeline: timeline,
        notes: notes || 'Expressed interest via Customer Outcome Exchange Marketplace',
      });
      setSelectedOffering(null);
    } catch {
      // toast in context
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-900 p-6 rounded-2xl text-white shadow-md">
        <div>
          <div className="flex items-center gap-2 text-blue-300 text-xs font-semibold uppercase tracking-wider mb-1">
            <ShoppingBag className="w-4 h-4" />
            <span>Subscription Outcome Exchange</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">Contractual Outcome Marketplace</h1>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Compare subscription offerings based on promised service outcomes, verified SLA telemetry, and contractual
            credit remedies rather than static list prices alone.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-blue-200">
            {exchangeOfferings.length} Verified Offerings Available
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <Card bodyClassName="p-4">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-slate-700">
            <Filter className="w-4 h-4 text-brand-600" />
            <span>Filter Offerings:</span>
          </div>

          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 bg-white text-slate-700 focus:ring-2 focus:ring-brand-500 outline-none"
            >
              <option value="All">All Categories</option>
              <option value="Cloud Infrastructure">Cloud Infrastructure</option>
              <option value="Enterprise SaaS">Enterprise SaaS</option>
              <option value="Analytics">Analytics & Data</option>
            </select>
          </div>

          <div>
            <input
              type="number"
              placeholder="Max Price (₹)"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-36 rounded-lg border border-slate-300 px-3 py-1.5 text-slate-700 focus:ring-2 focus:ring-brand-500 outline-none"
            />
          </div>

          <div>
            <select
              value={minAvailability}
              onChange={(e) => setMinAvailability(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 bg-white text-slate-700 focus:ring-2 focus:ring-brand-500 outline-none"
            >
              <option value="">Any Availability</option>
              <option value="99.0">Min 99.0% SLA</option>
              <option value="99.5">Min 99.5% SLA</option>
              <option value="99.9">Min 99.9% High Availability</option>
            </select>
          </div>

          {(selectedCategory !== 'All' || maxPrice || minAvailability) && (
            <button
              onClick={() => {
                setSelectedCategory('All');
                setMaxPrice('');
                setMinAvailability('');
              }}
              className="text-brand-600 hover:text-brand-800 font-semibold underline"
            >
              Reset Filters
            </button>
          )}
        </div>
      </Card>

      {/* Offerings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOfferings.map((offering) => {
          const provider = exchangeProviders.find((p) => p.id === offering.provider_id);
          const availCommitment = offering.commitments?.find((c) =>
            c.commitment_type?.toLowerCase().includes('avail')
          );
          const latencyCommitment = offering.commitments?.find((c) =>
            c.commitment_type?.toLowerCase().includes('latency') || c.commitment_type?.toLowerCase().includes('response')
          );

          return (
            <div
              key={offering.id}
              className="bg-white rounded-2xl border border-slate-200/90 hover:border-brand-300 transition-all shadow-subtle hover:shadow-card flex flex-col justify-between overflow-hidden"
            >
              <div className="p-5 space-y-4">
                {/* Header & Provider */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        {provider?.provider_name || offering.provider_name}
                      </span>
                      {provider?.is_verified && (
                        <span
                          className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded"
                          title="Verified SLA Track Record"
                        >
                          <ShieldCheck className="w-3 h-3 text-blue-600" /> Verified
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mt-0.5">{offering.name}</h3>
                  </div>

                  <span className="font-mono text-[10px] font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                    {offering.offering_number || offering.offeringNumber}
                  </span>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2">
                  {offering.description || 'Enterprise subscription plan backed by strict contractual SLAs.'}
                </p>

                {/* Price Display */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-baseline justify-between">
                  <div>
                    <span className="text-2xl font-black text-slate-900">{formatINR(offering.price)}</span>
                    <span className="text-xs text-slate-400 ml-1">/ {offering.billingFrequency}</span>
                  </div>
                  <span className="text-[11px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    SLA Protected
                  </span>
                </div>

                {/* Contractual Commitments */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Contractual Commitments & Remedies
                  </span>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-indigo-50/60 border border-indigo-100">
                      <span className="flex items-center gap-1.5 text-indigo-900 font-medium">
                        <Zap className="w-3.5 h-3.5 text-indigo-600" /> Availability Target:
                      </span>
                      <span className="font-bold text-indigo-950">
                        {availCommitment ? `${availCommitment.target_value}%` : '99.9%'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg bg-teal-50/60 border border-teal-100">
                      <span className="flex items-center gap-1.5 text-teal-900 font-medium">
                        <Clock className="w-3.5 h-3.5 text-teal-600" /> Max Latency SLA:
                      </span>
                      <span className="font-bold text-teal-950">
                        {latencyCommitment ? `${latencyCommitment.target_value}ms` : '150ms'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Credit Policy */}
                <div className="text-[11px] text-slate-500 border-t border-slate-100 pt-3">
                  <strong className="text-slate-700">Service Credit Policy:</strong>{' '}
                  {offering.credit_policy || 'Automatic invoice credits calculated deterministically if SLA is breached.'}
                </div>
              </div>

              {/* Action Button */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">Official Brightloop Offering</span>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => handleOpenInterestModal(offering)}
                  className="text-xs"
                >
                  Request Quotation
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Submitted Quotation & Interest Requests */}
      <Card
        title="My Submitted Quotation Requests"
        subtitle="Track submitted interest requests, review sales contact status, and inspect converted quotations."
      >
        {myInterests.length === 0 ? (
          <div className="text-center py-8">
            <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h4 className="text-xs font-semibold text-slate-800">No Active Quotation Requests</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Browse offerings above and click 'Request Quotation' to initiate an outcome-backed agreement.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 text-[10px] uppercase border-b border-slate-100">
                  <th className="py-3 px-4">Request #</th>
                  <th className="py-3 px-4">Offering Name</th>
                  <th className="py-3 px-4 text-center">Seats / Units</th>
                  <th className="py-3 px-4">Implementation Timeline</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">Brightloop Quotation #</th>
                  <th className="py-3 px-4 text-right">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {myInterests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-blue-600">{req.request_number || req.id}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{req.offering_name}</td>
                    <td className="py-3 px-4 text-center">{req.quantity}</td>
                    <td className="py-3 px-4 text-slate-600">{req.expected_implementation_timeline}</td>
                    <td className="py-3 px-4 text-center">
                      <Badge status={req.status} />
                    </td>
                    <td className="py-3 px-4">
                      {req.converted_quotation_id ? (
                        <span className="font-mono text-[11px] font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                          {req.converted_quotation_number || req.converted_quotation_id}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Under review</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-400">{formatDate(req.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Express Interest Modal */}
      {selectedOffering && (
        <Modal
          isOpen={!!selectedOffering}
          onClose={() => setSelectedOffering(null)}
          title={`Request Quotation: ${selectedOffering.name}`}
          subtitle={`By ${selectedOffering.provider_name} • Backed by contractual outcome guarantees.`}
        >
          <form onSubmit={handleSubmitInterest} className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Offering Price:</span>
                <span className="font-bold text-slate-900">
                  {formatINR(selectedOffering.price)} / {selectedOffering.billingFrequency}
                </span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-slate-500">Contractual Availability:</span>
                <span className="font-bold text-indigo-600">
                  {selectedOffering.commitments?.[0]?.target_value || 99.9}% SLA Guaranteed
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Requested Quantity / Licenses *
                </label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:ring-2 focus:ring-brand-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Implementation Timeline *
                </label>
                <select
                  value={timeline}
                  onChange={(e) => setTimeline(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-800 focus:ring-2 focus:ring-brand-500 outline-none"
                  required
                >
                  <option value="Immediate (Next 7 Days)">Immediate (Next 7 Days)</option>
                  <option value="Next 30 Days">Next 30 Days</option>
                  <option value="Next Quarter">Next Quarter</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Custom Requirements or SLA Conditions
              </label>
              <textarea
                rows={3}
                placeholder="Specify any custom integration needs, compliance criteria, or outcome parameters."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" size="sm" onClick={() => setSelectedOffering(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
                Submit Quotation Request
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default PortalOutcomeExchange;
