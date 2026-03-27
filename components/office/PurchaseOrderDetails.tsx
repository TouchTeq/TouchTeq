'use client';

import { useState } from 'react';
import { 
  X, 
  Download, 
  Mail, 
  Trash2, 
  Edit, 
  Package, 
  Calendar, 
  User, 
  FileText,
  AlertCircle,
  CheckCircle2,
  Clock,
  Eye,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { PDFDownloadLink, PDFViewer } from '@react-pdf/renderer';
import { PurchaseOrderPDF } from '@/lib/office/PurchaseOrderPDF';
import { updatePurchaseOrderStatus } from '@/lib/office/purchaseOrderActions';
import { useOfficeToast } from '@/components/office/OfficeToastContext';
import { DeleteConfirmationModal } from '@/components/office/DeleteConfirmationModal';

interface PurchaseOrderDetailsProps {
  po: any;
  isOpen: boolean;
  onClose: () => void;
  onRefresh?: () => void;
  onDelete: () => void;
}

const STATUS_OPTIONS = ['Draft', 'Sent', 'Acknowledged', 'Delivered', 'Cancelled'];

export function PurchaseOrderDetails({ po, isOpen, onClose, onRefresh, onDelete }: PurchaseOrderDetailsProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'preview'>('details');
  const [isUpdating, setIsUpdating] = useState(false);
  const { success, error } = useOfficeToast();

  if (!po) return null;

  const handleStatusChange = async (newStatus: string) => {
    try {
      setIsUpdating(true);
      await updatePurchaseOrderStatus(po.id, newStatus);
      success({ title: 'Status Updated', message: `PO ${po.po_number} is now ${newStatus}` });
      onRefresh?.();
    } catch (err: any) {
      error({ title: 'Update Failed', message: err.message });
    } finally {
      setIsUpdating(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 2,
    }).format(amount).replace('ZAR', 'R');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative bg-[#0B0F19] w-full max-w-5xl h-[90vh] rounded-2xl border border-slate-800 shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-slate-800 rounded-lg">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                    {po.po_number}
                  </h2>
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                    Supplier: {po.supplier_name}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex bg-slate-800/50 p-1 rounded-lg border border-slate-800">
                  <button
                    onClick={() => setActiveTab('details')}
                    className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${
                      activeTab === 'details' ? 'bg-orange-500 text-white' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    Details
                  </button>
                  <button
                    onClick={() => setActiveTab('preview')}
                    className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${
                      activeTab === 'preview' ? 'bg-orange-500 text-white' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    PDF Preview
                  </button>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-full transition-all"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-hidden flex">
              {activeTab === 'details' ? (
                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                  {/* Status & Actions Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-6 bg-slate-900/30 p-6 rounded-xl border border-slate-800/50">
                    <div className="space-y-3">
                      <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">Change Status</p>
                      <div className="flex flex-wrap gap-2">
                        {STATUS_OPTIONS.map((status) => (
                          <button
                            key={status}
                            disabled={isUpdating}
                            onClick={() => handleStatusChange(status)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${
                              po.status === status
                                ? 'bg-orange-500 border-orange-500 text-white'
                                : 'bg-slate-800/50 border-slate-700 text-slate-500 hover:text-slate-300 hover:border-slate-600'
                            }`}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest border border-slate-700 transition-all">
                        <Edit size={14} /> Edit PO
                      </button>
                      <button className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest shadow-lg shadow-orange-500/20 transition-all">
                        <Mail size={14} /> Send to Supplier
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Supplier Info */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-slate-400 font-black text-xs uppercase tracking-widest border-b border-slate-800 pb-2">
                        <User size={14} className="text-orange-500" /> Supplier Details
                      </div>
                      <div className="bg-slate-900/20 p-5 rounded-xl border border-slate-800/50 space-y-3">
                        <div>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Company Name</p>
                          <p className="text-white font-bold">{po.supplier_name}</p>
                        </div>
                        {po.supplier_contact && (
                          <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Contact Person</p>
                            <p className="text-slate-300">{po.supplier_contact}</p>
                          </div>
                        )}
                        {po.supplier_email && (
                          <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Email Address</p>
                            <p className="text-slate-300 font-mono text-xs">{po.supplier_email}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* PO Meta */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-slate-400 font-black text-xs uppercase tracking-widest border-b border-slate-800 pb-2">
                        <Calendar size={14} className="text-blue-500" /> Order Timeline
                      </div>
                      <div className="bg-slate-900/20 p-5 rounded-xl border border-slate-800/50 space-y-3">
                        <div className="flex justify-between items-center">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Date Raised</p>
                          <p className="text-white font-bold">{format(new Date(po.date_raised), 'dd MMM yyyy')}</p>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Expected Delivery</p>
                          <p className="text-white font-bold">
                            {po.delivery_date ? format(new Date(po.delivery_date), 'dd MMM yyyy') : 'NOT SPECIFIED'}
                          </p>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Linked Records</p>
                          <div className="flex gap-2">
                            {po.linked_quote_id && <span className="bg-purple-500/10 text-purple-500 px-2 py-0.5 rounded text-[8px] font-black uppercase">Quote</span>}
                            {po.linked_invoice_id && <span className="bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded text-[8px] font-black uppercase">Invoice</span>}
                            {!po.linked_quote_id && !po.linked_invoice_id && <span className="text-slate-600 text-[10px] italic">None</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Line Items */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-slate-400 font-black text-xs uppercase tracking-widest border-b border-slate-800 pb-2">
                      <FileText size={14} className="text-emerald-500" /> Purchase Items
                    </div>
                    <div className="bg-slate-900/20 rounded-xl border border-slate-800/50 overflow-hidden">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-slate-800/30 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800">
                            <th className="px-6 py-4">Description</th>
                            <th className="px-6 py-4 text-center">Qty</th>
                            <th className="px-6 py-4 text-right">Unit Price</th>
                            <th className="px-6 py-4 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/30">
                          {po.purchase_order_items?.map((item: any) => (
                            <tr key={item.id}>
                              <td className="px-6 py-4 text-slate-200 text-sm font-medium">{item.description}</td>
                              <td className="px-6 py-4 text-center text-slate-400 text-sm font-mono">{item.quantity}</td>
                              <td className="px-6 py-4 text-right text-slate-400 text-sm font-mono">{formatCurrency(item.unit_price)}</td>
                              <td className="px-6 py-4 text-right text-white font-bold font-mono">{formatCurrency(item.line_total)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-slate-900/40 border-t border-slate-800">
                            <td colSpan={3} className="px-6 py-4 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">Subtotal (Excl. VAT)</td>
                            <td className="px-6 py-4 text-right text-white font-bold">{formatCurrency(po.subtotal)}</td>
                          </tr>
                          <tr className="bg-slate-900/40">
                            <td colSpan={3} className="px-6 py-4 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">VAT (15%)</td>
                            <td className="px-6 py-4 text-right text-slate-400 font-bold">{formatCurrency(po.vat_amount)}</td>
                          </tr>
                          <tr className="bg-slate-900/60 font-black">
                            <td colSpan={3} className="px-6 py-4 text-right text-orange-500 text-xs uppercase tracking-widest">Grand Total</td>
                            <td className="px-6 py-4 text-right text-white text-lg">{formatCurrency(po.total)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  {po.notes && (
                    <div className="space-y-3">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <AlertCircle size={12} /> Notes / Instructions
                      </p>
                      <div className="p-4 bg-slate-900/40 border border-slate-800/50 rounded-xl text-slate-400 text-sm italic leading-relaxed">
                        {po.notes}
                      </div>
                    </div>
                  )}

                  {/* Danger Zone */}
                  <div className="pt-8 border-t border-slate-800">
                    <button 
                      onClick={onDelete}
                      className="flex items-center gap-2 text-rose-500 hover:text-rose-400 font-black text-[10px] uppercase tracking-widest transition-colors"
                    >
                      <Trash2 size={14} /> Delete Purchase Order
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 bg-slate-800 flex flex-col">
                  <div className="bg-slate-900 p-3 flex items-center justify-between border-b border-slate-800">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <Eye size={12} /> Live PDF Preview
                    </span>
                    <PDFDownloadLink
                      document={<PurchaseOrderPDF po={po} />}
                      fileName={`${po.po_number}.pdf`}
                      className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                      {({ loading }) => (
                        <>
                          <Download size={12} /> {loading ? 'PREPARING...' : 'DOWNLOAD PDF'}
                        </>
                      )}
                    </PDFDownloadLink>
                  </div>
                  <div className="flex-1 bg-slate-700">
                    <PDFViewer width="100%" height="100%" className="border-none">
                      <PurchaseOrderPDF po={po} />
                    </PDFViewer>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
