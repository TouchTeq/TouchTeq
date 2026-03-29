'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Fuel, 
  Car, 
  Calendar, 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  Eye, 
  Paperclip,
  TrendingUp,
  AlertTriangle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Info
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, parseISO, subMonths, isWithinInterval, startOfYear, endOfYear } from 'date-fns';
import { createClient } from '@/lib/supabase/client';
import { useOfficeToast } from '@/components/office/OfficeToastContext';
import { getFuelLogs, deleteFuelLog, type FuelLogEntry, getSignedFuelReceiptUrl } from '@/lib/fuel/actions';
import { getVehicles, type Vehicle } from '@/lib/office/vehicles';
import AddFillUpModal from '@/components/office/AddFillUpModal';
import { DeleteConfirmationModal, type DeletableItem } from '@/components/office/DeleteConfirmationModal';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  Cell,
  Legend
} from 'recharts';

export default function FuelTrackerPage() {
  const supabase = createClient();
  const toast = useOfficeToast();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'log' | 'summary'>('log');
  const [logs, setLogs] = useState<FuelLogEntry[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [fuelToDelete, setFuelToDelete] = useState<DeletableItem | null>(null);

  // Filters
  const [monthFilter, setMonthFilter] = useState(format(new Date(), 'yyyy-MM'));
  const [vehicleFilter, setVehicleFilter] = useState('all');
  const [fuelTypeFilter, setFuelTypeFilter] = useState('all');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [fLogs, vData] = await Promise.all([
        getFuelLogs(),
        getVehicles()
      ]);
      setLogs(fLogs);
      setVehicles(vData);
    } catch (err: any) {
      toast.error({ title: 'Fetch Error', message: err.message });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const logMonth = log.date.substring(0, 7);
      const matchesMonth = logMonth === monthFilter;
      const matchesVehicle = vehicleFilter === 'all' || log.vehicle_id === vehicleFilter;
      const matchesFuel = fuelTypeFilter === 'all' || log.fuel_type === fuelTypeFilter;
      return matchesMonth && matchesVehicle && matchesFuel;
    });
  }, [logs, monthFilter, vehicleFilter, fuelTypeFilter]);

  const totals = useMemo(() => {
    const lits = filteredLogs.reduce((sum, l) => sum + Number(l.litres), 0);
    const spend = filteredLogs.reduce((sum, l) => sum + Number(l.total_amount), 0);
    const vat = (spend * 15) / 115;
    return { lits, spend, vat };
  }, [filteredLogs]);

  const handleDelete = async (id: string) => {
    const log = logs.find(l => l.id === id);
    setFuelToDelete({
      id: String(id),
      name: log ? `${log.date} - ${vehicles.find(v => v.id === log.vehicle_id)?.registration_number || 'Unknown'}` : 'Fuel Log',
      hasLinkedRecords: true
    });
    setDeleteModalOpen(true);
  };

  const confirmDeleteFuel = async () => {
    if (!fuelToDelete) return;
    
    try {
      await deleteFuelLog(fuelToDelete.id);
      toast.success({ title: 'Deleted', message: 'Fuel log and linked data removed.' });
      fetchData();
      setDeleteModalOpen(false);
      setFuelToDelete(null);
    } catch (err: any) {
      toast.error({ title: 'Delete Failed', message: err.message });
    }
  };

  const handleOpenReceipt = async (path: string) => {
    const url = await getSignedFuelReceiptUrl(path);
    if (url) window.open(url, '_blank');
  };

  // Efficiency Tracking
  const efficiencyData = useMemo(() => {
    // For each vehicle, calculate L/100km between fill-ups
    const perVehicle: Record<string, { date: string; cons: number }[]> = {};
    
    // Sort logs by date ascending to calc between pairs
    const sortedLogs = [...logs].sort((a, b) => a.date.localeCompare(b.date));
    
    const lastLogs: Record<string, FuelLogEntry> = {};
    
    sortedLogs.forEach(log => {
      if (lastLogs[log.vehicle_id]) {
        const prev = lastLogs[log.vehicle_id];
        const dist = log.odometer - prev.odometer;
        if (dist > 0) {
          const cons = (log.litres / dist) * 100;
          if (!perVehicle[log.vehicle_id]) perVehicle[log.vehicle_id] = [];
          perVehicle[log.vehicle_id].push({ date: log.date, cons });
        }
      }
      lastLogs[log.vehicle_id] = log;
    });
    
    return perVehicle;
  }, [logs]);

  // Spend Summary Data
  const monthlySummary = useMemo(() => {
    const last12Months = Array.from({ length: 12 }, (_, i) => {
      const d = subMonths(new Date(), i);
      return format(d, 'yyyy-MM');
    }).reverse();

    return last12Months.map(m => {
      const monthLogs = logs.filter(l => l.date.startsWith(m));
      const spend = monthLogs.reduce((sum, l) => sum + Number(l.total_amount), 0);
      const lits = monthLogs.reduce((sum, l) => sum + Number(l.litres), 0);
      const avgPrice = lits > 0 ? spend / lits : 0;
      return { 
        month: format(parseISO(m + '-01'), 'MMM yy'),
        spend,
        lits,
        avgPrice: Number(avgPrice.toFixed(2)),
        vat: Number(((spend * 15) / 115).toFixed(2))
      };
    });
  }, [logs]);

  const taxYearVat = useMemo(() => {
    // RSA Tax Year: March to Feb
    const now = new Date();
    const currentYear = now.getFullYear();
    const start = now.getMonth() < 2 ? `${currentYear - 1}-03-01` : `${currentYear}-03-01`;
    const end = now.getMonth() < 2 ? `${currentYear}-02-28` : `${currentYear + 1}-02-28`;
    
    const yearLogs = logs.filter(l => l.date >= start && l.date <= end);
    const totalSpend = yearLogs.reduce((sum, l) => sum + Number(l.total_amount), 0);
    return (totalSpend * 15) / 115;
  }, [logs]);

  // Find last odometer for a vehicle to pass to modal
  const lastOdom = useMemo(() => {
    const vehicleLogs = logs.filter(l => l.vehicle_id === (vehicleFilter === 'all' ? undefined : vehicleFilter));
    if (vehicleLogs.length === 0) return 0;
    return Math.max(...vehicleLogs.map(l => l.odometer));
  }, [logs, vehicleFilter]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <Loader2 className="animate-spin text-orange-500" size={40} />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Loading Fleet Data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter flex items-center gap-4">
            <Fuel size={36} className="text-orange-500" />
            Fuel Tracker
          </h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1 pl-1">
            Track fleet efficiency, fuel expenses, and reclaim input VAT
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white font-black uppercase text-xs tracking-[0.2em] px-8 py-4 rounded-sm transition-all flex items-center gap-3 shadow-lg shadow-orange-500/20"
          >
            <Plus size={18} /> Add Fill-Up
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-[#151B28] p-1 rounded-lg border border-slate-800 w-fit">
        <button
          onClick={() => setActiveTab('log')}
          className={`px-6 py-3 rounded-md font-black text-xs uppercase tracking-widest transition-all ${
            activeTab === 'log' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Fuel Log
        </button>
        <button
          onClick={() => setActiveTab('summary')}
          className={`px-6 py-3 rounded-md font-black text-xs uppercase tracking-widest transition-all ${
            activeTab === 'summary' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Spend Summary
        </button>
      </div>

      {activeTab === 'log' ? (
        <>
          {/* Filters & Totals Row */}
          <div className="flex flex-wrap gap-4 items-center bg-[#151B28]/50 p-6 rounded-xl border border-slate-800/50">
            <div className="flex items-center gap-2 bg-[#0B0F19] border border-slate-800 rounded-lg px-4 py-2">
              <ChevronLeft 
                size={16} 
                className="text-slate-500 cursor-pointer hover:text-white"
                onClick={() => setMonthFilter(format(subMonths(parseISO(monthFilter + '-01'), 1), 'yyyy-MM'))}
              />
              <input 
                type="month" 
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                className="bg-transparent text-white font-black text-xs uppercase outline-none w-32 cursor-pointer"
              />
              <ChevronRight 
                size={16} 
                className="text-slate-500 cursor-pointer hover:text-white"
                onClick={() => setMonthFilter(format(subMonths(parseISO(monthFilter + '-01'), -1), 'yyyy-MM'))}
              />
            </div>

            <div className="relative group">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-hover:text-orange-500 transition-colors" size={14} />
              <select 
                value={vehicleFilter}
                onChange={(e) => setVehicleFilter(e.target.value)}
                className="bg-[#0B0F19] border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-white font-bold text-xs uppercase outline-none appearance-none min-w-[180px] cursor-pointer hover:border-slate-700 transition-colors"
              >
                <option value="all">All Vehicles</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.vehicle_description.split(' ')[0]} ({v.registration_number})</option>
                ))}
              </select>
            </div>

            <div className="relative group">
              <Fuel className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-hover:text-orange-500 transition-colors" size={14} />
              <select 
                value={fuelTypeFilter}
                onChange={(e) => setFuelTypeFilter(e.target.value)}
                className="bg-[#0B0F19] border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-white font-bold text-xs uppercase outline-none appearance-none min-w-[150px] cursor-pointer hover:border-slate-700 transition-colors"
              >
                <option value="all">Fuel Types</option>
                <option value="Diesel">Diesel</option>
                <option value="Petrol 95">Petrol 95</option>
                <option value="Petrol 93">Petrol 93</option>
              </select>
            </div>

            <div className="ml-auto flex gap-8 items-center">
              <div className="text-right">
                <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest mb-1">Litres</p>
                <p className="text-xl font-black text-white">{totals.lits.toFixed(2)}L</p>
              </div>
              <div className="text-right">
                <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest mb-1">Total Spend</p>
                <p className="text-xl font-black text-white">R{totals.spend.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-orange-500 text-[10px] font-black uppercase tracking-widest mb-1">Input VAT</p>
                <p className="text-xl font-black text-orange-500">R{totals.vat.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-[#151B28] border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-slate-500 text-[10px] uppercase font-black tracking-[0.2em] bg-[#0B0F19]/50 border-b border-slate-800">
                    <th className="px-6 py-5">Date</th>
                    <th className="px-6 py-5">Station</th>
                    <th className="px-6 py-5">Vehicle</th>
                    <th className="px-6 py-5">Fuel Type</th>
                    <th className="px-6 py-5">Litres</th>
                    <th className="px-6 py-5">Price/L</th>
                    <th className="px-6 py-5">Total (R)</th>
                    <th className="px-6 py-5">Odometer</th>
                    <th className="px-6 py-5 text-center">Receipt</th>
                    <th className="px-6 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/30">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-6 py-20 text-center">
                        <div className="max-w-xs mx-auto">
                          <Fuel size={40} className="mx-auto text-slate-700 mb-4" />
                          <p className="text-slate-500 font-bold uppercase text-sm">No fuel logs for this period</p>
                          <p className="text-slate-600 text-[10px] mt-2 font-bold uppercase tracking-widest">Add your first fill-up to start tracking</p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredLogs.map(log => (
                    <tr key={log.id} className="hover:bg-[#0B0F19]/50 transition-colors group">
                      <td className="px-6 py-5">
                        <p className="text-[10px] text-slate-500 font-bold uppercase">
                          {format(parseISO(log.date), 'dd MMM yyyy')}
                        </p>
                      </td>
                      <td className="px-6 py-5">
                        <p className="font-black text-white text-sm">{log.supplier_name}</p>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-[10px] font-black uppercase px-2 py-1 bg-white/5 text-slate-400 rounded">
                          {log.vehicles?.vehicle_description.split(' ')[0]}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-slate-400 font-bold text-xs uppercase">{log.fuel_type}</p>
                      </td>
                      <td className="px-6 py-5">
                        <p className="font-black text-white text-sm">{log.litres.toFixed(2)}L</p>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-slate-500 font-bold text-xs">R{Number(log.price_per_litre).toFixed(2)}</p>
                      </td>
                      <td className="px-6 py-5">
                        <p className="font-black text-orange-500 text-sm">R{Number(log.total_amount).toLocaleString()}</p>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-white text-xs">{log.odometer.toLocaleString()} km</p>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        {log.receipt_url ? (
                          <button 
                            onClick={() => handleOpenReceipt(log.receipt_url!)}
                            className="p-2 text-green-500 hover:bg-green-500/10 rounded-lg transition-all"
                            title="View Receipt"
                          >
                            <Paperclip size={16} />
                          </button>
                        ) : (
                          <div className="group/tip relative flex justify-center">
                            <AlertTriangle size={16} className="text-slate-800" />
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-red-500 text-white text-[8px] font-black uppercase tracking-widest rounded opacity-0 group-hover/tip:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-10">
                              Missing Receipt
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-5 text-right">
                        <button 
                          onClick={() => handleDelete(log.id)}
                          className="p-2 text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Spend Summary Tab */
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-[#151B28] border border-slate-800 p-6 rounded-xl flex flex-col justify-between">
              <div>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Monthly Litres</p>
                <div className="flex items-end gap-2">
                  <p className="text-4xl font-black text-white">{monthlySummary[11].lits.toFixed(0)}</p>
                  <span className="text-slate-500 font-bold text-sm mb-1.5 underline decoration-orange-500 decoration-2">L</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-800/50 flex items-center gap-2 text-[10px] font-bold">
                {monthlySummary[11].lits > monthlySummary[10].lits ? (
                  <ArrowUpRight size={14} className="text-red-500" />
                ) : (
                  <ArrowDownRight size={14} className="text-green-500" />
                )}
                <span className={monthlySummary[11].lits > monthlySummary[10].lits ? 'text-red-500' : 'text-green-500 uppercase tracking-widest'}>
                  {monthlySummary[10].lits > 0 ? Math.abs(((monthlySummary[11].lits - monthlySummary[10].lits) / monthlySummary[10].lits) * 100).toFixed(1) : 0}% vs Last Month
                </span>
              </div>
            </div>

            <div className="bg-[#151B28] border border-slate-800 p-6 rounded-xl flex flex-col justify-between">
              <div>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Avg Price / L</p>
                <div className="flex items-end gap-2">
                  <span className="text-slate-500 font-bold text-lg mb-1">R</span>
                  <p className="text-4xl font-black text-white">{monthlySummary[11].avgPrice}</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-800/50 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
                <Info size={14} className="text-slate-500" />
                <span className="text-slate-500">Regional Average: R22.50</span>
              </div>
            </div>

            <div className="bg-[#151B28] border border-slate-800 p-6 rounded-xl flex flex-col justify-between shadow-lg shadow-orange-500/5">
              <div>
                <p className="text-orange-500 text-[10px] font-black uppercase tracking-widest mb-1">Input VAT Claimable</p>
                <div className="flex items-end gap-2">
                  <span className="text-orange-500 font-bold text-lg mb-1">R</span>
                  <p className="text-4xl font-black text-orange-500">{monthlySummary[11].vat.toLocaleString()}</p>
                </div>
              </div>
              <p className="mt-4 pt-4 border-t border-slate-800/50 text-slate-600 text-[10px] font-black uppercase tracking-widest">
                Current Tax Year Total: R{taxYearVat.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </div>

            <div className="bg-[#151B28] border border-slate-800 p-6 rounded-xl flex flex-col justify-between">
              <div>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Active Vehicles</p>
                <p className="text-4xl font-black text-white">{vehicles.length}</p>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-800/50 flex items-center gap-2 text-[10px] font-bold">
                <Car size={14} className="text-slate-500" />
                <span className="text-slate-500 uppercase tracking-widest">Fleet Monitoring Active</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Monthly spend chart */}
            <div className="bg-[#151B28] border border-slate-800 p-8 rounded-2xl">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">Fuel Spend Trend</h3>
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Last 12 Monthly Totals</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Spend (R)</span>
                </div>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlySummary}>
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f97316" stopOpacity={1} />
                        <stop offset="100%" stopColor="#f97316" stopOpacity={0.4} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                    <XAxis 
                      dataKey="month" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                    />
                    <Tooltip 
                      cursor={{ fill: 'rgba(255, 105, 0, 0.05)' }}
                      contentStyle={{ 
                        backgroundColor: '#0B0F19', 
                        borderColor: '#1e293b', 
                        borderRadius: '12px',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
                      }}
                      itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase' }}
                      labelStyle={{ color: '#64748b', fontSize: '10px', fontWeight: 900, marginBottom: '4px', textTransform: 'uppercase' }}
                    />
                    <Bar dataKey="spend" radius={[4, 4, 0, 0]}>
                      {monthlySummary.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 11 ? '#f97316' : 'url(#barGradient)'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Efficiency trend */}
            <div className="bg-[#151B28] border border-slate-800 p-8 rounded-2xl">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">Fleet Efficiency</h3>
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Consumption Trend (L/100km)</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">L/100KM</span>
                </div>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                    <XAxis 
                      dataKey="date" 
                      type="category"
                      allowDuplicatedCategory={false}
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#0B0F19', 
                        borderColor: '#1e293b', 
                        borderRadius: '12px'
                      }}
                      itemStyle={{ fontSize: '12px', fontWeight: 900, textTransform: 'uppercase' }}
                    />
                    <Legend 
                      wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }}
                    />
                    {Object.entries(efficiencyData).map(([vId, data], index) => (
                      <Line 
                        key={vId}
                        type="monotone"
                        data={data}
                        dataKey="cons"
                        name={vehicles.find(v => v.id === vId)?.vehicle_description.split(' ')[0] || 'Unknown'}
                        stroke={index === 0 ? '#10b981' : index === 1 ? '#3b82f6' : '#f59e0b'}
                        strokeWidth={3}
                        dot={{ r: 4, strokeWidth: 2, fill: '#151B28' }}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <AddFillUpModal 
          vehicles={vehicles}
          lastOdom={lastOdom}
          onClose={() => setShowAddModal(false)}
          onSuccess={fetchData}
        />
      )}

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => { setDeleteModalOpen(false); setFuelToDelete(null); }}
        onConfirm={confirmDeleteFuel}
        items={fuelToDelete ? [fuelToDelete] : []}
        itemType="fuel"
      />
    </div>
  );
}
