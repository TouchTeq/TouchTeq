'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Settings, 
  Info, 
  AlertCircle,
  CheckCircle2,
  Loader2,
  FileText,
  Car,
  Fuel,
  Plus,
  Trash2,
  Edit2,
  X,
  Star,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { createClient } from '@/lib/supabase/client';
import { useOfficeToast } from '@/components/office/OfficeToastContext';

interface Vehicle {
  id?: string;
  vehicle_description: string;
  registration_number: string;
  opening_odometer: number;
  fuel_type: 'Petrol' | 'Diesel' | 'Electric' | 'Hybrid';
  is_default: boolean;
  is_active: boolean;
}

interface TravelSettings {
  fuel_price_per_litre: number;
}

export default function TravelSettingsTab({ profile }: { profile: any }) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [settings, setSettings] = useState<TravelSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [fuelTypeOpen, setFuelTypeOpen] = useState(false);
  const supabase = useMemo(() => createClient(), []);
  const toast = useOfficeToast();

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(val).replace('ZAR', 'R');
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [vehiclesRes, settingsRes] = await Promise.all([
        supabase.from('vehicles').select('*').order('is_default', { ascending: false }).order('vehicle_description'),
        supabase.from('travel_settings').select('fuel_price_per_litre').limit(1).single()
      ]);

      if (vehiclesRes.data) setVehicles(vehiclesRes.data);
      if (settingsRes.data) setSettings(settingsRes.data);
      else setSettings({ fuel_price_per_litre: 22.50 });
    } catch (err) {
      console.error('Failed to load data:', err);
      toast.error({ title: 'Error', message: 'Could not load travel settings' });
    } finally {
      setLoading(false);
    }
  }, [supabase, toast]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleSaveSettings = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await supabase.from('travel_settings').upsert({ fuel_price_per_litre: settings.fuel_price_per_litre });
      toast.success({ title: 'Saved', message: 'Settings updated.' });
    } catch (err) {
      toast.error({ title: 'Error', message: 'Could not save settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveVehicle = async () => {
    if (!editingVehicle) return;
    setSaving(true);
    try {
      if (editingVehicle.id) {
        await supabase.from('vehicles').update(editingVehicle).eq('id', editingVehicle.id);
      } else {
        await supabase.from('vehicles').insert(editingVehicle);
      }
      toast.success({ title: 'Saved', message: `Vehicle ${editingVehicle.id ? 'updated' : 'added'}.` });
      setShowModal(false);
      setEditingVehicle(null);
      void loadData();
    } catch (err: any) {
      toast.error({ title: 'Error', message: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteVehicle = async (id: string) => {
    if (!confirm('Delete this vehicle? Historical trips will remain but this vehicle cannot be recovered.')) return;
    try {
      await supabase.from('vehicles').delete().eq('id', id);
      toast.success({ title: 'Deleted', message: 'Vehicle removed.' });
      void loadData();
    } catch (err) {
      toast.error({ title: 'Error', message: 'Could not delete vehicle' });
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await supabase.from('vehicles').update({ is_default: true }).eq('id', id);
      toast.success({ title: 'Default Set', message: 'This vehicle is now the default.' });
      void loadData();
    } catch (err) {
      toast.error({ title: 'Error', message: 'Could not set default vehicle' });
    }
  };

  const handleToggleActive = async (vehicle: Vehicle) => {
    try {
      await supabase.from('vehicles').update({ is_active: !vehicle.is_active }).eq('id', vehicle.id);
      void loadData();
    } catch (err) {
      toast.error({ title: 'Error', message: 'Could not update vehicle' });
    }
  };

  const openAddVehicle = () => {
    setEditingVehicle({
      vehicle_description: '',
      registration_number: '',
      opening_odometer: 0,
      fuel_type: 'Diesel',
      is_default: vehicles.length === 0,
      is_active: true
    });
    setShowModal(true);
  };

  const openEditVehicle = (v: Vehicle) => {
    setEditingVehicle({ ...v });
    setShowModal(true);
  };

  if (loading) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-center h-64"
      >
        <Loader2 className="animate-spin text-orange-500" size={32} />
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-10"
    >
      {/* Vehicles Section */}
      <section className="bg-[#0B0F19] rounded-2xl border border-slate-800/50 p-8 shadow-xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-slate-500/10 rounded-lg flex items-center justify-center text-slate-400">
              <Car size={20} />
            </div>
            <div>
              <h3 className="text-xl font-black text-white uppercase tracking-tight">Vehicles</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                Manage your fleet for travel logbook
              </p>
            </div>
          </div>
          <button 
            onClick={openAddVehicle}
            className="bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded-sm font-black text-xs uppercase tracking-widest text-white transition-all flex items-center gap-2"
          >
            <Plus size={14} /> Add Vehicle
          </button>
        </div>

        <div className="space-y-3">
          {vehicles.filter(v => v.is_active).map(vehicle => (
            <div 
              key={vehicle.id}
              className={`p-4 bg-slate-900/50 border rounded-xl flex items-center justify-between ${
                vehicle.is_default ? 'border-orange-500/50' : 'border-slate-800'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  vehicle.is_default ? 'bg-orange-500/20 text-orange-500' : 'bg-slate-800 text-slate-400'
                }`}>
                  <Car size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-black text-white text-sm">{vehicle.vehicle_description}</p>
                    {vehicle.is_default && (
                      <span className="text-[8px] font-black uppercase bg-orange-500/20 text-orange-500 px-2 py-0.5 rounded">Default</span>
                    )}
                  </div>
                  <p className="text-slate-500 text-[10px] font-bold">
                    {vehicle.registration_number} • {vehicle.fuel_type} • {vehicle.opening_odometer.toLocaleString()} km
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!vehicle.is_default && (
                  <button 
                    onClick={() => void handleSetDefault(vehicle.id!)}
                    className="p-2 text-slate-500 hover:text-orange-500 transition-colors"
                    title="Set as default"
                  >
                    <Star size={16} />
                  </button>
                )}
                <button 
                  onClick={() => openEditVehicle(vehicle)}
                  className="p-2 text-slate-500 hover:text-white transition-colors"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={() => void handleDeleteVehicle(vehicle.id!)}
                  className="p-2 text-slate-500 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}

          {vehicles.filter(v => v.is_active).length === 0 && (
            <div className="text-center py-8 text-slate-500">
              <Car size={32} className="mx-auto mb-3 opacity-50" />
              <p className="text-sm font-bold">No vehicles added yet</p>
            </div>
          )}

          {vehicles.filter(v => !v.is_active).length > 0 && (
            <>
              <div className="border-t border-slate-800 my-4" />
              <p className="text-[10px] text-slate-600 font-bold uppercase mb-2">Inactive Vehicles</p>
              {vehicles.filter(v => !v.is_active).map(vehicle => (
                <div 
                  key={vehicle.id}
                  className="p-4 bg-slate-900/20 border border-slate-800/50 rounded-xl flex items-center justify-between opacity-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-slate-800 text-slate-500 flex items-center justify-center">
                      <Car size={18} />
                    </div>
                    <div>
                      <p className="font-black text-slate-400 text-sm">{vehicle.vehicle_description}</p>
                      <p className="text-slate-600 text-[10px] font-bold">{vehicle.registration_number}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => void handleToggleActive(vehicle)}
                    className="text-slate-500 hover:text-green-500 text-xs font-bold uppercase"
                  >
                    Reactivate
                  </button>
                </div>
              ))}
            </>
          )}
        </div>
      </section>

      {/* Fuel Settings Section */}
      <section className="bg-[#0B0F19] rounded-2xl border border-slate-800/50 p-8 shadow-xl">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-10 h-10 bg-slate-500/10 rounded-lg flex items-center justify-center text-slate-400">
            <Fuel size={20} />
          </div>
          <div>
            <h3 className="text-xl font-black text-white uppercase tracking-tight">Fuel Price</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
              Average fuel price for cost estimates
            </p>
          </div>
        </div>

        <div className="flex items-end gap-4">
          <div className="flex-1 max-w-[200px]">
            <label className="block text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">
              Price per Litre
            </label>
            <div className="flex items-center gap-2">
              <input 
                type="number"
                value={settings?.fuel_price_per_litre || 22.50}
                onChange={(e) => setSettings(prev => prev ? ({ ...prev, fuel_price_per_litre: parseFloat(e.target.value) || 22.50 }) : null)}
                className="w-[150px] bg-[#0B0F19] border border-slate-700 rounded-lg px-3 py-2 text-white font-bold text-sm focus:border-orange-500 outline-none"
                step="0.01"
                min="0"
              />
              <span className="text-slate-500 text-[10px] font-bold">R</span>
            </div>
          </div>
          <button 
            onClick={() => void handleSaveSettings()}
            disabled={saving}
            className="bg-orange-500 hover:bg-orange-600 px-6 py-2 rounded-sm font-black text-xs uppercase tracking-widest text-white transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
            Save
          </button>
        </div>
      </section>

      {/* Notes */}
      <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-800">
        <p className="text-[10px] text-slate-500 font-bold uppercase mb-2">Notes</p>
        <p className="text-slate-400 text-sm">
          • The default vehicle pre-selects in the trip log form<br />
          • Vehicles can be marked inactive but never deleted to preserve historical records<br />
          • SARS logbook exports include vehicle registration number<br />
          • Odometer continuity checks are scoped per vehicle
        </p>
      </div>

      {/* Add/Edit Vehicle Modal */}
      <AnimatePresence>
        {showModal && editingVehicle && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[210] flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => { setShowModal(false); setEditingVehicle(null); }} />
            
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="bg-[#151B28] border border-slate-800 w-full max-w-lg rounded-2xl overflow-hidden relative z-10"
            >
              <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                <h3 className="text-white font-black uppercase tracking-widest text-sm">
                  {editingVehicle.id ? 'Edit Vehicle' : 'Add Vehicle'}
                </h3>
                <button onClick={() => { setShowModal(false); setEditingVehicle(null); }} className="text-slate-500 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Vehicle Description</label>
                  <input 
                    type="text"
                    value={editingVehicle.vehicle_description}
                    onChange={(e) => setEditingVehicle(prev => prev ? ({ ...prev, vehicle_description: e.target.value }) : null)}
                    className="w-full bg-[#0B0F19] border border-slate-700 rounded-lg px-4 py-3 text-white font-bold text-sm focus:border-orange-500 outline-none"
                    placeholder="e.g. Toyota Hilux 2.4 GD-6"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Registration Number</label>
                  <input 
                    type="text"
                    value={editingVehicle.registration_number}
                    onChange={(e) => setEditingVehicle(prev => prev ? ({ ...prev, registration_number: e.target.value.toUpperCase() }) : null)}
                    className="w-full bg-[#0B0F19] border border-slate-700 rounded-lg px-4 py-3 text-white font-bold text-sm focus:border-orange-500 outline-none"
                    placeholder="e.g. ABC 123 GP"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Opening Odometer (km)</label>
                    <input 
                      type="number"
                      value={editingVehicle.opening_odometer}
                      onChange={(e) => setEditingVehicle(prev => prev ? ({ ...prev, opening_odometer: parseInt(e.target.value) || 0 }) : null)}
                      className="w-full bg-[#0B0F19] border border-slate-700 rounded-lg px-4 py-3 text-white font-bold text-sm focus:border-orange-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Fuel Type</label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setFuelTypeOpen(!fuelTypeOpen)}
                        className={`w-full flex items-center justify-between px-4 py-3 border rounded-lg transition-all font-bold text-sm bg-[#0B0F19] ${
                          fuelTypeOpen ? 'border-orange-500' : 'border-slate-700 hover:border-slate-600'
                        }`}
                      >
                        <span className="text-white">{editingVehicle?.fuel_type || 'Select Fuel Type'}</span>
                        <ChevronDown size={14} className={`text-slate-500 transition-transform ${fuelTypeOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {fuelTypeOpen && (
                        <div className="absolute top-full left-0 w-full mt-2 bg-[#0B0F19] border border-slate-700 rounded-lg shadow-xl z-50">
                          {(['Diesel', 'Petrol', 'Electric', 'Hybrid'] as const).map((type) => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => {
                                setEditingVehicle(prev => prev ? ({ ...prev, fuel_type: type }) : null);
                                setFuelTypeOpen(false);
                              }}
                              className={`w-full px-4 py-2.5 text-left hover:bg-[#151B28] transition-colors font-medium text-sm ${
                                editingVehicle?.fuel_type === type ? 'text-orange-500' : 'text-slate-300'
                              }`}
                            >
                              {type}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={editingVehicle.is_default}
                    onChange={(e) => setEditingVehicle(prev => prev ? ({ ...prev, is_default: e.target.checked }) : null)}
                    className="w-4 h-4 accent-orange-500"
                  />
                  <span className="text-white text-sm font-bold">Set as default vehicle</span>
                </label>
              </div>

              <div className="p-6 border-t border-slate-800 flex justify-end gap-4">
                <button 
                  onClick={() => { setShowModal(false); setEditingVehicle(null); }}
                  className="px-6 py-3 text-slate-400 font-black uppercase text-xs hover:text-white"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => void handleSaveVehicle()}
                  disabled={saving || !editingVehicle.vehicle_description || !editingVehicle.registration_number}
                  className="bg-orange-500 hover:bg-orange-600 px-8 py-3 rounded-sm font-black text-xs uppercase tracking-widest text-white transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                  Save Vehicle
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
