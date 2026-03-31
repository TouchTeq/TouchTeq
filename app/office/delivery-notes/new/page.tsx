'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Plus, 
  Trash2, 
  Save, 
  ArrowLeft, 
  Building2, 
  User, 
  Mail, 
  Calendar,
  FileText,
  Search,
  X,
  ChevronDown,
  Send,
  Download
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { createClient } from '@/lib/supabase/client';
import { useOfficeToast } from '@/components/office/OfficeToastContext';
import { DatePicker } from '@/components/ui/DatePicker';

export default function NewDeliveryNotePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const linkedInvoiceId = searchParams.get('invoiceId');
  const supabase = createClient();
  const toast = useOfficeToast();

  const [loading, setLoading] = useState(false);
  const [fetchingClients, setFetchingClients] = useState(true);
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [fetchingInvoices, setFetchingInvoices] = useState(false);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  const [dnNumber, setDnNumber] = useState('DN-....');
  
  const [formData, setFormData] = useState({
    date_of_delivery: format(new Date(), 'yyyy-MM-dd'),
    delivery_address: '',
    delivered_by: 'Thabo Matona',
    notes: '',
    status: 'Delivered'
  });

  const [items, setItems] = useState([
    { description: '', quantity: 1, condition: 'New' }
  ]);

  // Load clients
  useEffect(() => {
    async function fetchClients() {
      const { data } = await supabase
        .from('clients')
        .select('*')
        .eq('is_active', true)
        .order('company_name');
      setClients(data || []);
      setFetchingClients(false);
    }
    fetchClients();
  }, [supabase]);

  // Generate DN number from DB sequence (concurrency-safe)
  useEffect(() => {
    async function generateDnNumber() {
      const { data: dnNumber, error } = await supabase.rpc('generate_delivery_note_number');
      if (error) {
        console.error('Failed to generate delivery note number:', error);
      }
      setDnNumber(dnNumber || 'DN-0001');
    }
    generateDnNumber();
  }, [supabase]);

  // Load linked invoice if provided
  useEffect(() => {
    if (!linkedInvoiceId) return;

    async function fetchInvoice() {
      const { data: invoice } = await supabase
        .from('invoices')
        .select('*, clients(*)')
        .eq('id', linkedInvoiceId)
        .single();

      if (invoice) {
        setSelectedInvoice(invoice);
        setSelectedClient(invoice.clients);
        setFormData(prev => ({
          ...prev,
          delivery_address: invoice.clients?.physical_address || ''
        }));
      }
    }
    fetchInvoice();
  }, [linkedInvoiceId, supabase]);

  const handleAddItem = () => {
    setItems([...items, { description: '', quantity: 1, condition: 'New' }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSave = async () => {
    if (!selectedClient) {
      toast.error({ title: 'Client Required', message: 'Please select a client.' });
      return;
    }

    const validItems = items.filter(i => i.description.trim());
    if (validItems.length === 0) {
      toast.error({ title: 'Items Required', message: 'Please add at least one item.' });
      return;
    }

    setLoading(true);
    try {
      // Create delivery note
      const { data: dn, error } = await supabase
        .from('delivery_notes')
        .insert({
          delivery_note_number: dnNumber,
          client_id: selectedClient.id,
          linked_invoice_id: selectedInvoice?.id || null,
          date_of_delivery: formData.date_of_delivery,
          delivery_address: formData.delivery_address,
          delivered_by: formData.delivered_by,
          notes: formData.notes,
          status: 'Delivered'
        })
        .select()
        .single();

      if (error) throw error;

      // Create line items
      const lineItems = validItems.map((item, index) => ({
        delivery_note_id: dn.id,
        description: item.description,
        quantity: item.quantity,
        condition: item.condition,
        sort_order: index
      }));

      const { error: itemsError } = await supabase
        .from('delivery_note_items')
        .insert(lineItems);

      if (itemsError) throw itemsError;

      toast.success({ title: 'Created', message: `Delivery Note ${dnNumber} has been created.` });
      router.push(`/office/delivery-notes/${dn.id}`);
    } catch (e: any) {
      toast.error({ title: 'Creation Failed', message: e.message });
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter(c => 
    c.company_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/office/delivery-notes" className="p-2 text-slate-400 hover:text-white">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-black text-white uppercase tracking-tight">New Delivery Note</h1>
            <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mt-1">
              Create a delivery note for client sign-off
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 transition-all font-black text-xs uppercase tracking-widest text-white px-6 py-3 rounded-sm"
          >
            {loading ? 'Saving...' : <><Save size={16} /> Save Delivery Note</>}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client & Invoice Selection */}
          <div className="bg-[#151B28] border border-slate-800/50 rounded-xl p-6 space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-800/50 pb-4">
              <Building2 className="text-orange-500" size={18} />
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-white">Client & Invoice</h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Client Selection */}
              <div className="relative">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Client</label>
                <button
                  type="button"
                  onClick={() => setIsClientModalOpen(true)}
                  className="w-full flex items-center justify-between px-4 py-3 border border-slate-700 rounded-lg bg-[#0B0F19] text-white font-bold text-sm"
                >
                  <span>{selectedClient?.company_name || 'Select Client'}</span>
                  <ChevronDown size={14} className="text-slate-500" />
                </button>
              </div>

              {/* Linked Invoice */}
              <div className="relative">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Linked Invoice (Optional)</label>
                <button
                  type="button"
                  onClick={() => setIsInvoiceModalOpen(true)}
                  className="w-full flex items-center justify-between px-4 py-3 border border-slate-700 rounded-lg bg-[#0B0F19] text-white font-bold text-sm"
                >
                  <span>{selectedInvoice?.invoice_number || 'Select Invoice'}</span>
                  <ChevronDown size={14} className="text-slate-500" />
                </button>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="bg-[#151B28] border border-slate-800/50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <FileText className="text-orange-500" size={18} />
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-white">Items Delivered</h2>
              </div>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-2 text-orange-500 hover:text-orange-400 text-xs font-black uppercase tracking-widest"
              >
                <Plus size={14} /> Add Item
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="flex gap-3 items-start">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      placeholder="Description"
                      className="w-full bg-[#0B0F19] border border-slate-800 rounded-lg px-4 py-2 text-white text-sm focus:border-orange-500 outline-none"
                    />
                  </div>
                  <div className="w-24">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                      className="w-full bg-[#0B0F19] border border-slate-800 rounded-lg px-4 py-2 text-white text-sm focus:border-orange-500 outline-none text-center"
                    />
                  </div>
                  <div className="w-32">
                    <select
                      value={item.condition}
                      onChange={(e) => handleItemChange(index, 'condition', e.target.value)}
                      className="w-full bg-[#0B0F19] border border-slate-800 rounded-lg px-4 py-2 text-white text-sm focus:border-orange-500 outline-none"
                    >
                      <option value="New">New</option>
                      <option value="Used">Used</option>
                      <option value="Repaired">Repaired</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    disabled={items.length === 1}
                    className="p-2 text-slate-500 hover:text-red-500 disabled:opacity-30"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="bg-[#151B28] border border-slate-800/50 rounded-xl p-6">
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="Any additional notes..."
              rows={4}
              className="w-full bg-[#0B0F19] border border-slate-800 rounded-lg px-4 py-3 text-white text-sm focus:border-orange-500 outline-none resize-none"
            />
          </div>
        </div>

        {/* Right Column - Settings */}
        <div className="space-y-6">
          {/* DN Details */}
          <div className="bg-[#151B28] border border-slate-800/50 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-800/50 pb-4">
              <FileText className="text-orange-500" size={18} />
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-white">Delivery Note Details</h2>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">DN Number</label>
              <input
                type="text"
                value={dnNumber}
                onChange={(e) => setDnNumber(e.target.value)}
                className="w-full bg-[#0B0F19] border border-slate-800 rounded-lg px-4 py-3 text-white font-bold text-sm"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Date of Delivery</label>
              <DatePicker 
                value={formData.date_of_delivery}
                onChange={(val) => setFormData({...formData, date_of_delivery: val})}
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Delivered By</label>
              <input
                type="text"
                value={formData.delivered_by}
                onChange={(e) => setFormData({...formData, delivered_by: e.target.value})}
                className="w-full bg-[#0B0F19] border border-slate-800 rounded-lg px-4 py-3 text-white font-bold text-sm"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Delivery Address</label>
              <textarea
                value={formData.delivery_address}
                onChange={(e) => setFormData({...formData, delivery_address: e.target.value})}
                rows={3}
                className="w-full bg-[#0B0F19] border border-slate-800 rounded-lg px-4 py-3 text-white text-sm focus:border-orange-500 outline-none resize-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Client Modal */}
      <AnimatePresence>
        {isClientModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80" onClick={() => setIsClientModalOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#151B28] border border-slate-800 rounded-xl w-full max-w-md relative z-10"
            >
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <h3 className="text-white font-black uppercase text-sm">Select Client</h3>
                <button onClick={() => setIsClientModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              <div className="p-4">
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search clients..."
                    className="w-full bg-[#0B0F19] border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-white text-sm"
                    autoFocus
                  />
                </div>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {filteredClients.map(client => (
                    <button
                      key={client.id}
                      onClick={() => {
                        setSelectedClient(client);
                        setFormData(prev => ({
                          ...prev,
                          delivery_address: client.physical_address || ''
                        }));
                        setIsClientModalOpen(false);
                        setSearchTerm('');
                      }}
                      className="w-full text-left p-3 rounded-lg hover:bg-slate-800 transition-colors"
                    >
                      <p className="text-white font-bold text-sm">{client.company_name}</p>
                      <p className="text-slate-500 text-xs">{client.email}</p>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Invoice Modal */}
      <AnimatePresence>
        {isInvoiceModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80" onClick={() => setIsInvoiceModalOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#151B28] border border-slate-800 rounded-xl w-full max-w-md relative z-10"
            >
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <h3 className="text-white font-black uppercase text-sm">Link Invoice (Optional)</h3>
                <button onClick={() => setIsInvoiceModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              <div className="p-4">
                <button
                  onClick={() => {
                    setSelectedInvoice(null);
                    setIsInvoiceModalOpen(false);
                  }}
                  className="w-full text-left p-3 rounded-lg hover:bg-slate-800 transition-colors mb-2"
                >
                  <p className="text-slate-400 text-sm">No linked invoice</p>
                </button>
                {invoices.length > 0 ? (
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {invoices.map(invoice => (
                      <button
                        key={invoice.id}
                        onClick={() => {
                          setSelectedInvoice(invoice);
                          setIsInvoiceModalOpen(false);
                        }}
                        className="w-full text-left p-3 rounded-lg hover:bg-slate-800 transition-colors"
                      >
                        <p className="text-white font-bold text-sm">{invoice.invoice_number}</p>
                        <p className="text-slate-500 text-xs">R {invoice.total?.toLocaleString()}</p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-sm text-center py-4">No invoices found</p>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
