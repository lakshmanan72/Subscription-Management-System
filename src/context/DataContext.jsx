import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useAuth, ROLES } from './AuthContext';
import { apiClient } from '../services/api';
import { API_ENDPOINTS } from '../services/endpoints';
import {
  initialProducts,
  initialPlans,
  initialCustomers,
  initialQuotations,
  initialSubscriptions,
  initialInvoices,
  initialPayments,
  initialDiscounts,
  initialSettings,
} from '../mock/data';

// =========================================================================
// NORMALIZATION ADAPTERS: Ensures both camelCase & snake_case properties
// =========================================================================
export const normalizeProduct = (p) => ({
  ...p,
  salesPrice: p.sales_price ?? p.salesPrice ?? 0,
  sales_price: p.sales_price ?? p.salesPrice ?? 0,
  costPrice: p.cost_price ?? p.costPrice ?? 0,
  cost_price: p.cost_price ?? p.costPrice ?? 0,
  variants: (p.variants || []).map((v) => ({
    ...v,
    priceAdjustment: v.price_adjustment ?? v.priceAdjustment ?? 0,
    price_adjustment: v.price_adjustment ?? v.priceAdjustment ?? 0,
  })),
});

export const normalizePlan = (pl) => ({
  ...pl,
  planName: pl.plan_name ?? pl.planName ?? '',
  plan_name: pl.plan_name ?? pl.planName ?? '',
  productId: pl.product_id ?? pl.productId ?? '',
  product_id: pl.product_id ?? pl.productId ?? '',
  productName: pl.product_name ?? pl.productName ?? '',
  product_name: pl.product_name ?? pl.productName ?? '',
  billingFrequency: pl.billing_frequency ?? pl.billingFrequency ?? 'Monthly',
  billing_frequency: pl.billing_frequency ?? pl.billingFrequency ?? 'Monthly',
  minQuantity: pl.min_quantity ?? pl.minQuantity ?? 1,
  min_quantity: pl.min_quantity ?? pl.minQuantity ?? 1,
  startDate: pl.start_date ?? pl.startDate ?? '',
  start_date: pl.start_date ?? pl.startDate ?? '',
  endDate: pl.end_date ?? pl.endDate ?? '',
  end_date: pl.end_date ?? pl.endDate ?? '',
  autoClose: pl.auto_close ?? pl.autoClose ?? false,
  auto_close: pl.auto_close ?? pl.autoClose ?? false,
  allowEarlyClosure: pl.allow_early_closure ?? pl.allowEarlyClosure ?? true,
  allow_early_closure: pl.allow_early_closure ?? pl.allowEarlyClosure ?? true,
  allowPause: pl.allow_pause ?? pl.allowPause ?? true,
  allow_pause: pl.allow_pause ?? pl.allowPause ?? true,
  allowRenewal: pl.allow_renewal ?? pl.allowRenewal ?? true,
  allow_renewal: pl.allow_renewal ?? pl.allowRenewal ?? true,
});

export const normalizeCustomer = (c) => ({
  ...c,
  customerId: c.id,
  customerName: c.name,
  activeSubscriptions: c.active_subscriptions_count ?? c.activeSubscriptions ?? 0,
  activeSubscriptionsCount: c.active_subscriptions_count ?? c.activeSubscriptionsCount ?? 0,
  active_subscriptions_count: c.active_subscriptions_count ?? c.activeSubscriptionsCount ?? 0,
  totalInvoices: c.total_invoices_count ?? c.totalInvoices ?? 0,
  totalInvoicesCount: c.total_invoices_count ?? c.totalInvoicesCount ?? 0,
  total_invoices_count: c.total_invoices_count ?? c.totalInvoicesCount ?? 0,
  outstandingBalance: c.outstanding_balance ?? c.outstandingBalance ?? 0,
  outstanding_balance: c.outstanding_balance ?? c.outstandingBalance ?? 0,
  registrationDate: c.registration_date ?? c.registrationDate ?? '',
  registration_date: c.registration_date ?? c.registrationDate ?? '',
  accountStatus: c.account_status ?? c.accountStatus ?? 'Active',
  account_status: c.account_status ?? c.accountStatus ?? 'Active',
});

export const normalizeQuotation = (q) => ({
  ...q,
  customerId: q.customer_id ?? q.customerId ?? '',
  customer_id: q.customer_id ?? q.customerId ?? '',
  templateName: q.template_name ?? q.templateName ?? '',
  template_name: q.template_name ?? q.templateName ?? '',
  validityDate: q.validity_date ?? q.validityDate ?? '',
  validity_date: q.validity_date ?? q.validityDate ?? '',
  lines: (q.lines || []).map((l) => ({
    ...l,
    productName: l.product_name ?? l.productName ?? '',
    productId: l.product_id ?? l.productId ?? '',
    planName: l.plan_name ?? l.planName ?? '',
    planId: l.plan_id ?? l.planId ?? '',
    variantName: l.variant_name ?? l.variantName ?? '',
    unitPrice: l.unit_price ?? l.unitPrice ?? 0,
    taxRate: l.tax_rate ?? l.taxRate ?? 0,
  })),
});

