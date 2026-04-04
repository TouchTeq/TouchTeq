'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  Send,
  Download,
  Loader2,
  FileText,
  ChevronDown,
  Link as LinkIcon,
  Package
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import { createClient } from '@/lib/supabase/client';
import { useOfficeToast } from '@/components/office/OfficeToastContext';
import { DatePicker } from '@/components/ui/DatePicker';
import { PurchaseOrderPDF } from '@/lib/office/PurchaseOrderPDF';
import { pdf } from '@react-pdf/renderer';
import { sendDocumentEmail } from '@/lib/office/outbound-email';

type LineItem = {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
};

const PO_STATUSES = ['Draft', 'Sent', 'Acknowledged', 'Delivered', 'Cancelled'];

export default function NewPurchaseOrderPage() {
  const router = useRouter();
  const supabase = createClient();
  const toast = useOfficeToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    supplier_name: '',
    supplier_contact: '',
    supplier_email: '',
    date_raised: format(new Date(), 'yyyy-MM-dd'),
    delivery_date: '',
    status: 'Draft',
    linked_quote_id: '',
    linked_invoice_id: '',
    notes: ''
  });
  const [statusOpen, setStatusOpen] = useState(false);

  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: '', quantity: 1, unit_price: 0, total: 0 }
  ]);
  const descriptionRefs = useRef<(HTMLTextAreaElement | null)[]>([]);

  const [quotes, setQuotes] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [supplierId, setSupplierId] = useState<string | null>(null);
  const [supplierSearch, setSupplierSearch] = useState('');
  const [supplierResults, setSupplierResults] = useState<any[]>([]);
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const { data: quotesData } = await supabase
        .from('quotes')
        .select('id, quote_number, clients(company_name)')
        .in('status', ['Accepted'])
        .order('created_at', { ascending: false });

      const { data: invoicesData } = await supabase
        .from('invoices')
        .select('id, invoice_number, clients(company_name)')
        .eq('status', 'Paid')
        .order('created_at', { ascending: false });

      setQuotes(quotesData || []);
      setInvoices(invoicesData || []);
    }
    fetchData();
  }, []);

  // Supplier search effect
  useEffect(() => {
    if (supplierSearch.trim().length < 2) {
      setSupplierResults([]);
      setShowSupplierDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('clients')
        .select('id, company_name, contact_person, email, phone')
        .or(`category.eq.Supplier,category.is.null`)
        .ilike('company_name', `%${supplierSearch}%`)
        .eq('is_active', true)
        .limit(8);

      setSupplierResults(data || []);
      setShowSupplierDropdown(true);
    }, 250);

    return () => clearTimeout(timer);
  }, [supplierSearch]);

  const selectSupplier = (supplier: any) => {
    setSupplierId(supplier.id);
    setFormData(prev => ({
      ...prev,
      supplier_name: supplier.company_name,
      supplier_contact: supplier.contact_person || '',
      supplier_email: supplier.email || '',
    }));
    setSupplierSearch(supplier.company_name);
    setShowSupplierDropdown(false);
  };

  const clearSupplier = () => {
    setSupplierId(null);
    setFormData(prev => ({
      ...prev,
      supplier_name: '',
      supplier_contact: '',
      supplier_email: '',
    }));
    setSupplierSearch('');
  };

  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateLineItem = (index: number, field: keyof LineItem, value: any) => {
    setLineItems(prev => {
      const newItems = [...prev];
      const item = { ...newItems[index], [field]: value };
      if (field === 'quantity' || field === 'unit_price') {
        item.total = Number(item.quantity) * Number(item.unit_price);
      }
      newItems[index] = item;
      return newItems;
    });
  };

  const addLineItem = () => {
    setLineItems(prev => [...prev, { description: '', quantity: 1, unit_price: 0, total: 0 }]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(prev => prev.filter((_, i) => i !== index));
    }
  };

  const totals = useMemo(() => {
    const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
    const vat_amount = subtotal * 0.15;
    const total = subtotal + vat_amount;
    return { subtotal, vat_amount, total };
  }, [lineItems]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount).replace('ZAR', 'R');

  const handleSave = async (sendToSupplier: boolean = false) => {
    if (!formData.supplier_name.trim()) {
      toast.error({ title: 'Required', message: 'Please enter a supplier name.' });
      return;
    }

    const hasValidItems = lineItems.some(item => item.description.trim() && item.total > 0);
    if (!hasValidItems) {
      toast.error({ title: 'Required', message: 'Please add at least one line item with description and price.' });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const itemsJson = lineItems
        .filter(item => item.description.trim())
        .map(item => ({
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
        }));

      const newStatus = sendToSupplier ? 'Sent' : formData.status;

      const { data: result, error: rpcError } = await supabase.rpc('create_purchase_order_with_items', {
        p_supplier_name: formData.supplier_name,
        p_line_items: itemsJson,
        p_notes: formData.notes || null,
        p_date_raised: formData.date_raised,
        p_status: newStatus,
        p_supplier_contact: formData.supplier_contact || null,
        p_supplier_email: formData.supplier_email || null,
        p_delivery_date: formData.delivery_date || null,
        p_linked_quote_id: formData.linked_quote_id || null,
        p_linked_invoice_id: formData.linked_invoice_id || null,
        p_supplier_id: supplierId || null,
      });

      if (rpcError || !result) throw new Error(rpcError?.message || 'Purchase order creation failed');

      const poNumber = result.document_number;

      if (sendToSupplier && formData.supplier_email) {
        try {
          const fullPO = {
            id: result.id,
            po_number: poNumber,
            supplier_name: result.supplier_name,
            supplier_contact: formData.supplier_contact,
            supplier_email: formData.supplier_email,
            date_raised: formData.date_raised,
            delivery_date: formData.delivery_date,
            status: newStatus,
            notes: formData.notes,
            subtotal: result.subtotal,
            vat_amount: result.vat_amount,
            total: result.total,
            purchase_order_items: itemsJson.map((item: any) => ({
              description: item.description,
              quantity: item.quantity,
              unit_price: item.unit_price,
              line_total: item.quantity * item.unit_price,
            })),
          };
          const blob = await pdf(<PurchaseOrderPDF po={fullPO} />).toBlob();
          const reader = new FileReader();
          const base64Promise = new Promise<string>((resolve) => {
            reader.onloadend = () => {
              const base64String = (reader.result as string).split(',')[1];
              resolve(base64String);
            };
          });
          reader.readAsDataURL(blob);
          const base64 = await base64Promise;

          await sendDocumentEmail({
            supabase,
            documentType: 'purchase-order',
            documentId: result.id,
            attachmentBase64: base64,
            recipientEmail: formData.supplier_email,
            recipientName: formData.supplier_contact || formData.supplier_name
          });

          toast.success({ title: 'Sent', message: `PO ${poNumber} sent to ${formData.supplier_email}.` });
        } catch (emailErr) {
          console.error('Email error:', emailErr);
          toast.error({ title: 'Email Failed', message: 'PO saved but email delivery failed.' });
        }
      }

      toast.success({ title: 'Saved', message: `Purchase Order ${poNumber} created successfully.` });
      router.push(`/office/purchase-orders/${result.id}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to save purchase order.');
      toast.error({ title: 'Error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 text-slate-500 hover:text-white">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-white uppercase">New Purchase Order</h1>
            <p className="text-slate-500 text-sm">Create an order to a supplier</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleSave(false)}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2 text-xs font-black uppercase bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700"
          >
            {loading ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
            Save Draft
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2 text-xs font-black uppercase bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            {loading ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />}
            Save & Send
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Supplier Details */}
          <div className="bg-[#151B28] border border-slate-800/50 p-6 rounded-xl">
            <h2 className="text-xs font-black uppercase text-slate-500 mb-4 flex items-center gap-2">
              Supplier Details
              {supplierId && (
                <button
                  type="button"
                  onClick={clearSupplier}
                  className="text-[9px] font-bold text-orange-500 hover:text-white uppercase tracking-widest"
                >
                  × Clear
                </button>
              )}
            </h2>
            {/* Supplier Search */}
            <div className="mb-4 relative">
              <label className="text-[10px] font-black uppercase text-slate-500">Search Existing Supplier</label>
              <input
                type="text"
                value={supplierSearch}
                onChange={(e) => {
                  setSupplierSearch(e.target.value);
                  if (supplierId) { setSupplierId(null); }
                }}
                onFocus={() => { if (supplierResults.length > 0) setShowSupplierDropdown(true); }}
                onBlur={() => setTimeout(() => setShowSupplierDropdown(false), 200)}
                placeholder="Type to search suppliers..."
                className="w-full bg-[#0B0F19] border border-slate-800 rounded-lg px-4 py-2 text-white text-sm mt-1"
              />
              {showSupplierDropdown && supplierResults.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-[#0B0F19] border border-slate-700 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                  {supplierResults.map(s => (
                    <button
                      key={s.id}
                      type="button"
                      onMouseDown={() => selectSupplier(s)}
                      className="w-full px-4 py-2 text-left text-sm text-white hover:bg-slate-800 flex items-center justify-between"
                    >
                      <span>{s.company_name}</span>
                      {s.email && <span className="text-[10px] text-slate-500">{s.email}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500">Supplier Name *</label>
                <input
                  type="text"
                  value={formData.supplier_name}
                  onChange={(e) => handleFieldChange('supplier_name', e.target.value)}
                  placeholder="Enter supplier name"
                  className="w-full bg-[#0B0F19] border border-slate-800 rounded-lg px-4 py-2 text-white text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500">Contact Person</label>
                <input
                  type="text"
                  value={formData.supplier_contact}
                  onChange={(e) => handleFieldChange('supplier_contact', e.target.value)}
                  placeholder="Contact name"
                  className="w-full bg-[#0B0F19] border border-slate-800 rounded-lg px-4 py-2 text-white text-sm"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-black uppercase text-slate-500">Supplier Email</label>
                <input
                  type="email"
                  value={formData.supplier_email}
                  onChange={(e) => handleFieldChange('supplier_email', e.target.value)}
                  placeholder="supplier@email.com"
                  className="w-full bg-[#0B0F19] border border-slate-800 rounded-lg px-4 py-2 text-white text-sm"
                />
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="bg-[#151B28] border border-slate-800/50 rounded-xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-800/50 flex items-center gap-3">
              <Package className="text-orange-500" size={18} />
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-white">Order Items</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-slate-500 text-[10px] uppercase font-bold tracking-[0.2em] border-b border-slate-800/50">
                    <th className="px-8 py-4 w-1/2">Description</th>
                    <th className="px-6 py-4">Qty</th>
                    <th className="px-6 py-4">Unit Price (R)</th>
                    <th className="px-6 py-4 text-right">Total</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/30">
                  {lineItems.map((item, idx) => (
                    <tr key={idx} className="bg-[#0B0F19]/20 group">
                      <td className="px-8 py-4">
                        <textarea
                          ref={(el) => { descriptionRefs.current[idx] = el; }}
                          value={item.description}
                          onChange={(e) => {
                            updateLineItem(idx, 'description', e.target.value);
                            setTimeout(() => {
                              const textarea = descriptionRefs.current[idx];
                              if (textarea) {
                                textarea.style.height = 'auto';
                                textarea.style.height = textarea.scrollHeight + 'px';
                              }
                            }, 0);
                          }}
                          placeholder="Item description"
                          className="w-full bg-[#0B0F19] border border-slate-800 rounded outline-none text-slate-200 text-sm font-medium"
                          rows={1}
                          style={{ minHeight: '2rem', height: 'auto', resize: 'none', overflow: 'hidden', paddingTop: '0.5rem', paddingBottom: '0.375rem', paddingLeft: '0.75rem' }}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={item.quantity}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '') {
                              updateLineItem(idx, 'quantity', 0);
                            } else {
                              const num = parseInt(val.replace(/\D/g, ''), 10);
                              if (!isNaN(num)) updateLineItem(idx, 'quantity', num);
                            }
                          }}
                          onBlur={(e) => {
                            const val = e.target.value;
                            if (val === '' || isNaN(parseInt(val, 10))) {
                              updateLineItem(idx, 'quantity', 1);
                            }
                          }}
                          className="w-16 bg-[#0B0F19] border border-slate-800 rounded p-2 text-center text-white text-xs font-bold"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={item.unit_price}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '') {
                              updateLineItem(idx, 'unit_price', 0);
                            } else {
                              const num = parseFloat(val.replace(/[^\d.]/g, ''));
                              if (!isNaN(num)) updateLineItem(idx, 'unit_price', num);
                            }
                          }}
                          onBlur={(e) => {
                            const val = e.target.value;
                            if (val === '' || isNaN(parseFloat(val))) {
                              updateLineItem(idx, 'unit_price', 0);
                            }
                          }}
                          className="w-28 bg-[#0B0F19] border border-slate-800 rounded p-2 text-right text-white text-xs font-bold"
                        />
                      </td>
                      <td className="px-6 py-4 text-right font-black text-sm text-slate-200">
                        {formatCurrency(item.total)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => removeLineItem(idx)}
                          className={`p-2 text-slate-700 hover:text-red-500 transition-colors ${lineItems.length === 1 ? 'opacity-0 pointer-events-none' : ''}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-8 flex flex-col md:flex-row justify-between items-start gap-8">
              <button
                type="button"
                onClick={addLineItem}
                className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-orange-500 hover:text-white transition-colors"
              >
                <Plus size={16} /> Add Line Item
              </button>
              <div className="w-full md:w-96 md:ml-auto space-y-3 pt-6 border-t md:border-t-0 md:pt-0 border-slate-800">
                <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-500">
                  <span>Subtotal</span>
                  <span className="font-bold text-right min-w-[120px]">{formatCurrency(totals.subtotal)}</span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-500">
                  <span>VAT (15%)</span>
                  <span className="font-bold text-right min-w-[120px]">{formatCurrency(totals.vat_amount)}</span>
                </div>
                <div className="flex justify-between items-center py-4 border-t border-slate-800">
                  <span className="text-xs font-black uppercase text-white">Total</span>
                  <span className="text-2xl font-black text-orange-500 text-right min-w-[120px]">{formatCurrency(totals.total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Details */}
          <div className="bg-[#151B28] border border-slate-800/50 p-6 rounded-xl">
            <h2 className="text-xs font-black uppercase text-slate-500 mb-4">Order Details</h2>
            <div className="space-y-4">
              <DatePicker
                label="Date Raised"
                value={formData.date_raised}
                onChange={(val) => handleFieldChange('date_raised', val)}
              />
              <DatePicker
                label="Expected Delivery"
                value={formData.delivery_date}
                onChange={(val) => handleFieldChange('delivery_date', val)}
              />
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500">Status</label>
                <button
                  type="button"
                  onClick={() => setStatusOpen(!statusOpen)}
                  className="w-full flex items-center justify-between px-4 py-2 bg-[#0B0F19] border border-slate-800 rounded-lg text-white text-sm"
                >
                  {formData.status}
                  <ChevronDown size={14} className={`transition-transform ${statusOpen ? 'rotate-180' : ''}`} />
                </button>
                {statusOpen && (
                  <div className="mt-2 bg-[#0B0F19] border border-slate-800 rounded-lg overflow-hidden">
                    {PO_STATUSES.map(status => (
                      <button
                        key={status}
                        onClick={() => {
                          handleFieldChange('status', status);
                          setStatusOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left text-white text-sm hover:bg-slate-800"
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Linked Documents */}
          <div className="bg-[#151B28] border border-slate-800/50 p-6 rounded-xl">
            <h2 className="text-xs font-black uppercase text-slate-500 mb-4 flex items-center gap-2">
              <LinkIcon size={14} /> Linked Documents
            </h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500">Linked Quote (optional)</label>
                <select
                  value={formData.linked_quote_id}
                  onChange={(e) => handleFieldChange('linked_quote_id', e.target.value)}
                  className="w-full bg-[#0B0F19] border border-slate-800 rounded-lg px-4 py-2 text-white text-sm"
                >
                  <option value="">None</option>
                  {quotes.map(q => (
                    <option key={q.id} value={q.id}>
                      {q.quote_number} - {q.clients?.company_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500">Linked Invoice (optional)</label>
                <select
                  value={formData.linked_invoice_id}
                  onChange={(e) => handleFieldChange('linked_invoice_id', e.target.value)}
                  className="w-full bg-[#0B0F19] border border-slate-800 rounded-lg px-4 py-2 text-white text-sm"
                >
                  <option value="">None</option>
                  {invoices.map(inv => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoice_number} - {inv.clients?.company_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-[#151B28] border border-slate-800/50 p-6 rounded-xl">
            <h2 className="text-xs font-black uppercase text-slate-500 mb-4">Notes</h2>
            <textarea
              value={formData.notes}
              onChange={(e) => handleFieldChange('notes', e.target.value)}
              rows={4}
              placeholder="Additional notes..."
              className="w-full bg-[#0B0F19] border border-slate-800 rounded-lg px-4 py-2 text-white text-sm resize-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
