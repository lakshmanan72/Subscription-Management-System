import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useAuth, ROLES } from './AuthContext';
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

const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const { user } = useAuth();
  // Load from localStorage or initial mock data
  const [products, setProducts] = useState(() => {
    const s = localStorage.getItem('bl_products');
    return s ? JSON.parse(s) : initialProducts;
  });

  const [plans, setPlans] = useState(() => {
    const s = localStorage.getItem('bl_plans');
    return s ? JSON.parse(s) : initialPlans;
  });

  const [customers, setCustomers] = useState(() => {
    const s = localStorage.getItem('bl_customers');
    return s ? JSON.parse(s) : initialCustomers;
  });

  const [quotations, setQuotations] = useState(() => {
    const s = localStorage.getItem('bl_quotations');
    return s ? JSON.parse(s) : initialQuotations;
  });

  const [subscriptions, setSubscriptions] = useState(() => {
    const s = localStorage.getItem('bl_subscriptions');
    return s ? JSON.parse(s) : initialSubscriptions;
  });

  const [invoices, setInvoices] = useState(() => {
    const s = localStorage.getItem('bl_invoices');
    return s ? JSON.parse(s) : initialInvoices;
  });

  const [payments, setPayments] = useState(() => {
    const s = localStorage.getItem('bl_payments');
    return s ? JSON.parse(s) : initialPayments;
  });

  const [discounts, setDiscounts] = useState(() => {
    const s = localStorage.getItem('bl_discounts');
    return s ? JSON.parse(s) : initialDiscounts;
  });

  const [settings, setSettings] = useState(() => {
    const s = localStorage.getItem('bl_settings');
    return s ? JSON.parse(s) : initialSettings;
  });

  // Active customer for portal
  const [portalCustomerId, setPortalCustomerId] = useState('cust-1');

  // Sync state to localStorage
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

  // RESET DATABASE TO DEFAULT
  const resetAllData = () => {
    setProducts(initialProducts);
    setPlans(initialPlans);
    setCustomers(initialCustomers);
    setQuotations(initialQuotations);
    setSubscriptions(initialSubscriptions);
    setInvoices(initialInvoices);
    setPayments(initialPayments);
    setDiscounts(initialDiscounts);
    setSettings(initialSettings);
    toast.success('Database reset to fresh enterprise sample data');
  };

  // --- PRODUCTS ---
  const addProduct = (prod) => {
    const newProd = {
      ...prod,
      id: 'prod-' + Date.now(),
      status: prod.status || 'Active',
      variants: prod.variants || [{ id: 'var-' + Date.now(), name: 'Standard Edition', priceAdjustment: 0, sku: 'STD' }],
    };
    setProducts([newProd, ...products]);
    toast.success(`Product "${newProd.name}" added successfully`);
    return newProd;
  };

  const updateProduct = (id, updated) => {
    setProducts(products.map(p => p.id === id ? { ...p, ...updated } : p));
    toast.success('Product updated');
  };

  const deleteProduct = (id) => {
    setProducts(products.filter(p => p.id !== id));
    toast.success('Product deleted');
  };

  // --- PLANS ---
  const addPlan = (plan) => {
    const newPlan = {
      ...plan,
      id: 'plan-' + Date.now(),
      status: plan.status || 'Active',
      autoClose: plan.autoClose ?? false,
      allowEarlyClosure: plan.allowEarlyClosure ?? true,
      allowPause: plan.allowPause ?? true,
      allowRenewal: plan.allowRenewal ?? true,
    };
    setPlans([newPlan, ...plans]);
    toast.success(`Plan "${newPlan.planName}" created`);
    return newPlan;
  };

  const updatePlan = (id, updated) => {
    setPlans(plans.map(p => p.id === id ? { ...p, ...updated } : p));
    toast.success('Plan updated');
  };

  const togglePlanStatus = (id) => {
    setPlans(plans.map(p => {
      if (p.id === id) {
        const next = p.status === 'Active' ? 'Disabled' : 'Active';
        toast.success(`Plan status changed to ${next}`);
        return { ...p, status: next };
      }
      return p;
    }));
  };

  // --- QUOTATIONS ---
  const addQuotation = (quotation) => {
    const newId = `QUO-2024-${String(quotations.length + 101).padStart(3, '0')}`;
    const newQuo = {
      ...quotation,
      id: newId,
      status: quotation.status || 'Draft',
      date: quotation.date || new Date().toISOString().slice(0, 10),
    };
    setQuotations([newQuo, ...quotations]);
    toast.success(`Quotation ${newId} created`);
    return newQuo;
  };

  const updateQuotation = (id, updated) => {
    setQuotations(quotations.map(q => q.id === id ? { ...q, ...updated } : q));
    toast.success('Quotation updated');
  };

  // Convert Quotation into Subscription
  const convertQuotationToSubscription = (quotationId) => {
    const quo = quotations.find(q => q.id === quotationId);
    if (!quo) return null;

    const subNumber = `SUB-2024-${String(subscriptions.length + 101).padStart(4, '0')}`;
    const firstLine = quo.lines?.[0] || {};

    const startDate = new Date().toISOString().slice(0, 10);
    const expDate = new Date();
    expDate.setFullYear(expDate.getFullYear() + 1);
    const expiryDate = expDate.toISOString().slice(0, 10);

    const newSub = {
      id: `SUB-${Date.now()}`,
      subscriptionNumber: subNumber,
      customer: quo.customer,
      customerId: quo.customerId,
      customerEmail: customers.find(c => c.id === quo.customerId)?.email || quo.customerEmail || ('client@' + (quo.customer || 'company').toLowerCase().replace(/[^a-z]/g, '') + '.com'),
      plan: firstLine.planName || 'Enterprise Subscription',
      planId: firstLine.planId || 'plan-1',
      product: firstLine.productName || 'Brightloop Suite',
      productId: firstLine.productId || 'prod-1',
      billingFrequency: 'Monthly',
      startDate,
      expiryDate,
      paymentTerms: 'Net 15',
      quantity: firstLine.quantity || 1,
      unitPrice: firstLine.unitPrice || quo.subtotal,
      taxes: 18,
      totalAmount: Math.round(quo.total),
      status: 'Confirmed', // transitioned from confirmed quotation
      nextBillingDate: startDate,
      autoRenew: true,
      productLines: quo.lines || [],
      activityTimeline: [
        {
          id: 'act-' + Date.now(),
          timestamp: new Date().toLocaleString(),
          title: 'Converted from Quotation',
          description: `Generated from approved quotation ${quo.id}.`,
          user: 'Sales Desk',
          type: 'confirm',
        },
      ],
    };

    // Mark quotation as Confirmed
    setQuotations(quotations.map(q => q.id === quo.id ? { ...q, status: 'Confirmed' } : q));
    setSubscriptions([newSub, ...subscriptions]);
    toast.success(`Converted ${quo.id} into Subscription ${subNumber}!`);
    return newSub;
  };

  // --- SUBSCRIPTIONS ---
  const addSubscription = (sub) => {
    const subNumber = `SUB-2024-${String(subscriptions.length + 101).padStart(4, '0')}`;
    const newSub = {
      ...sub,
      id: `SUB-${Date.now()}`,
      subscriptionNumber: subNumber,
      status: sub.status || 'Draft',
      activityTimeline: [
        {
          id: 'act-' + Date.now(),
          timestamp: new Date().toLocaleString(),
          title: 'Subscription Drafted',
          description: `Subscription ${subNumber} initiated.`,
          user: 'Admin',
          type: 'create',
        },
      ],
    };
    setSubscriptions([newSub, ...subscriptions]);
    toast.success(`Subscription ${subNumber} created`);
    return newSub;
  };

  const updateSubscription = (id, updated) => {
    setSubscriptions(subscriptions.map(s => s.id === id ? { ...s, ...updated } : s));
    toast.success('Subscription updated');
  };

  const updateSubscriptionStatus = (id, newStatus, reason = '') => {
    setSubscriptions(subscriptions.map(sub => {
      if (sub.id === id) {
        const actionLabel = {
          Confirmed: 'Quotation Confirmed',
          Active: 'Subscription Activated',
          Paused: 'Subscription Paused',
          Closed: 'Subscription Closed',
          Draft: 'Reset to Draft',
        }[newStatus] || `Status updated to ${newStatus}`;

        const newActivity = {
          id: 'act-' + Date.now(),
          timestamp: new Date().toLocaleString(),
          title: actionLabel,
          description: reason || `Status changed from ${sub.status} to ${newStatus}.`,
          user: 'Operator',
          type: newStatus.toLowerCase(),
        };

        toast.success(`Subscription status updated to ${newStatus}`);
        return {
          ...sub,
          status: newStatus,
          activityTimeline: [newActivity, ...(sub.activityTimeline || [])],
        };
      }
      return sub;
    }));
  };

  const renewSubscription = (id) => {
    setSubscriptions(subscriptions.map(sub => {
      if (sub.id === id) {
        const currentExp = new Date(sub.expiryDate || new Date());
        currentExp.setFullYear(currentExp.getFullYear() + 1);
        const newExpiry = currentExp.toISOString().slice(0, 10);

        const newActivity = {
          id: 'act-' + Date.now(),
          timestamp: new Date().toLocaleString(),
          title: 'Subscription Renewed',
          description: `Contract extended by 1 year. New expiry date: ${newExpiry}.`,
          user: 'Renewals System',
          type: 'renew',
        };

        toast.success(`Subscription renewed until ${newExpiry}!`);
        return {
          ...sub,
          expiryDate: newExpiry,
          status: 'Active',
          activityTimeline: [newActivity, ...(sub.activityTimeline || [])],
        };
      }
      return sub;
    }));
  };

  // --- INVOICES ---
  const addInvoice = (inv) => {
    const invNumber = `INV-2024-${String(invoices.length + 101).padStart(4, '0')}`;
    const newInv = {
      ...inv,
      id: `INV-${Date.now()}`,
      invoiceNumber: invNumber,
      status: inv.status || 'Draft',
      paidAmount: 0,
      outstandingAmount: inv.total || 0,
    };
    setInvoices([newInv, ...invoices]);
    toast.success(`Invoice ${invNumber} created`);
    return newInv;
  };

  const confirmInvoice = (id) => {
    setInvoices(invoices.map(inv => {
      if (inv.id === id) {
        toast.success(`Invoice ${inv.invoiceNumber} confirmed`);
        return { ...inv, status: 'Confirmed' };
      }
      return inv;
    }));
  };

  const cancelInvoice = (id) => {
    setInvoices(invoices.map(inv => {
      if (inv.id === id) {
        toast.error(`Invoice ${inv.invoiceNumber} cancelled`);
        return { ...inv, status: 'Cancelled' };
      }
      return inv;
    }));
  };

  const sendInvoice = (id, targetEmail) => {
    const inv = invoices.find(i => i.id === id);
    toast.success(`Invoice ${inv?.invoiceNumber || id} sent to ${targetEmail || 'customer'}!`);
  };

  // --- PAYMENTS ---
  const recordPayment = ({ invoiceId, customerId, amount, paymentMethod, notes }) => {
    const inv = invoices.find(i => i.id === invoiceId);
    const numAmount = Number(amount);
    const payRef = `PAY-REF-${Math.floor(1000 + Math.random() * 9000)}`;

    const newPayment = {
      id: `PAY-${Date.now()}`,
      paymentReference: payRef,
      customer: inv ? inv.customer : 'Enterprise Client',
      customerId: customerId || (inv ? inv.customerId : 'cust-1'),
      customerEmail: inv?.customerEmail || (customers.find(c => c.id === (customerId || inv?.customerId))?.email) || '',
      invoice: inv ? inv.invoiceNumber : 'Manual Settlement',
      invoiceId: invoiceId,
      paymentMethod,
      amount: numAmount,
      paymentDate: new Date().toISOString().slice(0, 10),
      transactionId: `TXN-${paymentMethod.toUpperCase().slice(0, 3)}-${Date.now().toString().slice(-6)}`,
      notes: notes || 'Payment processed via Brightloop billing portal',
      status: 'Success',
    };

    setPayments([newPayment, ...payments]);

    // Update invoice paid & outstanding amounts
    if (inv) {
      setInvoices(invoices.map(item => {
        if (item.id === invoiceId) {
          const newPaid = Number(item.paidAmount || 0) + numAmount;
          const newOutstanding = Math.max(0, Number(item.total || 0) - newPaid);
          const newStatus = newOutstanding <= 0 ? 'Paid' : 'Confirmed';
          return {
            ...item,
            paidAmount: newPaid,
            outstandingAmount: newOutstanding,
            status: newStatus,
          };
        }
        return item;
      }));
    }

    // Update customer outstanding balance
    setCustomers(customers.map(c => {
      if (c.id === customerId || (inv && c.id === inv.customerId)) {
        return {
          ...c,
          outstandingBalance: Math.max(0, Number(c.outstandingBalance || 0) - numAmount),
        };
      }
      return c;
    }));

    toast.success(`Payment of ₹${numAmount.toLocaleString('en-IN')} recorded successfully!`);
    return newPayment;
  };

  // --- DISCOUNTS ---
  const addDiscount = (disc) => {
    const newDisc = {
      ...disc,
      id: 'disc-' + Date.now(),
      status: disc.status || 'Active',
      usageCount: 0,
    };
    setDiscounts([newDisc, ...discounts]);
    toast.success(`Discount code "${newDisc.code}" created`);
    return newDisc;
  };

  const updateDiscount = (id, updated) => {
    setDiscounts(discounts.map(d => d.id === id ? { ...d, ...updated } : d));
    toast.success('Discount updated');
  };

  const toggleDiscountStatus = (id) => {
    setDiscounts(discounts.map(d => {
      if (d.id === id) {
        const next = d.status === 'Active' ? 'Inactive' : 'Active';
        toast.success(`Discount status set to ${next}`);
        return { ...d, status: next };
      }
      return d;
    }));
  };

  // --- CUSTOMERS ---
  const addCustomer = (cust) => {
    const newCust = {
      ...cust,
      id: 'cust-' + Date.now(),
      registrationDate: new Date().toISOString().slice(0, 10),
      activeSubscriptionsCount: 0,
      totalInvoicesCount: 0,
      outstandingBalance: 0,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(cust.name)}&background=4f46e5&color=fff`,
    };
    setCustomers([newCust, ...customers]);
    toast.success(`Customer "${newCust.name}" registered`);
    return newCust;
  };

  const updateCustomer = (id, updated) => {
    setCustomers(customers.map(c => c.id === id ? { ...c, ...updated } : c));
    toast.success('Customer profile updated');
  };

  // --- SETTINGS & STAFF ---
  const updateCompanyProfile = (profile) => {
    setSettings({ ...settings, companyProfile: { ...settings.companyProfile, ...profile } });
    toast.success('Company settings saved');
  };

  const addStaffMember = (staff) => {
    const newStaff = {
      ...staff,
      id: 'staff-' + Date.now(),
      status: 'Active',
      lastActive: 'Just now',
    };
    setSettings({
      ...settings,
      staffMembers: [...settings.staffMembers, newStaff],
    });
    toast.success(`Staff member "${newStaff.name}" added`);
  };

  const deleteStaffMember = (id) => {
    setSettings({
      ...settings,
      staffMembers: settings.staffMembers.filter(s => s.id !== id),
    });
    toast.success('Staff member removed');
  };

  const updateTaxConfig = (newTaxList) => {
    setSettings({ ...settings, taxConfig: newTaxList });
    toast.success('Tax rules updated');
  };

  const updateNotificationPreferences = (prefs) => {
    setSettings({ ...settings, notificationPreferences: { ...settings.notificationPreferences, ...prefs } });
    toast.success('Notification preferences updated');
  };

  // Dynamic Demo Customer for Portal
  const portalCustomer = useMemo(() => {
    if (!user || user.role !== ROLES.CUSTOMER) {
      return customers.find(c => c.id === portalCustomerId) || customers[0];
    }
    const found = customers.find(c =>
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
      avatar: user.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
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
      const exists = customers.some(c => c.id === portalCustomer.id || c.email?.toLowerCase() === portalCustomer.email?.toLowerCase());
      if (!exists) {
        setCustomers(prev => [portalCustomer, ...prev]);
      }
    }
  }, [user, portalCustomer]);

  return (
    <DataContext.Provider
      value={{
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

