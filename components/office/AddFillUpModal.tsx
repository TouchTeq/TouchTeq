'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Save, 
  Loader2, 
  AlertTriangle, 
  Fuel, 
  Paperclip, 
  File, 
  Trash2,
  AlertCircle
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useOfficeToast } from '@/components/office/OfficeToastContext';
import { DatePicker } from '@/components/ui/DatePicker';
import { createFuelLog } from '@/lib/fuel/actions';
import { type Vehicle } from '@/lib/office/vehicles';
import { format } from 'date-fns';

interface AddFillUpModalProps {
  vehicles: Vehicle[];
  onClose: () => void;
  onSuccess: () => void;
  lastOdom?: number;
}

export default function AddFillUpModal({ vehicles, onClose, onSuccess, lastOdom }: AddFillUpModalProps) {
  const toast = useOfficeToast();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [saving, setSaving] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptUploading, setReceiptUploading] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    supplier_name: '',
    fuel_type: 'Diesel',
    litres: 0,
    price_per_litre: 0,
    total_amount: 0,
    odometer: 0,
    vehicle_id: vehicles.find(v => v.is_default)?.id || vehicles[0]?.id || '',
    payment_method: 'Card',
    receipt_url: ''
  });

  // Load last price and odometer for vehicle
  useEffect(() => {
    async function loadLatestData() {
      if (!formData.vehicle_id) return;
      
      const { data: latestLog } = await supabase
        .from('fuel_logs')
        .select('price_per_litre, odometer')
        .eq('vehicle_id', formData.vehicle_id)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (latestLog) {
        setFormData(prev => ({ 
          ...prev, 
          price_per_litre: Number(latestLog.price_per_litre),
          odometer: latestLog.odometer // Default to latest as base? instructions say price_per_litre is auto-filled
        }));
      }
    }
    loadLatestData();
  }, [formData.vehicle_id, supabase]);

  const handlePriceOrLitresChange = (field: 'litres' | 'price_per_litre', value: number) => {
    const newData = { ...formData, [field]: value };
    newData.total_amount = Number((newData.litres * newData.price_per_litre).toFixed(2));
    setFormData(newData);
    validate(newData);
  };

  const handleTotalChange = (value: number) => {
    const newData = { ...formData, total_amount: value };
    const expectedTotal = Number((newData.litres * newData.price_per_litre).toFixed(2));
    
    if (Math.abs(expectedTotal - value) > 0.1 && newData.litres > 0 && newData.price_per_litre > 0) {
      // Auto-correct and notify as per requirement
      // Well, correction could be either price or litres. Instructions say "Total amount doesn't match... auto-correct".
      // This implies we should set it back to litres * price.
      toast.warning({ 
        title: 'Auto-Correction', 
        message: 'Total amount was auto-corrected to match Litres × Price.' 
      });
      newData.total_amount = expectedTotal;
    }
    setFormData(newData);
    validate(newData);
  };

  const validate = (data: typeof formData) => {
    const newWarnings: string[] = [];
    let newError: string | null = null;

    // 1. Litres over 120
    if (data.litres > 120) newWarnings.push('Litres entered over 120 (unusually large fill-up).');
    
    // 2. Price per litre
    if (data.price_per_litre < 10 || data.price_per_litre > 100) {
      newWarnings.push(`Price per litre (R${data.price_per_litre}) is outside typical R10-R100 range.`);
    }

    // 3. Future date
    if (new Date(data.date) > new Date()) newWarnings.push('Date is in the future.');

    // 4. Odometer
    if (lastOdom && data.odometer < lastOdom) {
      newError = `Odometer (${data.odometer}km) cannot be lower than previous fill-up (${lastOdom}km).`;
    }

    // 5. Consumption (needs previous log)
    // This will be checked more accurately on the summary page, but can we check between this and lastOdom?
    if (lastOdom && data.odometer > lastOdom && data.litres > 0) {
      const dist = data.odometer - lastOdom;
      const cons = (data.litres / dist) * 100;
      if (cons < 4) newWarnings.push(`Unusually high efficiency detected (${cons.toFixed(1)} L/100km).`);
      if (cons > 25) newWarnings.push(`Unusually low efficiency detected (${cons.toFixed(1)} L/100km).`);
    }

    setWarnings(newWarnings);
    setError(newError);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setReceiptFile(file);
    setReceiptUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${formData.vehicle_id}/${formData.date}/${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `fuel-receipts/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('fuel-receipts')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      setFormData(prev => ({ ...prev, receipt_url: fileName }));
      toast.success({ title: 'Receipt Uploaded', message: 'Fuel receipt has been attached.' });
    } catch (err: any) {
      toast.error({ title: 'Upload Failed', message: err.message });
      setReceiptFile(null);
    } finally {
      setReceiptUploading(false);
    }
  };

  const handleSave = async () => {
    if (error) {
      toast.error({ title: 'Validation Error', message: error });
      return;
    }

    if (formData.total_amount <= 0 || formData.odometer <= 0 || !formData.supplier_name) {
      toast.error({ title: 'Incomplete Data', message: 'Please fill in all required fields.' });
      return;
    }

    setSaving(true);
    try {
      const vehicleName = vehicles.find(v => v.id === formData.vehicle_id)?.vehicle_description || 'Unknown';
      await createFuelLog({ ...formData, vehicle_name: vehicleName });
      toast.success({ 
        title: 'Fuel Logged', 
        message: `Fuel purchase at ${formData.supplier_name} recorded and added to expenses.` 
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error({ title: 'Error', message: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-[#151B28] border border-slate-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-[#0B0F19]/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500">
              <Fuel size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-tight">Log Fuel Purchase</h2>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Manual entry for expense and VAT tracking</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all">
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex gap-3 text-red-500 animate-in fade-in slide-in-from-top-2">
              <AlertCircle size={18} className="shrink-0" />
              <p className="text-xs font-bold uppercase tracking-wider">{error}</p>
            </div>
          )}

          {warnings.length > 0 && !error && (
            <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg space-y-2 animate-in fade-in slide-in-from-top-2">
              {warnings.map((w, i) => (
                <div key={i} className="flex gap-3 text-orange-500">
                  <AlertTriangle size={18} className="shrink-0" />
                  <p className="text-xs font-bold uppercase tracking-wider">{w}</p>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <DatePicker 
                label="Date"
                value={formData.date}
                onChange={(val) => {
                  const next = { ...formData, date: val };
                  setFormData(next);
                  validate(next);
                }}
              />

              <div>
                <label className="text-slate-500 text-[9px] font-black uppercase tracking-widest mb-1.5 block px-1">Fuel Station / Supplier</label>
                <input 
                  type="text"
                  placeholder="e.g. Engen Midrand"
                  value={formData.supplier_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, supplier_name: e.target.value }))}
                  className="w-full bg-[#0B0F19] border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500/50 transition-colors font-bold"
                />
              </div>

              <div>
                <label className="text-slate-500 text-[9px] font-black uppercase tracking-widest mb-1.5 block px-1">Fuel Type</label>
                <select 
                  value={formData.fuel_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, fuel_type: e.target.value }))}
                  className="w-full bg-[#0B0F19] border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500/50 transition-colors font-bold appearance-none cursor-pointer"
                >
                  <option value="Diesel">Diesel</option>
                  <option value="Petrol 95">Petrol 95</option>
                  <option value="Petrol 93">Petrol 93</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-500 text-[9px] font-black uppercase tracking-widest mb-1.5 block px-1">Litres</label>
                  <input 
                    type="number"
                    step="0.01"
                    value={formData.litres || ''}
                    onChange={(e) => handlePriceOrLitresChange('litres', parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#0B0F19] border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500/50 transition-colors font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-500 text-[9px] font-black uppercase tracking-widest mb-1.5 block px-1">Price / L</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">R</span>
                    <input 
                      type="number"
                      step="0.01"
                      value={formData.price_per_litre || ''}
                      onChange={(e) => handlePriceOrLitresChange('price_per_litre', parseFloat(e.target.value) || 0)}
                      className="w-full bg-[#0B0F19] border border-slate-800 rounded-lg pl-8 pr-4 py-3 text-white focus:outline-none focus:border-orange-500/50 transition-colors font-bold"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-slate-500 text-[9px] font-black uppercase tracking-widest mb-1.5 block px-1">Total Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500 font-black text-sm">R</span>
                  <input 
                    type="number"
                    step="0.01"
                    value={formData.total_amount || ''}
                    onChange={(e) => handleTotalChange(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#0B0F19]/50 border border-orange-500/30 rounded-lg pl-8 pr-4 py-3 text-orange-500 focus:outline-none focus:border-orange-500 transition-colors font-black text-lg"
                  />
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div>
                <label className="text-slate-500 text-[9px] font-black uppercase tracking-widest mb-1.5 block px-1">Vehicle</label>
                <select 
                  value={formData.vehicle_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, vehicle_id: e.target.value }))}
                  className="w-full bg-[#0B0F19] border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500/50 transition-colors font-bold appearance-none cursor-pointer"
                >
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.vehicle_description} ({v.registration_number})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-500 text-[9px] font-black uppercase tracking-widest mb-1.5 block px-1">Odometer (km)</label>
                <input 
                  type="number"
                  placeholder={lastOdom ? `Last: ${lastOdom}km` : 'Current reading'}
                  value={formData.odometer || ''}
                  onChange={(e) => {
                    const next = { ...formData, odometer: parseInt(e.target.value) || 0 };
                    setFormData(next);
                    validate(next);
                  }}
                  className={`w-full bg-[#0B0F19] border rounded-lg px-4 py-3 text-white focus:outline-none transition-colors font-bold ${error ? 'border-red-500/50' : 'border-slate-800 focus:border-orange-500/50'}`}
                />
              </div>

              <div>
                <label className="text-slate-500 text-[9px] font-black uppercase tracking-widest mb-1.5 block px-1">Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Card', 'Cash', 'Company Account'].map(method => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, payment_method: method }))}
                      className={`py-2 text-[8px] font-black uppercase tracking-widest border rounded transition-all ${formData.payment_method === method ? 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/20' : 'bg-[#0B0F19] border-slate-800 text-slate-500 hover:text-white hover:border-slate-700'}`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-slate-500 text-[9px] font-black uppercase tracking-widest mb-1.5 block px-1">Receipt Attachment</label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`group relative border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${formData.receipt_url ? 'bg-green-500/5 border-green-500/30' : 'bg-[#0B0F19] border-slate-800 hover:border-slate-700 hover:bg-slate-800/20'}`}
                >
                  <input 
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    accept="image/*,.pdf"
                  />
                  
                  {receiptUploading ? (
                    <Loader2 className="animate-spin text-orange-500" size={20} />
                  ) : formData.receipt_url ? (
                    <>
                      <File className="text-green-500" size={20} />
                      <span className="text-[10px] font-black text-green-500 uppercase">Receipt Attached</span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setFormData(prev => ({ ...prev, receipt_url: '' }));
                          setReceiptFile(null);
                        }}
                        className="absolute top-2 right-2 p-1.5 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-md"
                      >
                        <Trash2 size={12} />
                      </button>
                    </>
                  ) : (
                    <>
                      <Paperclip className="text-slate-600 group-hover:text-slate-400" size={20} />
                      <span className="text-[10px] font-black text-slate-500 group-hover:text-slate-400 uppercase">Upload Receipt</span>
                      <span className="text-[8px] text-slate-700 uppercase">JPG, PNG or PDF (Max 5MB)</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-5 border-t border-slate-800 bg-[#0B0F19]/50 flex items-center justify-between">
          <div className="flex flex-col">
            {formData.litres > 0 && formData.price_per_litre > 0 && (
              <>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">VAT (15%)</p>
                <p className="text-sm font-black text-white">R{((formData.total_amount * 15) / 115).toFixed(2)}</p>
              </>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={saving}
              className="px-6 py-3 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !!error}
              className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center gap-2 shadow-lg shadow-orange-500/20"
            >
              {saving ? (
                <>
                  <Loader2 className="animate-spin" size={16} /> Saving...
                </>
              ) : (
                <>
                  <Save size={16} /> Confirm Log
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
