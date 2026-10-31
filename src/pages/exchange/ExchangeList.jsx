import React, { useState } from 'react';
import {
  ShoppingBag,
  Plus,
  ShieldCheck,
  CheckCircle2,
  FileCheck2,
  Zap,
  Clock,
  ArrowRight,
  Sparkles,
  Users2,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { formatINR, formatDate } from '../../utils/formatters';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';

export const ExchangeList = () => {
  const {
    exchangeProviders,
    exchangeOfferings,
    exchangeInterestRequests,
    products,
    plans,
    createExchangeProvider,
    createExchangeOffering,
    convertInterestRequestToQuotation,
  } = useData();

  const [activeTab, setActiveTab] = useState('offerings');

  // Provider Modal
  const [isProviderModalOpen, setIsProviderModalOpen] = useState(false);
  const [providerName, setProviderName] = useState('');
  const [providerEmail, setProviderEmail] = useState('');
  const [providerDescription, setProviderDescription] = useState('');
  const [isCreatingProvider, setIsCreatingProvider] = useState(false);

  // Offering Modal
  const [isOfferingModalOpen, setIsOfferingModalOpen] = useState(false);
  const [selectedProviderId, setSelectedProviderId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [offeringName, setOfferingName] = useState('');
  const [offeringDesc, setOfferingDesc] = useState('');
  const [offeringPrice, setOfferingPrice] = useState(12999);
  const [billingFrequency, setBillingFrequency] = useState('Monthly');
  const [availabilityTarget, setAvailabilityTarget] = useState(99.9);
  const [latencyTarget, setLatencyTarget] = useState(120);
  const [creditPolicy, setCreditPolicy] = useState('10% credit for each 0.1% availability deficit');
  const [isCreatingOffering, setIsCreatingOffering] = useState(false);

  // Convert Interest State
  const [convertingId, setConvertingId] = useState(null);

  const handleCreateProvider = async (e) => {
    e.preventDefault();
    if (!providerName || !providerEmail) return;
    setIsCreatingProvider(true);
    try {
      await createExchangeProvider({
        provider_name: providerName,
        contact_email: providerEmail,
        description: providerDescription,
      });
      setIsProviderModalOpen(false);
    } catch {
      // handled
    } finally {
      setIsCreatingProvider(false);
    }
  };

  const handleCreateOffering = async (e) => {
    e.preventDefault();
    if (!selectedProviderId || !offeringName) return;
    setIsCreatingOffering(true);
    try {
      await createExchangeOffering({
        provider_id: selectedProviderId,
        product_id: selectedProductId || null,
        plan_id: selectedPlanId || null,
        name: offeringName,
        description: offeringDesc,
        price: Number(offeringPrice),
        billing_frequency: billingFrequency,
        credit_policy: creditPolicy,
        commitments: [
          {
            commitment_type: 'Availability Guarantee',
            target_value: Number(availabilityTarget),
            tolerance_threshold: 0.05,
            penalty_credit_percentage: 10.0,
          },
          {
            commitment_type: 'Response Latency',
            target_value: Number(latencyTarget),
            tolerance_threshold: 15.0,
            penalty_credit_percentage: 5.0,
          },
        ],
      });
      setIsOfferingModalOpen(false);
    } catch {
      // handled
    } finally {
      setIsCreatingOffering(false);
    }
  };

  const handleConvertInterest = async (id) => {
    setConvertingId(id);
    try {
      await convertInterestRequestToQuotation(id);
    } catch {
      // handled
    } finally {
      setConvertingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-600 text-xs font-semibold uppercase tracking-wider mb-1">
            <ShoppingBag className="w-4 h-4" />
            <span>Innovation Module 4</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Outcome Exchange Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Curate verified provider offerings, manage SLA commitments, and seamlessly convert customer interest requests into Brightloop quotations.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            icon={Users2}
            onClick={() => setIsProviderModalOpen(true)}
            className="text-xs text-blue-700 border-blue-300 hover:bg-blue-50"
          >
            Register Provider
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => {
              if (exchangeProviders.length > 0) setSelectedProviderId(exchangeProviders[0].id);
              if (products.length > 0) setSelectedProductId(products[0].id);
              if (plans.length > 0) setSelectedPlanId(plans[0].id);
              setIsOfferingModalOpen(true);
            }}
            className="text-xs bg-blue-600 hover:bg-blue-700"
          >
            Publish Offering
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-6 text-xs font-medium">
          <button
            onClick={() => setActiveTab('offerings')}
            className={`pb-3 border-b-2 transition-colors ${
              activeTab === 'offerings'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Subscription Offerings ({exchangeOfferings.length})
          </button>
          <button
            onClick={() => setActiveTab('interests')}
            className={`pb-3 border-b-2 transition-colors ${
              activeTab === 'interests'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Customer Interest & Quotation Pipeline ({exchangeInterestRequests.length})
          </button>
          <button
            onClick={() => setActiveTab('providers')}
            className={`pb-3 border-b-2 transition-colors ${
              activeTab === 'providers'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Verified Provider Profiles ({exchangeProviders.length})
          </button>
        </nav>
      </div>

      {/* Tab 1: Offerings */}
      {activeTab === 'offerings' && (
        <div className="space-y-4">
          <Card bodyClassName="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 text-[10px] uppercase border-b border-slate-100 bg-slate-50/50">
                    <th className="py-3 px-4">Offering #</th>
                    <th className="py-3 px-4">Offering Name</th>
                    <th className="py-3 px-4">Provider</th>
                    <th className="py-3 px-4 text-right">Price</th>
                    <th className="py-3 px-4">Contractual SLA Commitments</th>
                    <th className="py-3 px-4">Credit Policy</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {exchangeOfferings.map((off) => (
                    <tr key={off.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-600">
                        {off.offering_number || off.offeringNumber || off.id}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">{off.name}</td>
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-slate-700">{off.provider_name || off.providerName}</span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-slate-900 text-sm">
                        {formatINR(off.price)}{' '}
                        <span className="text-[10px] text-slate-400 font-normal">/ {off.billingFrequency}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1.5">
                          {off.commitments?.map((c) => (
                            <span
                              key={c.id}
                              className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-semibold"
                            >
                              {c.commitment_type}: {c.target_value}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate" title={off.credit_policy}>
                        {off.credit_policy || 'Standard deterministic credit formula'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Badge status={off.is_active !== false ? 'Active' : 'Draft'} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 2: Customer Interest Pipeline */}
      {activeTab === 'interests' && (
        <div className="space-y-4">
          <Card bodyClassName="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 text-[10px] uppercase border-b border-slate-100 bg-slate-50/50">
                    <th className="py-3 px-4">Request #</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Requested Offering</th>
                    <th className="py-3 px-4 text-center">Units</th>
                    <th className="py-3 px-4">Timeline</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4">Converted Quotation</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {exchangeInterestRequests.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        No customer interest requests in pipeline.
                      </td>
                    </tr>
                  ) : (
                    exchangeInterestRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-blue-600">
                          {req.request_number || req.id}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-800 block">{req.customer_name}</span>
                          <span className="text-[10px] text-slate-400">{req.customer_id}</span>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-800">{req.offering_name}</td>
                        <td className="py-3.5 px-4 text-center font-bold text-slate-700">{req.quantity}</td>
                        <td className="py-3.5 px-4 text-slate-600">{req.expected_implementation_timeline}</td>
                        <td className="py-3.5 px-4 text-center">
                          <Badge status={req.status} />
                        </td>
                        <td className="py-3.5 px-4">
                          {req.converted_quotation_id ? (
                            <span className="font-mono text-[11px] font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                              {req.converted_quotation_number || req.converted_quotation_id}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Not converted yet</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {!req.converted_quotation_id ? (
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => handleConvertInterest(req.id)}
                              isLoading={convertingId === req.id}
                              className="text-[11px] py-1 px-2.5 bg-blue-600 hover:bg-blue-700 whitespace-nowrap"
                            >
                              Convert to Quotation
                            </Button>
                          ) : (
                            <span className="text-emerald-600 font-bold text-[11px] flex items-center justify-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Converted
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 3: Providers */}
      {activeTab === 'providers' && (
        <div className="space-y-4">
          <Card bodyClassName="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 text-[10px] uppercase border-b border-slate-100 bg-slate-50/50">
                    <th className="py-3 px-4">Provider Name</th>
                    <th className="py-3 px-4">Contact Email</th>
                    <th className="py-3 px-4">Verified SLA Track Record</th>
                    <th className="py-3 px-4">Historical Availability</th>
                    <th className="py-3 px-4">Joined On</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {exchangeProviders.map((prov) => (
                    <tr key={prov.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-800 block">{prov.provider_name}</span>
                        <span className="text-[10px] text-slate-500">{prov.description}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium">{prov.contact_email}</td>
                      <td className="py-3.5 px-4">
                        {prov.is_verified ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> Verified Provider
                          </span>
                        ) : (
                          <span className="text-slate-400">Standard Tier</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                        {prov.historical_uptime ? `${prov.historical_uptime}%` : '99.9%'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">{formatDate(prov.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Modal: Register Provider */}
      <Modal
        isOpen={isProviderModalOpen}
        onClose={() => setIsProviderModalOpen(false)}
        title="Register Exchange Provider"
        subtitle="Add a new subscription provider eligible to list outcome-based offerings."
      >
        <form onSubmit={handleCreateProvider} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Provider Name *</label>
            <input
              type="text"
              placeholder="e.g. CloudScale Solutions Pvt Ltd"
              value={providerName}
              onChange={(e) => setProviderName(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Email *</label>
            <input
              type="email"
              placeholder="e.g. partner@cloudscale.in"
              value={providerEmail}
              onChange={(e) => setProviderEmail(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description & Services</label>
            <textarea
              rows={2}
              placeholder="e.g. Enterprise high-availability cloud storage & compute cluster provider."
              value={providerDescription}
              onChange={(e) => setProviderDescription(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => setIsProviderModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isCreatingProvider}>
              Register Provider
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Publish Offering */}
      <Modal
        isOpen={isOfferingModalOpen}
        onClose={() => setIsOfferingModalOpen(false)}
        title="Publish Outcome-Backed Offering"
        subtitle="List a subscription package with contractual SLA guarantees in the Outcome Exchange."
      >
        <form onSubmit={handleCreateOffering} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Provider *</label>
              <select
                value={selectedProviderId}
                onChange={(e) => setSelectedProviderId(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                required
              >
                {exchangeProviders.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.provider_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Offering Name *</label>
              <input
                type="text"
                placeholder="e.g. UltraScale Analytics Cluster"
                value={offeringName}
                onChange={(e) => setOfferingName(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Offering Price (₹) *</label>
              <input
                type="number"
                min="0"
                value={offeringPrice}
                onChange={(e) => setOfferingPrice(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Billing Frequency *</label>
              <select
                value={billingFrequency}
                onChange={(e) => setBillingFrequency(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                required
              >
                <option value="Monthly">Monthly</option>
                <option value="Yearly">Yearly</option>
                <option value="Weekly">Weekly</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Offering Description</label>
            <textarea
              rows={2}
              placeholder="Describe target workloads, enterprise capabilities, and features..."
              value={offeringDesc}
              onChange={(e) => setOfferingDesc(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 space-y-3">
            <span className="text-xs font-bold text-blue-900 block">Contractual SLA Commitments</span>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Availability Target (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={availabilityTarget}
                  onChange={(e) => setAvailabilityTarget(e.target.value)}
                  className="w-full text-xs rounded border border-slate-300 px-2 py-1.5"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Max Latency SLA (ms)</label>
                <input
                  type="number"
                  value={latencyTarget}
                  onChange={(e) => setLatencyTarget(e.target.value)}
                  className="w-full text-xs rounded border border-slate-300 px-2 py-1.5"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Credit Remedy Policy</label>
              <input
                type="text"
                value={creditPolicy}
                onChange={(e) => setCreditPolicy(e.target.value)}
                className="w-full text-xs rounded border border-slate-300 px-2 py-1.5"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => setIsOfferingModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isCreatingOffering}>
              Publish Offering
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ExchangeList;
