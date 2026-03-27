'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Send, Download, Loader2, X, Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { pdf } from '@react-pdf/renderer';
import { createClient } from '@/lib/supabase/client';
import { useOfficeToast } from '@/components/office/OfficeToastContext';
import { DatePicker } from '@/components/ui/DatePicker';
import { CreditNotePDF } from '@/lib/invoices/CreditNotePDF';

const CREDIT_REASONS = [
  'Incorrect Amount',
  'Returned Equipment', 
  'Disputed Charges',
  'Duplicate Invoice',
  'Other'
];

export default function CreateCreditNotePage() {
  const router = useRouter();
  const params = useParams();
  const invoiceId = params.id as string;
  const supabase = createClient();
  const toast = useOfficeToast();

  const [loading, setLoading] = useState(false);
  const [invoice, setInvoice] = useState<any>(null);
  const [lineItems, setLineItems] = useState<any[]>([]);
  const [businessProfile, setBusinessProfile] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    reason: '',
    notes: '',
    issue_date: new Date().toISOString().split('T')[0],
    status: 'Draft' as 'Draft' | 'Sent',
    items: [] as {
      description: string;
      quantity: number;
      unit_price: number;
      vat_rate: number;
      line_total: number;
      invoice_item_id: string;
      selected: boolean;
    }[]
  });

  const totals = useMemo(() => {
    const selectedItems = formData.items.filter(i => i.selected);
    const subtotal = selectedItems.reduce((sum, item) => sum + item.line_total, 0);
    const vat_amount = subtotal * 0.15;
    const total = subtotal + vat_amount;
    return { subtotal, vat_amount, total, itemCount: selectedItems.length };
  }, [formData.items]);

  useEffect(() => {
    async function fetchData() {
      const { data: invoiceData } = await supabase
        .from('invoices')
        .select('*, clients(*)')
        .eq('id', invoiceId)
        .single();

      if (invoiceData) {
        setInvoice(invoiceData);

        const { data: items } = await supabase
          .from('invoice_items')
          .select('*')
          .eq('invoice_id', invoiceId);

        if (items) {
          setLineItems(items);
          setFormData(prev => ({
            ...prev,
            items: items.map((item: any) => ({
              description: item.description,
              quantity: item.quantity,
              unit_price: item.unit_price,
              vat_rate: item.vat_rate || 15,
              line_total: item.line_total,
              invoice_item_id: item.id,
              selected: true
            }))
          }));
        }
      }

      const { data: profile } = await supabase
        .from('business_profile')
        .select('*')
        .single();
      
      if (profile) setBusinessProfile(profile);
    }

    fetchData();
  }, [invoiceId, supabase]);

  const toggleItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, selected: !item.selected } : item
      )
    }));
  };

  const updateItem = (index: number, field: string, value: any) => {
    setFormData(prev => {
      const newItems = [...prev.items];
      const item = { ...newItems[index], [field]: value };
      
      if (field === 'quantity' || field === 'unit_price') {
        item.line_total = Number(item.quantity) * Number(item.unit_price);
      }
      
      newItems[index] = item;
      return { ...prev, items: newItems };
    });
  };

  const handleSave = async () => {
    if (!formData.reason) {
      toast.error({ title: 'Required', message: 'Please select a reason for the credit note.' });
      return;
    }

    if (totals.itemCount === 0) {
      toast.error({ title: 'Required', message: 'Please select at least one item to credit.' });
      return;
    }

    setSaving(true);
    try {
      const selectedItems = formData.items.filter(i => i.selected);
      
      const { data: creditNote, error: cnError } = await supabase
        .from('credit_notes')
        .insert({
          invoice_id: invoiceId,
          client_id: invoice.client_id,
          issue_date: formData.issue_date,
          reason: formData.reason,
          notes: formData.notes,
          status: formData.status,
          subtotal: totals.subtotal,
          vat_amount: totals.vat_amount,
          total: totals.total
        })
        .select()
        .single();

      if (cnError) throw cnError;

      const creditNoteItems = selectedItems.map((item: any) => ({
        credit_note_id: creditNote.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        vat_rate: item.vat_rate,
        line_total: item.line_total,
        invoice_item_id: item.invoice_item_id
      }));

      const { error: itemsError } = await supabase
        .from('credit_note_items')
        .insert(creditNoteItems);

      if (itemsError) throw itemsError;

      const creditStatus = totals.total >= invoice.total ? 'Fully Credited' : 'Partially Credited';
      await supabase
        .from('invoices')
        .update({ 
          credit_note_id: creditNote.id,
          credit_status: creditStatus
        })
        .eq('id', invoiceId);

      toast.success({ title: 'Credit Note Created', message: `Credit note ${creditNote.credit_note_number} has been created.` });
      router.push('/office/invoices?tab=credit-notes');
    } catch (err: any) {
      toast.error({ title: 'Error', message: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPDF = async () => {
    setLoading(true);
    try {
      const selectedItems = formData.items.filter(i => i.selected);
      const blob = await pdf(
        <CreditNotePDF 
          creditNote={{ ...formData, credit_note_number: 'CN-XXXX-XXXX', clients: invoice?.clients, invoices: { invoice_number: invoice?.invoice_number } }} 
          lineItems={selectedItems} 
          businessProfile={businessProfile} 
        />
      ).toBlob();
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Credit-Note-${invoice?.invoice_number}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error({ title: 'PDF Error', message: 'Failed to generate PDF' });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount).replace('ZAR', 'R');

  if (!invoice) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-orange-500" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/office/invoices/${invoiceId}`} className="p-2 text-slate-500 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-white uppercase">Issue Credit Note</h1>
            <p className="text-slate-500 text-sm">For Invoice: {invoice.invoice_number}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleDownloadPDF}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-xs font-black uppercase bg-slate-800 text-slate-300 rounded border border-slate-700"
          >
            {loading ? <Loader2 className="animate-spin" size={14} /> : <Download size={14} />}
            Preview PDF
          </button>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 text-xs font-black uppercase bg-orange-500 text-white rounded hover:bg-orange-600"
          >
            {saving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
            Save Credit Note
          </button>
        </div>
      </div>

      {/* Client Info */}
      <div className="bg-[#151B28] border border-slate-800/50 p-6 rounded-xl">
        <h2 className="text-xs font-black uppercase text-slate-500 mb-4">Client Details</h2>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-white font-black">{invoice.clients?.company_name}</p>
            <p className="text-slate-400 text-sm">{invoice.clients?.contact_person}</p>
            <p className="text-slate-500 text-sm">{invoice.clients?.email}</p>
          </div>
          <div className="text-right">
            <p className="text-slate-500 text-xs uppercase">Original Invoice Total</p>
            <p className="text-white font-black text-xl">{formatCurrency(invoice.total)}</p>
          </div>
        </div>
      </div>

      {/* Credit Note Details */}
      <div className="bg-[#151B28] border border-slate-800/50 p-6 rounded-xl">
        <h2 className="text-xs font-black uppercase text-slate-500 mb-4">Credit Note Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <DatePicker 
            label="Issue Date"
            value={formData.issue_date}
            onChange={(val) => setFormData({ ...formData, issue_date: val })}
          />
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 mb-2">Reason *</label>
            <select 
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="w-full bg-[#0B0F19] border border-slate-800 rounded-lg px-4 py-2 text-white text-sm"
            >
              <option value="">Select reason...</option>
              {CREDIT_REASONS.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 mb-2">Status</label>
            <select 
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full bg-[#0B0F19] border border-slate-800 rounded-lg px-4 py-2 text-white text-sm"
            >
              <option value="Draft">Draft</option>
              <option value="Sent">Sent</option>
            </select>
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-[10px] font-black uppercase text-slate-500 mb-2">Notes</label>
          <textarea 
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Additional notes..."
            rows={2}
            className="w-full bg-[#0B0F19] border border-slate-800 rounded-lg px-4 py-2 text-white text-sm"
          />
        </div>
      </div>

      {/* Line Items */}
      <div className="bg-[#151B28] border border-slate-800/50 p-6 rounded-xl">
        <h2 className="text-xs font-black uppercase text-slate-500 mb-4">Items to Credit</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-slate-500 text-[9px] uppercase font-black border-b border-slate-800">
                <th className="px-4 py-3 w-10"></th>
                <th className="px-4 py-3 text-left">Description</th>
                <th className="px-4 py-3 text-right w-24">Qty</th>
                <th className="px-4 py-3 text-right w-32">Unit Price</th>
                <th className="px-4 py-3 text-right w-32">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/30">
              {formData.items.map((item, idx) => (
                <tr key={idx} className={item.selected ? 'bg-slate-800/20' : 'opacity-50'}>
                  <td className="px-4 py-3">
                    <input 
                      type="checkbox" 
                      checked={item.selected}
                      onChange={() => toggleItem(idx)}
                      className="h-4 w-4 accent-orange-500"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input 
                      type="text" 
                      value={item.description}
                      onChange={(e) => updateItem(idx, 'description', e.target.value)}
                      className="w-full bg-transparent border-none text-white text-sm focus:outline-none"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input 
                      type="number" 
                      value={item.quantity}
                      onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                      className="w-full bg-[#0B0F19] border border-slate-800 rounded px-2 py-1 text-white text-sm text-right"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input 
                      type="number" 
                      value={item.unit_price}
                      onChange={(e) => updateItem(idx, 'unit_price', e.target.value)}
                      className="w-full bg-[#0B0F19] border border-slate-800 rounded px-2 py-1 text-white text-sm text-right"
                    />
                  </td>
                  <td className="px-4 py-3 text-right font-black text-white">
                    {formatCurrency(item.line_total)}
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
              <span className="text-slate-500">Subtotal ({totals.itemCount} items)</span>
              <span className="text-white font-bold">{formatCurrency(totals.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">VAT (15%)</span>
              <span className="text-white font-bold">{formatCurrency(totals.vat_amount)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-800 pt-2">
              <span className="text-red-500 font-black uppercase">Total Credit</span>
              <span className="text-red-500 font-black">{formatCurrency(totals.total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
