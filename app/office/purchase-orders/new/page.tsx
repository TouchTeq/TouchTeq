'use client';

import { useState, useEffect, useMemo } from 'react';
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
  Link as LinkIcon
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

  const [quotes, setQuotes] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);

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
      // Get next PO number via RPC
      const { data: poNumber, error: poNumError } = await supabase.rpc('generate_po_number');
      if (poNumError) throw poNumError;

      const { data: po, error: poError } = await supabase
        .from('purchase_orders')
        .insert({
          po_number: poNumber,
          supplier_name: formData.supplier_name,
          supplier_contact: formData.supplier_contact,
          supplier_email: formData.supplier_email,
          date_raised: formData.date_raised,
          delivery_date: formData.delivery_date || null,
          status: sendToSupplier ? 'Sent' : formData.status,
          linked_quote_id: formData.linked_quote_id || null,
          linked_invoice_id: formData.linked_invoice_id || null,
          notes: formData.notes,
          subtotal: totals.subtotal,
          vat_amount: totals.vat_amount,
          total: totals.total
        })
        .select()
        .single();

      if (poError) throw poError;

      // Insert line items
      const itemsToInsert = lineItems
        .filter(item => item.description.trim())
        .map(item => ({
          purchase_order_id: po.id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          line_total: item.total
        }));

      const { error: itemsError } = await supabase
        .from('purchase_order_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      if (sendToSupplier && formData.supplier_email) {
        try {
          // Generate PDF
          const fullPO = { 
            ...po, 
            purchase_order_items: itemsToInsert 
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

          // Send Email
          await sendDocumentEmail({
            supabase,
            documentType: 'purchase-order',
            documentId: po.id,
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
      router.push(`/office/purchase-orders/${po.id}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to save purchase order.');
      toast.error({ title: 'Error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
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
            <h2 className="text-xs font-black uppercase text-slate-500 mb-4">Supplier Details</h2>
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
          <div className="bg-[#151B28] border border-slate-800/50 p-6 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-black uppercase text-slate-500">Line Items</h2>
              <button 
                onClick={addLineItem}
                className="flex items-center gap-1 text-orange-500 text-xs font-black uppercase hover:text-orange-400"
              >
                <Plus size={14} /> Add Item
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-slate-500 text-[9px] uppercase font-black border-b border-slate-800">
                    <th className="text-left py-3 px-2">Description</th>
                    <th className="text-right py-3 px-2 w-24">Qty</th>
                    <th className="text-right py-3 px-2 w-32">Unit Price</th>
                    <th className="text-right py-3 px-2 w-32">Total</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/30">
                  {lineItems.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-3 px-2">
                        <input 
                          type="text"
                          value={item.description}
                          onChange={(e) => updateLineItem(idx, 'description', e.target.value)}
                          placeholder="Item description"
                          className="w-full bg-transparent border-none text-white text-sm focus:outline-none"
                        />
                      </td>
                      <td className="py-3 px-2">
                        <input 
                          type="number"
                          value={item.quantity}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => updateLineItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-full bg-[#0B0F19] border border-slate-800 rounded px-2 py-1 text-white text-sm text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </td>
                      <td className="py-3 px-2">
                        <input 
                          type="number"
                          value={item.unit_price}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => updateLineItem(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                          className="w-full bg-[#0B0F19] border border-slate-800 rounded px-2 py-1 text-white text-sm text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </td>
                      <td className="py-3 px-2 text-right font-black text-white">
                        {formatCurrency(item.total)}
                      </td>
                      <td className="py-3 px-2">
                        <button 
                          onClick={() => removeLineItem(idx)}
                          className="p-1 text-slate-500 hover:text-red-500"
                          disabled={lineItems.length === 1}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="mt-6 flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="text-white font-bold">{formatCurrency(totals.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">VAT (15%)</span>
                  <span className="text-white font-bold">{formatCurrency(totals.vat_amount)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-800 pt-2">
                  <span className="text-white font-black uppercase">Total</span>
                  <span className="text-orange-500 font-black text-lg">{formatCurrency(totals.total)}</span>
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