export const normalizeSubscription = (s) => ({
  ...s,
  subscriptionNumber: s.subscription_number ?? s.subscriptionNumber ?? s.id,
  subscription_number: s.subscription_number ?? s.subscriptionNumber ?? s.id,
  customerId: s.customer_id ?? s.customerId ?? '',
  customer_id: s.customer_id ?? s.customerId ?? '',
  customerEmail: s.customer_email ?? s.customerEmail ?? '',
  customer_email: s.customer_email ?? s.customerEmail ?? '',
  planId: s.plan_id ?? s.planId ?? '',
  plan_id: s.plan_id ?? s.planId ?? '',
  productId: s.product_id ?? s.productId ?? '',
  product_id: s.product_id ?? s.productId ?? '',
  billingFrequency: s.billing_frequency ?? s.billingFrequency ?? 'Monthly',
  billing_frequency: s.billing_frequency ?? s.billingFrequency ?? 'Monthly',
  startDate: s.start_date ?? s.startDate ?? '',
  start_date: s.start_date ?? s.startDate ?? '',
  expiryDate: s.expiry_date ?? s.expiryDate ?? '',
  expiry_date: s.expiry_date ?? s.expiryDate ?? '',
  paymentTerms: s.payment_terms ?? s.paymentTerms ?? 'Net 15',
  payment_terms: s.payment_terms ?? s.paymentTerms ?? 'Net 15',
  unitPrice: s.unit_price ?? s.unitPrice ?? 0,
  unit_price: s.unit_price ?? s.unitPrice ?? 0,
  totalAmount: s.total_amount ?? s.totalAmount ?? 0,
  total_amount: s.total_amount ?? s.totalAmount ?? 0,
  nextBillingDate: s.next_billing_date ?? s.nextBillingDate ?? '',
  next_billing_date: s.next_billing_date ?? s.nextBillingDate ?? '',
  autoRenew: s.auto_renew ?? s.autoRenew ?? false,
  auto_renew: s.auto_renew ?? s.autoRenew ?? false,
  lines: (s.lines || s.product_lines || []).map((l) => ({
    ...l,
    productName: l.product_name ?? l.productName ?? '',
    variantName: l.variant_name ?? l.variantName ?? '',
    planName: l.plan_name ?? l.planName ?? '',
    unitPrice: l.unit_price ?? l.unitPrice ?? 0,
    taxRate: l.tax_rate ?? l.taxRate ?? 0,
  })),
  timeline: (s.timeline || s.activity_timeline || []).map((t) => ({
    ...t,
  })),
});

export const normalizeInvoice = (i) => ({
  ...i,
  invoiceNumber: i.invoice_number ?? i.invoiceNumber ?? i.id,
  invoice_number: i.invoice_number ?? i.invoiceNumber ?? i.id,
  customerId: i.customer_id ?? i.customerId ?? '',
  customer_id: i.customer_id ?? i.customerId ?? '',
  customerEmail: i.customer_email ?? i.customerEmail ?? '',
  customer_email: i.customer_email ?? i.customerEmail ?? '',
  customerAddress: i.customer_address ?? i.customerAddress ?? '',
  customer_address: i.customer_address ?? i.customerAddress ?? '',
  customerGst: i.customer_gst ?? i.customerGst ?? '',
  customer_gst: i.customer_gst ?? i.customerGst ?? '',
  subscriptionId: i.subscription_id ?? i.subscriptionId ?? '',
  subscription_id: i.subscription_id ?? i.subscriptionId ?? '',
  invoiceDate: i.invoice_date ?? i.invoiceDate ?? '',
  invoice_date: i.invoice_date ?? i.invoiceDate ?? '',
  dueDate: i.due_date ?? i.dueDate ?? '',
  due_date: i.due_date ?? i.dueDate ?? '',
  paidAmount: i.paid_amount ?? i.paidAmount ?? 0,
  paid_amount: i.paid_amount ?? i.paidAmount ?? 0,
  outstandingAmount: i.outstanding_amount ?? i.outstandingAmount ?? 0,
  outstanding_amount: i.outstanding_amount ?? i.outstandingAmount ?? 0,
  paymentTerms: i.payment_terms ?? i.paymentTerms ?? 'Net 15',
  payment_terms: i.payment_terms ?? i.paymentTerms ?? 'Net 15',
  lines: (i.lines || []).map((l) => ({
    ...l,
    unitPrice: l.unit_price ?? l.unitPrice ?? 0,
  })),
});

export const normalizePayment = (p) => ({
  ...p,
  paymentReference: p.payment_reference ?? p.paymentReference ?? p.id,
  payment_reference: p.payment_reference ?? p.paymentReference ?? p.id,
  customerId: p.customer_id ?? p.customerId ?? '',
  customer_id: p.customer_id ?? p.customerId ?? '',
  invoiceId: p.invoice_id ?? p.invoiceId ?? '',
  invoice_id: p.invoice_id ?? p.invoiceId ?? '',
  paymentMethod: p.payment_method ?? p.paymentMethod ?? 'UPI',
  payment_method: p.payment_method ?? p.paymentMethod ?? 'UPI',
  paymentDate: p.payment_date ?? p.paymentDate ?? '',
  payment_date: p.payment_date ?? p.paymentDate ?? '',
  transactionId: p.transaction_id ?? p.transactionId ?? '',
  transaction_id: p.transaction_id ?? p.transactionId ?? '',
});

export const normalizeDiscount = (d) => ({
  ...d,
  minPurchase: d.min_purchase ?? d.minPurchase ?? 0,
  min_purchase: d.min_purchase ?? d.minPurchase ?? 0,
  minQuantity: d.min_quantity ?? d.minQuantity ?? 1,
  min_quantity: d.min_quantity ?? d.minQuantity ?? 1,
  applicableProducts: d.applicable_products ?? d.applicableProducts ?? 'all',
  applicable_products: d.applicable_products ?? d.applicableProducts ?? 'all',
  applicableSubscriptions: d.applicable_subscriptions ?? d.applicableSubscriptions ?? 'all',
  applicable_subscriptions: d.applicable_subscriptions ?? d.applicableSubscriptions ?? 'all',
  startDate: d.start_date ?? d.startDate ?? '',
  start_date: d.start_date ?? d.startDate ?? '',
  endDate: d.end_date ?? d.endDate ?? '',
  end_date: d.end_date ?? d.endDate ?? '',
  usageLimit: d.usage_limit ?? d.usageLimit ?? 0,
  usage_limit: d.usage_limit ?? d.usageLimit ?? 0,
  usageCount: d.usage_count ?? d.usageCount ?? 0,
  usage_count: d.usage_count ?? d.usageCount ?? 0,
});

const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Entities initialized with fallback or localStorage
  const [products, setProducts] = useState(() => {
    const s = localStorage.getItem('bl_products');
    return (s ? JSON.parse(s) : initialProducts).map(normalizeProduct);
  });

  const [plans, setPlans] = useState(() => {
    const s = localStorage.getItem('bl_plans');
    return (s ? JSON.parse(s) : initialPlans).map(normalizePlan);
  });

  const [customers, setCustomers] = useState(() => {
    const s = localStorage.getItem('bl_customers');
    return (s ? JSON.parse(s) : initialCustomers).map(normalizeCustomer);
  });

  const [quotations, setQuotations] = useState(() => {
    const s = localStorage.getItem('bl_quotations');
    return (s ? JSON.parse(s) : initialQuotations).map(normalizeQuotation);
  });

  const [subscriptions, setSubscriptions] = useState(() => {
    const s = localStorage.getItem('bl_subscriptions');
    return (s ? JSON.parse(s) : initialSubscriptions).map(normalizeSubscription);
  });

  const [invoices, setInvoices] = useState(() => {
    const s = localStorage.getItem('bl_invoices');
    return (s ? JSON.parse(s) : initialInvoices).map(normalizeInvoice);
  });

  const [payments, setPayments] = useState(() => {
    const s = localStorage.getItem('bl_payments');
    return (s ? JSON.parse(s) : initialPayments).map(normalizePayment);
  });

  const [discounts, setDiscounts] = useState(() => {
    const s = localStorage.getItem('bl_discounts');
    return (s ? JSON.parse(s) : initialDiscounts).map(normalizeDiscount);
  });

  const [settings, setSettings] = useState(() => {
    const s = localStorage.getItem('bl_settings');
    return s ? JSON.parse(s) : initialSettings;
  });

  // Active customer for portal view
  const [portalCustomerId, setPortalCustomerId] = useState('cust-1');

  // Sync state to localStorage for offline cache
  useEffect(() => {
    localStorage.setItem('bl_products', JSON.stringify(products));
    localStorage.setItem('bl_plans', JSON.stringify(plans));
    localStorage.setItem('bl_customers', JSON.stringify(customers));
    localStorage.setItem('bl_quotations', JSON.stringify(quotations));
    localStorage.setItem('bl_subscriptions', JSON.stringify(subscriptions));
    localStorage.setItem('bl_invoices', JSON.stringify(invoices));
    localStorage.setItem('bl_payments', JSON.stringify(payments));
    localStorage.setItem('bl_discounts', JSON.stringify(discounts));
    localStorage.setItem('bl_settings', JSON.stringify(settings));
  }, [products, plans, customers, quotations, subscriptions, invoices, payments, discounts, settings]);

  // =========================================================================
  // FETCH ALL DATA FROM BACKEND FASTAPI / SQLITE
  // =========================================================================
  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [
        prodsRes,
        plansRes,
        custsRes,
        quosRes,
        subsRes,
        invsRes,
        paysRes,
        discsRes,
        companyRes,
        taxesRes,
      ] = await Promise.allSettled([
        apiClient.get(API_ENDPOINTS.PRODUCTS.BASE),
        apiClient.get(API_ENDPOINTS.PLANS.BASE),
        apiClient.get(API_ENDPOINTS.CUSTOMERS.BASE),
        apiClient.get(API_ENDPOINTS.QUOTATIONS.BASE),
        apiClient.get(API_ENDPOINTS.SUBSCRIPTIONS.BASE),
        apiClient.get(API_ENDPOINTS.INVOICES.BASE),
        apiClient.get(API_ENDPOINTS.PAYMENTS.BASE),
        apiClient.get(API_ENDPOINTS.DISCOUNTS.BASE),
        apiClient.get(API_ENDPOINTS.SETTINGS.COMPANY),
        apiClient.get(API_ENDPOINTS.SETTINGS.TAXES),
      ]);

      if (prodsRes.status === 'fulfilled' && Array.isArray(prodsRes.value)) {
        setProducts(prodsRes.value.map(normalizeProduct));
      }
      if (plansRes.status === 'fulfilled' && Array.isArray(plansRes.value)) {
        setPlans(plansRes.value.map(normalizePlan));
      }
      if (custsRes.status === 'fulfilled' && Array.isArray(custsRes.value)) {
        setCustomers(custsRes.value.map(normalizeCustomer));
      }
      if (quosRes.status === 'fulfilled' && Array.isArray(quosRes.value)) {
        setQuotations(quosRes.value.map(normalizeQuotation));
      }
      if (subsRes.status === 'fulfilled' && Array.isArray(subsRes.value)) {
        setSubscriptions(subsRes.value.map(normalizeSubscription));
      }
      if (invsRes.status === 'fulfilled' && Array.isArray(invsRes.value)) {
        setInvoices(invsRes.value.map(normalizeInvoice));
      }
      if (paysRes.status === 'fulfilled' && Array.isArray(paysRes.value)) {
        setPayments(paysRes.value.map(normalizePayment));
      }
      if (discsRes.status === 'fulfilled' && Array.isArray(discsRes.value)) {
        setDiscounts(discsRes.value.map(normalizeDiscount));
      }
      if (companyRes.status === 'fulfilled' && companyRes.value) {
        setSettings((prev) => ({
          ...prev,
          companyProfile: { ...prev.companyProfile, ...companyRes.value },
        }));
      }
      if (taxesRes.status === 'fulfilled' && Array.isArray(taxesRes.value)) {
        setSettings((prev) => ({
          ...prev,
          taxConfig: taxesRes.value,
        }));
      }
    } catch {
      // Backend not running; fallback to pre-seeded dataset
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch from FastAPI on mount or when auth state shifts
  useEffect(() => {
    refreshData();
  }, [refreshData, user?.id]);

  // RESET DATABASE TO DEFAULT
  const resetAllData = async () => {
    setProducts(initialProducts.map(normalizeProduct));
    setPlans(initialPlans.map(normalizePlan));
    setCustomers(initialCustomers.map(normalizeCustomer));
    setQuotations(initialQuotations.map(normalizeQuotation));
    setSubscriptions(initialSubscriptions.map(normalizeSubscription));
    setInvoices(initialInvoices.map(normalizeInvoice));
    setPayments(initialPayments.map(normalizePayment));
    setDiscounts(initialDiscounts.map(normalizeDiscount));
    setSettings(initialSettings);
    toast.success('Database reset to fresh enterprise sample data');
    await refreshData();
  };

  // --- PRODUCTS ---
  const addProduct = async (prod) => {
    const payload = {
      name: prod.name,
      code: prod.code || `BL-PROD-${Date.now().toString().slice(-4)}`,
      type: prod.type || 'Service',
      sales_price: Number(prod.salesPrice || prod.sales_price || 0),
      cost_price: Number(prod.costPrice || prod.cost_price || 0),
      status: prod.status || 'Active',
      description: prod.description || '',
      variants: (prod.variants || []).map((v) => ({
        name: v.name,
        price_adjustment: Number(v.priceAdjustment || v.price_adjustment || 0),
        sku: v.sku || 'SKU-GEN',
      })),
    };

    try {
      const res = await apiClient.post(API_ENDPOINTS.PRODUCTS.BASE, payload);
      const normalized = normalizeProduct(res);
      setProducts((prev) => [normalized, ...prev]);
      toast.success(`Product "${normalized.name}" added successfully`);
      return normalized;
    } catch {
      const newProd = normalizeProduct({
        ...prod,
        id: 'prod-' + Date.now(),
        status: prod.status || 'Active',
        variants: prod.variants || [{ id: 'var-' + Date.now(), name: 'Standard Edition', priceAdjustment: 0, sku: 'STD' }],
      });
      setProducts([newProd, ...products]);
      toast.success(`Product "${newProd.name}" added successfully`);
      return newProd;
    }
  };

  const updateProduct = async (id, updated) => {
    const payload = {
      name: updated.name,
      code: updated.code,
      type: updated.type,
      sales_price: updated.salesPrice !== undefined ? Number(updated.salesPrice) : undefined,
      cost_price: updated.costPrice !== undefined ? Number(updated.costPrice) : undefined,
      status: updated.status,
      description: updated.description,
    };

    try {
      const res = await apiClient.put(API_ENDPOINTS.PRODUCTS.BY_ID(id), payload);
      const normalized = normalizeProduct(res);
      setProducts((prev) => prev.map((p) => (p.id === id ? normalized : p)));
      toast.success('Product updated');
    } catch {
      setProducts(products.map((p) => (p.id === id ? { ...p, ...updated } : p)));
      toast.success('Product updated');
    }
  };

  const deleteProduct = async (id) => {
    try {
      await apiClient.delete(API_ENDPOINTS.PRODUCTS.BY_ID(id));
      setProducts((prev) => prev.filter((p) => p.id !== id));
      toast.success('Product deleted');
    } catch {
      setProducts(products.filter((p) => p.id !== id));
      toast.success('Product deleted');
    }
  };

  // --- PLANS ---
  const addPlan = async (plan) => {
    const payload = {
      plan_name: plan.planName || plan.plan_name,
      product_id: plan.productId || plan.product_id,
      product_name: plan.productName || plan.product_name,
      billing_frequency: plan.billingFrequency || plan.billing_frequency || 'Monthly',
      price: Number(plan.price || 0),
      min_quantity: Number(plan.minQuantity || plan.min_quantity || 1),
      start_date: plan.startDate || plan.start_date || new Date().toISOString().slice(0, 10),
      end_date: plan.endDate || plan.end_date,
      auto_close: !!(plan.autoClose ?? plan.auto_close),
      allow_early_closure: !(plan.allowEarlyClosure === false || plan.allow_early_closure === false),
      allow_pause: !(plan.allowPause === false || plan.allow_pause === false),
      allow_renewal: !(plan.allowRenewal === false || plan.allow_renewal === false),
      status: plan.status || 'Active',
      description: plan.description || '',
    };

    try {
      const res = await apiClient.post(API_ENDPOINTS.PLANS.BASE, payload);
      const normalized = normalizePlan(res);
      setPlans((prev) => [normalized, ...prev]);
      toast.success(`Plan "${normalized.planName}" created`);
      return normalized;
    } catch {
      const newPlan = normalizePlan({
        ...plan,
        id: 'plan-' + Date.now(),
        status: plan.status || 'Active',
      });
      setPlans([newPlan, ...plans]);
      toast.success(`Plan "${newPlan.planName}" created`);
      return newPlan;
    }
  };

  const updatePlan = async (id, updated) => {
    const payload = {
      plan_name: updated.planName || updated.plan_name,
      billing_frequency: updated.billingFrequency || updated.billing_frequency,
      price: updated.price !== undefined ? Number(updated.price) : undefined,
      status: updated.status,
    };

    try {
      const res = await apiClient.put(API_ENDPOINTS.PLANS.BY_ID(id), payload);
      const normalized = normalizePlan(res);
      setPlans((prev) => prev.map((p) => (p.id === id ? normalized : p)));
      toast.success('Plan updated');
    } catch {
      setPlans(plans.map((p) => (p.id === id ? { ...p, ...updated } : p)));
      toast.success('Plan updated');
    }
  };

  const togglePlanStatus = async (id) => {
    try {
      const res = await apiClient.patch(API_ENDPOINTS.PLANS.TOGGLE_STATUS(id));
      const normalized = normalizePlan(res);
      setPlans((prev) => prev.map((p) => (p.id === id ? normalized : p)));
      toast.success(`Plan status changed to ${normalized.status}`);
    } catch {
      setPlans(
        plans.map((p) => {
          if (p.id === id) {
            const next = p.status === 'Active' ? 'Disabled' : 'Active';
            toast.success(`Plan status changed to ${next}`);
            return { ...p, status: next };
          }
          return p;
        })
      );
    }
  };

  // --- QUOTATIONS ---
  const addQuotation = async (quotation) => {
    const payload = {
      customer: quotation.customer,
      customer_id: quotation.customerId || quotation.customer_id,
      template_name: quotation.templateName || quotation.template_name || 'Standard Quotation',
      date: quotation.date || new Date().toISOString().slice(0, 10),
      validity_date: quotation.validityDate || quotation.validity_date,
      status: quotation.status || 'Draft',
      subtotal: Number(quotation.subtotal || 0),
      tax: Number(quotation.tax || 0),
      discount: Number(quotation.discount || 0),
      total: Number(quotation.total || 0),
      notes: quotation.notes || '',
      lines: (quotation.lines || []).map((l) => ({
        product_name: l.productName || l.product_name,
        product_id: l.productId || l.product_id,
        plan_name: l.planName || l.plan_name,
        plan_id: l.planId || l.plan_id,
        variant_name: l.variantName || l.variant_name,
        quantity: Number(l.quantity || 1),
        unit_price: Number(l.unitPrice || l.unit_price || 0),
        tax_rate: Number(l.taxRate || l.tax_rate || 18),
        discount: Number(l.discount || 0),
        total: Number(l.total || 0),
      })),
    };

    try {
      const res = await apiClient.post(API_ENDPOINTS.QUOTATIONS.BASE, payload);
      const normalized = normalizeQuotation(res);
      setQuotations((prev) => [normalized, ...prev]);
      toast.success(`Quotation ${normalized.id} created`);
      return normalized;
    } catch {
      const newId = `QUO-2024-${String(quotations.length + 101).padStart(3, '0')}`;
      const newQuo = normalizeQuotation({
        ...quotation,
        id: newId,
        status: quotation.status || 'Draft',
        date: quotation.date || new Date().toISOString().slice(0, 10),
      });
      setQuotations([newQuo, ...quotations]);
      toast.success(`Quotation ${newId} created`);
      return newQuo;
    }
  };

  const updateQuotation = async (id, updated) => {
    try {
      const res = await apiClient.put(API_ENDPOINTS.QUOTATIONS.BY_ID(id), updated);
      const normalized = normalizeQuotation(res);
      setQuotations((prev) => prev.map((q) => (q.id === id ? normalized : q)));
      toast.success('Quotation updated');
    } catch {
      setQuotations(quotations.map((q) => (q.id === id ? { ...q, ...updated } : q)));
      toast.success('Quotation updated');
    }
  };

  // Convert Quotation into Subscription
  const convertQuotationToSubscription = async (quotationId) => {
    try {
      const res = await apiClient.post(API_ENDPOINTS.QUOTATIONS.CONVERT_TO_SUBSCRIPTION(quotationId));
      const normalized = normalizeSubscription(res);
      setSubscriptions((prev) => [normalized, ...prev]);
      // Mark quotation as confirmed
      setQuotations((prev) =>
        prev.map((q) => (q.id === quotationId ? { ...q, status: 'Confirmed' } : q))
      );
      toast.success(`Quotation ${quotationId} converted to Active Subscription ${normalized.subscriptionNumber}!`);
      return normalized;
    } catch {
      const quo = quotations.find((q) => q.id === quotationId);
      if (!quo) return null;
      const subNumber = `SUB-2024-${String(subscriptions.length + 101).padStart(4, '0')}`;
      const newSub = normalizeSubscription({
        id: `SUB-${Date.now()}`,
        subscriptionNumber: subNumber,
        customer: quo.customer,
        customerId: quo.customerId,
        customerEmail: quo.customerEmail || 'client@example.com',
        plan: quo.lines?.[0]?.planName || 'Enterprise Subscription',
        planId: quo.lines?.[0]?.planId || 'plan-1',
        product: quo.lines?.[0]?.productName || 'Brightloop Suite',
        productId: quo.lines?.[0]?.productId || 'prod-1',
        billingFrequency: 'Monthly',
        startDate: new Date().toISOString().slice(0, 10),
        expiryDate: new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
        paymentTerms: 'Net 15',
        quantity: 1,
        unitPrice: quo.subtotal,
        taxes: 18,
        totalAmount: Math.round(quo.total),
        status: 'Active',
        nextBillingDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
        autoRenew: true,
        lines: quo.lines,
        timeline: [
          {
            id: `act-${Date.now()}`,
            timestamp: new Date().toLocaleString(),
            title: 'Converted from Quotation',
            description: `Converted from ${quotationId}`,
            user: user?.name || 'Admin',
            type: 'activate',
          },
        ],
      });
      setSubscriptions([newSub, ...subscriptions]);
      setQuotations(quotations.map((q) => (q.id === quotationId ? { ...q, status: 'Confirmed' } : q)));
      toast.success(`Quotation ${quotationId} converted to Active Subscription ${subNumber}!`);
      return newSub;
    }
  };

  // --- SUBSCRIPTIONS ---
  const addSubscription = async (sub) => {
    const payload = {
      customer: sub.customer,
      customer_id: sub.customerId || sub.customer_id,
      customer_email: sub.customerEmail || sub.customer_email || 'client@example.com',
      plan: sub.plan,
      plan_id: sub.planId || sub.plan_id,
      product: sub.product,
      product_id: sub.productId || sub.product_id,
      billing_frequency: sub.billingFrequency || sub.billing_frequency || 'Monthly',
      start_date: sub.startDate || sub.start_date || new Date().toISOString().slice(0, 10),
      expiry_date: sub.expiryDate || sub.expiry_date,
      payment_terms: sub.paymentTerms || sub.payment_terms || 'Net 15',
      quantity: Number(sub.quantity || 1),
      unit_price: Number(sub.unitPrice || sub.unit_price || 0),
      taxes: Number(sub.taxes || 18),
      total_amount: Number(sub.totalAmount || sub.total_amount || 0),
      status: sub.status || 'Active',
      next_billing_date: sub.nextBillingDate || sub.next_billing_date,
      auto_renew: !!(sub.autoRenew ?? sub.auto_renew),
    };

    try {
      const res = await apiClient.post(API_ENDPOINTS.SUBSCRIPTIONS.BASE, payload);
      const normalized = normalizeSubscription(res);
      setSubscriptions((prev) => [normalized, ...prev]);
      toast.success(`Subscription ${normalized.subscriptionNumber} created`);
      return normalized;
    } catch {
      const subNum = `SUB-2024-${String(subscriptions.length + 101).padStart(4, '0')}`;
      const newSub = normalizeSubscription({
        ...sub,
        id: `SUB-${Date.now()}`,
        subscriptionNumber: subNum,
        status: sub.status || 'Active',
      });
      setSubscriptions([newSub, ...subscriptions]);
      toast.success(`Subscription ${subNum} created`);
      return newSub;
    }
  };

  const updateSubscription = async (id, updated) => {
    try {
      const res = await apiClient.put(API_ENDPOINTS.SUBSCRIPTIONS.BY_ID(id), updated);
      const normalized = normalizeSubscription(res);
      setSubscriptions((prev) => prev.map((s) => (s.id === id ? normalized : s)));
      toast.success('Subscription updated');
    } catch {
      setSubscriptions(subscriptions.map((s) => (s.id === id ? { ...s, ...updated } : s)));
      toast.success('Subscription updated');
    }
  };

  const updateSubscriptionStatus = async (id, newStatus, note = '') => {
    try {
      const res = await apiClient.patch(API_ENDPOINTS.SUBSCRIPTIONS.UPDATE_STATUS(id), {
        status: newStatus,
        note: note || `Status transitioned to ${newStatus}`,
      });
      const normalized = normalizeSubscription(res);
      setSubscriptions((prev) => prev.map((s) => (s.id === id ? normalized : s)));
      toast.success(`Subscription status updated to "${newStatus}"`);
    } catch {
      setSubscriptions(
        subscriptions.map((s) => {
          if (s.id === id) {
            return {
              ...s,
              status: newStatus,
              timeline: [
                {
                  id: `act-${Date.now()}`,
                  timestamp: new Date().toLocaleString(),
                  title: `Status changed to ${newStatus}`,
                  description: note || `Subscription status updated to ${newStatus}.`,
                  user: user?.name || 'Admin',
                  type: newStatus.toLowerCase(),
                },
                ...(s.timeline || []),
              ],
            };
          }
          return s;
        })
      );
      toast.success(`Subscription status updated to "${newStatus}"`);
    }
  };

  const renewSubscription = async (id, newExpiryDate) => {
    try {
      const res = await apiClient.post(API_ENDPOINTS.SUBSCRIPTIONS.RENEW(id), {
        new_expiry_date: newExpiryDate,
      });
      const normalized = normalizeSubscription(res);
      setSubscriptions((prev) => prev.map((s) => (s.id === id ? normalized : s)));
      toast.success(`Subscription renewed successfully until ${newExpiryDate || 'next cycle'}`);
    } catch {
      setSubscriptions(
        subscriptions.map((s) => {
          if (s.id === id) {
            return {
              ...s,
              status: 'Active',
              expiryDate: newExpiryDate || new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
            };
          }
          return s;
        })
      );
      toast.success('Subscription renewed successfully');
    }
  };

  // --- INVOICES ---
  const addInvoice = async (invoice) => {
    const payload = {
      customer: invoice.customer,
      customer_id: invoice.customerId || invoice.customer_id,
      customer_email: invoice.customerEmail || invoice.customer_email || 'client@example.com',
      customer_address: invoice.customerAddress || invoice.customer_address,
      customer_gst: invoice.customerGst || invoice.customer_gst,
      subscription: invoice.subscription,
      subscription_id: invoice.subscriptionId || invoice.subscription_id,
      invoice_date: invoice.invoiceDate || invoice.invoice_date || new Date().toISOString().slice(0, 10),
      due_date: invoice.dueDate || invoice.due_date,
      subtotal: Number(invoice.subtotal || 0),
      tax: Number(invoice.tax || 0),
      discount: Number(invoice.discount || 0),
      total: Number(invoice.total || 0),
      status: invoice.status || 'Draft',
      payment_terms: invoice.paymentTerms || invoice.payment_terms || 'Net 15',
      notes: invoice.notes || '',
      lines: (invoice.lines || []).map((l) => ({
        description: l.description,
        quantity: Number(l.quantity || 1),
        unit_price: Number(l.unitPrice || l.unit_price || 0),
        amount: Number(l.amount || (l.quantity || 1) * (l.unitPrice || l.unit_price || 0)),
      })),
    };

    try {
      const res = await apiClient.post(API_ENDPOINTS.INVOICES.BASE, payload);
      const normalized = normalizeInvoice(res);
      setInvoices((prev) => [normalized, ...prev]);
      toast.success(`Tax Invoice ${normalized.invoiceNumber} created`);
      return normalized;
    } catch {
      const invNum = `INV-2024-${String(invoices.length + 101).padStart(4, '0')}`;
      const newInv = normalizeInvoice({
        ...invoice,
        id: `INV-${Date.now()}`,
        invoiceNumber: invNum,
        paidAmount: 0,
        outstandingAmount: invoice.total,
        status: invoice.status || 'Draft',
      });
      setInvoices([newInv, ...invoices]);
      toast.success(`Tax Invoice ${invNum} created`);
      return newInv;
    }
  };

  const confirmInvoice = async (id) => {
    try {
      const res = await apiClient.post(API_ENDPOINTS.INVOICES.CONFIRM(id));
      const normalized = normalizeInvoice(res);
      setInvoices((prev) => prev.map((i) => (i.id === id ? normalized : i)));
      toast.success(`Invoice ${normalized.invoiceNumber} confirmed`);
    } catch {
      setInvoices(invoices.map((i) => (i.id === id ? { ...i, status: 'Confirmed' } : i)));
      toast.success('Invoice confirmed');
    }
  };

  const cancelInvoice = async (id) => {
    try {
      const res = await apiClient.post(API_ENDPOINTS.INVOICES.CANCEL(id));
      const normalized = normalizeInvoice(res);
      setInvoices((prev) => prev.map((i) => (i.id === id ? normalized : i)));
      toast.success(`Invoice ${normalized.invoiceNumber} cancelled`);
    } catch {
      setInvoices(invoices.map((i) => (i.id === id ? { ...i, status: 'Cancelled' } : i)));
      toast.success('Invoice cancelled');
    }
  };

  const sendInvoice = async (id, targetEmail) => {
    try {
      await apiClient.post(API_ENDPOINTS.INVOICES.SEND(id), { target_email: targetEmail });
      toast.success(`Invoice dispatched to ${targetEmail || 'customer contact'}!`);
    } catch {
      toast.success(`Invoice dispatched to ${targetEmail || 'customer contact'}!`);
    }
  };

  // --- PAYMENTS ---
  const recordPayment = async ({ invoiceId, customerId, amount, paymentMethod, notes }) => {
    const payload = {
      invoice_id: invoiceId,
      customer_id: customerId,
      amount: Number(amount),
      payment_method: paymentMethod,
      notes: notes || 'Settlement via Brightloop billing portal',
    };

    try {
      const res = await apiClient.post(API_ENDPOINTS.PAYMENTS.RECORD, payload);
      const normalized = normalizePayment(res);
      setPayments((prev) => [normalized, ...prev]);

      // Re-fetch invoices to ensure live outstanding balance is synced
      try {
        const invs = await apiClient.get(API_ENDPOINTS.INVOICES.BASE);
        setInvoices(invs.map(normalizeInvoice));
      } catch {
        // Optimistic local update
      }

      toast.success(`Payment of ₹${Number(amount).toLocaleString('en-IN')} recorded successfully!`);
      return normalized;
    } catch {
      const inv = invoices.find((i) => i.id === invoiceId);
      const numAmount = Number(amount);
      const newPayment = normalizePayment({
        id: `PAY-${Date.now()}`,
        paymentReference: `PAY-REF-${Math.floor(1000 + Math.random() * 9000)}`,
        customer: inv ? inv.customer : 'Enterprise Client',
        customerId: customerId || (inv ? inv.customerId : 'cust-1'),
        invoice: inv ? inv.invoiceNumber : 'Manual Settlement',
        invoiceId: invoiceId,
        paymentMethod,
        amount: numAmount,
        paymentDate: new Date().toISOString().slice(0, 10),
        transactionId: `TXN-${paymentMethod.toUpperCase().slice(0, 3)}-${Date.now().toString().slice(-6)}`,
        notes: notes || 'Payment processed via Brightloop billing portal',
        status: 'Success',
      });

      setPayments([newPayment, ...payments]);
      toast.success(`Payment of ₹${numAmount.toLocaleString('en-IN')} recorded successfully!`);
      return newPayment;
    }
  };

  // --- DISCOUNTS ---
  const addDiscount = async (disc) => {
    const payload = {
      name: disc.name,
      code: disc.code,
      type: disc.type || 'percentage',
      value: Number(disc.value || 0),
      min_purchase: Number(disc.minPurchase || disc.min_purchase || 0),
      min_quantity: Number(disc.minQuantity || disc.min_quantity || 1),
      applicable_products: disc.applicableProducts || disc.applicable_products || 'all',
      applicable_subscriptions: disc.applicableSubscriptions || disc.applicable_subscriptions || 'all',
      start_date: disc.startDate || disc.start_date || new Date().toISOString().slice(0, 10),
      end_date: disc.endDate || disc.end_date,
      usage_limit: disc.usageLimit ? Number(disc.usageLimit) : null,
      status: disc.status || 'Active',
      description: disc.description || '',
    };

    try {
      const res = await apiClient.post(API_ENDPOINTS.DISCOUNTS.BASE, payload);
      const normalized = normalizeDiscount(res);
      setDiscounts((prev) => [normalized, ...prev]);
      toast.success(`Discount code "${normalized.code}" created`);
      return normalized;
    } catch {
      const newDisc = normalizeDiscount({
        ...disc,
        id: 'disc-' + Date.now(),
        status: disc.status || 'Active',
        usageCount: 0,
      });
      setDiscounts([newDisc, ...discounts]);
      toast.success(`Discount code "${newDisc.code}" created`);
      return newDisc;
    }
  };

  const updateDiscount = async (id, updated) => {
    try {
      const res = await apiClient.put(API_ENDPOINTS.DISCOUNTS.BY_ID(id), updated);
      const normalized = normalizeDiscount(res);
      setDiscounts((prev) => prev.map((d) => (d.id === id ? normalized : d)));
      toast.success('Discount updated');
    } catch {
      setDiscounts(discounts.map((d) => (d.id === id ? { ...d, ...updated } : d)));
      toast.success('Discount updated');
    }
  };

  const toggleDiscountStatus = async (id) => {
    try {
      const res = await apiClient.patch(API_ENDPOINTS.DISCOUNTS.TOGGLE_STATUS(id));
      const normalized = normalizeDiscount(res);
      setDiscounts((prev) => prev.map((d) => (d.id === id ? normalized : d)));
      toast.success(`Discount status set to ${normalized.status}`);
    } catch {
      setDiscounts(
        discounts.map((d) => {
          if (d.id === id) {
            const next = d.status === 'Active' ? 'Inactive' : 'Active';
            toast.success(`Discount status set to ${next}`);
            return { ...d, status: next };
          }
          return d;
        })
      );
    }
  };

  // --- CUSTOMERS ---
  const addCustomer = async (cust) => {
    const payload = {
      name: cust.name,
      company: cust.company,
      email: cust.email,
      phone: cust.phone || '',
      gst_treatment: cust.gstTreatment || cust.gst_treatment || 'Registered Business - Regular',
      gstin: cust.gstin || '',
      pan: cust.pan || '',
      address: cust.address || '',
      city: cust.city || 'Bengaluru, Karnataka',
      state: cust.state || 'Karnataka',
      country: cust.country || 'India',
      pincode: cust.pincode || '560100',
      account_status: cust.accountStatus || cust.account_status || 'Active',
    };

    try {
      const res = await apiClient.post(API_ENDPOINTS.CUSTOMERS.BASE, payload);
      const normalized = normalizeCustomer(res);
      setCustomers((prev) => [normalized, ...prev]);
      toast.success(`Customer "${normalized.name}" registered`);
      return normalized;
    } catch {
      const newCust = normalizeCustomer({
        ...cust,
        id: 'cust-' + Date.now(),
        registrationDate: new Date().toISOString().slice(0, 10),
        activeSubscriptionsCount: 0,
        totalInvoicesCount: 0,
        outstandingBalance: 0,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(cust.name)}&background=4f46e5&color=fff`,
      });
      setCustomers([newCust, ...customers]);
      toast.success(`Customer "${newCust.name}" registered`);
      return newCust;
    }
  };

  const updateCustomer = async (id, updated) => {
    try {
      const res = await apiClient.put(API_ENDPOINTS.CUSTOMERS.BY_ID(id), updated);
      const normalized = normalizeCustomer(res);
      setCustomers((prev) => prev.map((c) => (c.id === id ? normalized : c)));
      toast.success('Customer profile updated');
    } catch {
      setCustomers(customers.map((c) => (c.id === id ? { ...c, ...updated } : c)));
      toast.success('Customer profile updated');
    }
  };

  // --- SETTINGS & STAFF ---
  const updateCompanyProfile = async (profile) => {
    try {
      await apiClient.put(API_ENDPOINTS.SETTINGS.COMPANY, profile);
      setSettings((prev) => ({
        ...prev,
        companyProfile: { ...prev.companyProfile, ...profile },
      }));
      toast.success('Company settings saved to SQLite database');
    } catch {
      setSettings((prev) => ({
        ...prev,
        companyProfile: { ...prev.companyProfile, ...profile },
      }));
      toast.success('Company settings saved');
    }
  };

  const addStaffMember = async (staff) => {
    try {
      const res = await apiClient.post(API_ENDPOINTS.SETTINGS.STAFF, staff);
      setSettings((prev) => ({
        ...prev,
        staffMembers: [...prev.staffMembers, res],
      }));
      toast.success(`Staff member "${res.name}" added`);
    } catch {
      const newStaff = {
        ...staff,
        id: 'staff-' + Date.now(),
        status: 'Active',
        lastActive: 'Just now',
      };
      setSettings((prev) => ({
        ...prev,
        staffMembers: [...prev.staffMembers, newStaff],
      }));
      toast.success(`Staff member "${newStaff.name}" added`);
    }
  };

  const deleteStaffMember = async (id) => {
    try {
      await apiClient.delete(`${API_ENDPOINTS.SETTINGS.STAFF}/${id}`);
      setSettings((prev) => ({
        ...prev,
        staffMembers: prev.staffMembers.filter((s) => s.id !== id),
      }));
      toast.success('Staff member removed');
    } catch {
      setSettings((prev) => ({
        ...prev,
        staffMembers: prev.staffMembers.filter((s) => s.id !== id),
      }));
      toast.success('Staff member removed');
    }
  };

  const updateTaxConfig = async (newTaxList) => {
    try {
      const res = await apiClient.put(API_ENDPOINTS.SETTINGS.TAXES, newTaxList);
      setSettings((prev) => ({ ...prev, taxConfig: res }));
      toast.success('Tax rules updated in database');
    } catch {
      setSettings((prev) => ({ ...prev, taxConfig: newTaxList }));
      toast.success('Tax rules updated');
    }
  };

  const updateNotificationPreferences = async (prefs) => {
    try {
      const res = await apiClient.put(API_ENDPOINTS.SETTINGS.NOTIFICATIONS, prefs);
      setSettings((prev) => ({ ...prev, notificationPreferences: res }));
      toast.success('Notification preferences updated in database');
    } catch {
      setSettings((prev) => ({ ...prev, notificationPreferences: { ...prev.notificationPreferences, ...prefs } }));
      toast.success('Notification preferences updated');
    }
  };

  // Dynamic Demo Customer for Portal
  const portalCustomer = useMemo(() => {
    if (!user || user.role !== ROLES.CUSTOMER) {
      return customers.find((c) => c.id === portalCustomerId) || customers[0];
    }
    const found = customers.find(
      (c) =>
        (user.customerId && c.id === user.customerId) ||
        c.id === user.id ||
        (user.email && c.email && c.email.toLowerCase() === user.email.toLowerCase())
    );
    if (found) return found;

    return {
      id: user.customerId || user.id || 'cust-dynamic',
      name: user.name || 'Demo Client',
      company: user.company || 'Enterprise Client Pvt Ltd',
      email: user.email || 'client@example.com',
      avatar:
        user.avatar ||
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      phone: '+91 98765 43210',
      gstTreatment: 'Consumer',
      gstin: 'URP',
      city: 'Mumbai, Maharashtra',
      outstandingBalance: 0,
      totalSpent: 0,
      status: 'Active',
      joinDate: new Date().toISOString().slice(0, 10),
    };
  }, [user, customers, portalCustomerId]);

  // Ensure new customer exists in customers array
  useEffect(() => {
    if (user && user.role === ROLES.CUSTOMER && portalCustomer) {
      const exists = customers.some(
        (c) => c.id === portalCustomer.id || c.email?.toLowerCase() === portalCustomer.email?.toLowerCase()
      );
      if (!exists) {
        setCustomers((prev) => [portalCustomer, ...prev]);
      }
    }
  }, [user, portalCustomer, customers]);

  return (
    <DataContext.Provider
      value={{
        isLoading,
        refreshData,

        // Entities
        products,
        plans,
        customers,
        quotations,
        subscriptions,
        invoices,
        payments,
        discounts,
        settings,
        portalCustomerId,
        portalCustomer,
        setPortalCustomerId,
        resetAllData,

        // Product handlers
        addProduct,
        updateProduct,
        deleteProduct,

        // Plan handlers
        addPlan,
        updatePlan,
        togglePlanStatus,

        // Quotation handlers
        addQuotation,
        updateQuotation,
        convertQuotationToSubscription,

        // Subscription handlers
        addSubscription,
        updateSubscription,
        updateSubscriptionStatus,
        renewSubscription,

        // Invoice handlers
        addInvoice,
        confirmInvoice,
        cancelInvoice,
        sendInvoice,

        // Payment handlers
        recordPayment,

        // Discount handlers
        addDiscount,
        updateDiscount,
        toggleDiscountStatus,

        // Customer handlers
        addCustomer,
        updateCustomer,

        // Settings handlers
        updateCompanyProfile,
        addStaffMember,
        deleteStaffMember,
        updateTaxConfig,
        updateNotificationPreferences,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
