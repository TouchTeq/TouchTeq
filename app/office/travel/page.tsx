'use client';

import { useState, useMemo, useEffect, useCallback, Suspense } from 'react';
import { 
  Plus, 
  Car, 
  MapPin, 
  Download,
  AlertTriangle,
  Trash2,
  Edit2,
  Fuel,
  Users,
  FileText,
  X,
  Save,
  Loader2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  FileSpreadsheet,
  File,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, startOfMonth, endOfMonth, parseISO, subMonths } from 'date-fns';
import { createClient } from '@/lib/supabase/client';
import { useOfficeToast } from '@/components/office/OfficeToastContext';
import { DatePicker } from '@/components/ui/DatePicker';
import { MonthPicker } from '@/components/ui/MonthPicker';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface Vehicle {
  id: string;
  vehicle_description: string;
  registration_number: string;
  opening_odometer: number;
  fuel_type: 'Petrol' | 'Diesel' | 'Electric' | 'Hybrid';
  is_default: boolean;
  is_active: boolean;
}

interface Trip {
  id: string;
  date: string;
  from_location: string;
  to_location: string;
  odometer_start: number;
  odometer_end: number;
  distance_km: number;
  purpose: string;
  vehicle_id: string;
  client_id: string | null;
  client_name?: string;
  vehicle_description?: string;
  notes?: string;
  created_at: string;
}

interface TripWithClient extends Trip {
  clients?: {
    company_name: string;
  } | null;
}

interface Client {
  id: string;
  company_name: string;
}

interface TravelSettings {
  fuel_price_per_litre: number;
}

export default function TravelLogbookPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-orange-500" size={32} />
      </div>
    }>
      <TravelLogbookContent />
    </Suspense>
  );
}

function TravelLogbookContent() {
  const supabase = useMemo(() => createClient(), []);
  const toast = useOfficeToast();
  
  const [trips, setTrips] = useState<Trip[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [settings, setSettings] = useState<TravelSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'trips' | 'summary'>('trips');
  const [monthFilter, setMonthFilter] = useState(format(new Date(), 'yyyy-MM'));
  const [clientFilter, setClientFilter] = useState('all');
  const [vehicleFilter, setVehicleFilter] = useState<string>('all');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [odometerWarning, setOdometerWarning] = useState<string | null>(null);
  const [vehicleFilterOpen, setVehicleFilterOpen] = useState(false);
  const [clientFilterOpen, setClientFilterOpen] = useState(false);
  const [exportVehicleFilterOpen, setExportVehicleFilterOpen] = useState(false);
  const [formVehicleOpen, setFormVehicleOpen] = useState(false);
  const [formClientOpen, setFormClientOpen] = useState(false);

  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    from_location: '',
    to_location: '',
    odometer_start: 0,
    odometer_end: 0,
    distance_km: 0,
    purpose: '',
    client_id: '',
    notes: '',
    manual_distance: false
  });

  const [saving, setSaving] = useState(false);

  const selectedVehicle = useMemo(() => 
    vehicles.find(v => v.id === selectedVehicleId),
    [vehicles, selectedVehicleId]
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [tripsRes, vehiclesRes, clientsRes, settingsRes] = await Promise.all([
      supabase.from('travel_trips').select('*, clients(company_name), vehicles(vehicle_description)').order('date', { ascending: false }),
      supabase.from('vehicles').select('*').order('is_default', { ascending: false }).order('vehicle_description'),
      supabase.from('clients').select('id, company_name').order('company_name'),
      supabase.from('travel_settings').select('fuel_price_per_litre').limit(1).single()
    ]);
    
    if (tripsRes.data) {
      setTrips(
        (tripsRes.data as (TripWithClient & { vehicles?: { vehicle_description: string } | null })[]).map((trip) => ({
          ...trip,
          client_name: trip.clients?.company_name,
          vehicle_description: trip.vehicles?.vehicle_description,
        }))
      );
    }
    if (vehiclesRes.data) {
      setVehicles(vehiclesRes.data);
      const defaultVehicle = vehiclesRes.data.find(v => v.is_default && v.is_active);
      if (defaultVehicle && !selectedVehicleId) {
        setSelectedVehicleId(defaultVehicle.id);
      }
    }
    if (clientsRes.data) setClients(clientsRes.data);
    if (settingsRes.data) setSettings(settingsRes.data);
    else setSettings({ fuel_price_per_litre: 22.50 });
    setLoading(false);
  }, [supabase, selectedVehicleId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredTrips = useMemo(() => {
    return trips.filter(trip => {
      const tripMonth = trip.date.substring(0, 7);
      const matchesMonth = tripMonth === monthFilter;
      const matchesClient = clientFilter === 'all' || trip.client_id === clientFilter;
      const matchesVehicle = vehicleFilter === 'all' || trip.vehicle_id === vehicleFilter;
      return matchesMonth && matchesClient && matchesVehicle;
    });
  }, [trips, monthFilter, clientFilter, vehicleFilter]);

  const totalKm = filteredTrips.reduce((sum, t) => sum + t.distance_km, 0);

  const lastTripForVehicle = useMemo(() => {
    if (!selectedVehicleId) return null;
    const vehicleTrips = trips
      .filter(t => t.vehicle_id === selectedVehicleId)
      .sort((a, b) => b.date.localeCompare(a.date));
    return vehicleTrips[0] || null;
  }, [trips, selectedVehicleId]);

  const calculateDistance = (start: number, end: number) => {
    return end > start ? end - start : 0;
  };

  const handleOdometerChange = (field: 'odometer_start' | 'odometer_end', value: number) => {
    const newData = { ...formData, [field]: value };
    
    if (!formData.manual_distance) {
      newData.distance_km = calculateDistance(
        field === 'odometer_start' ? value : formData.odometer_start,
        field === 'odometer_end' ? value : formData.odometer_end
      );
    }
    
    setFormData(newData);
    
    if (lastTripForVehicle && field === 'odometer_start') {
      const gap = value - lastTripForVehicle.odometer_end;
      if (gap < -50) {
        setOdometerWarning(`Odometer gap detected — last trip in ${selectedVehicle?.vehicle_description} ended at ${lastTripForVehicle.odometer_end}km, you started at ${value}km. Please verify your readings.`);
      } else if (gap > 500) {
        setOdometerWarning(`Large gap detected — last trip ended at ${lastTripForVehicle.odometer_end}km, you started at ${value}km. Please verify your readings.`);
      } else {
        setOdometerWarning(null);
      }
    }
  };

  const handleSubmit = async () => {
    if (!selectedVehicleId) {
      toast.error({ title: 'Error', message: 'Please select a vehicle' });
      return;
    }
    setSaving(true);
    try {
      const tripData = {
        date: formData.date,
        from_location: formData.from_location,
        to_location: formData.to_location,
        odometer_start: formData.odometer_start,
        odometer_end: formData.odometer_end,
        distance_km: formData.distance_km,
        purpose: formData.purpose,
        vehicle_id: selectedVehicleId,
        client_id: formData.client_id || null,
        notes: formData.notes
      };

      if (editingTrip) {
        const { error } = await supabase
          .from('travel_trips')
          .update(tripData)
          .eq('id', editingTrip.id);
        
        if (error) throw error;
        toast.success({ title: 'Trip Updated', message: 'Your trip has been updated.' });
      } else {
        const { error } = await supabase
          .from('travel_trips')
          .insert(tripData);
        
        if (error) throw error;
        toast.success({ title: 'Trip Logged', message: `${formData.distance_km}km trip has been recorded.` });
      }

      fetchData();
      resetForm();
    } catch (err: any) {
      toast.error({ title: 'Error', message: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this trip?')) return;
    
    const { error } = await supabase.from('travel_trips').delete().eq('id', id);
    if (error) {
      toast.error({ title: 'Error', message: error.message });
    } else {
      toast.success({ title: 'Deleted', message: 'Trip removed.' });
      fetchData();
    }
  };

  const openEdit = (trip: Trip) => {
    setEditingTrip(trip);
    setSelectedVehicleId(trip.vehicle_id);
    setFormData({
      date: trip.date,
      from_location: trip.from_location,
      to_location: trip.to_location,
      odometer_start: trip.odometer_start,
      odometer_end: trip.odometer_end,
      distance_km: trip.distance_km,
      purpose: trip.purpose,
      client_id: trip.client_id || '',
      notes: trip.notes || '',
      manual_distance: false
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingTrip(null);
    setOdometerWarning(null);
    const defaultVehicle = vehicles.find(v => v.is_default && v.is_active);
    setSelectedVehicleId(defaultVehicle?.id || vehicles[0]?.id || '');
    setFormData({
      date: format(new Date(), 'yyyy-MM-dd'),
      from_location: '',
      to_location: '',
      odometer_start: lastTripForVehicle?.odometer_end || defaultVehicle?.opening_odometer || 0,
      odometer_end: 0,
      distance_km: 0,
      purpose: '',
      client_id: '',
      notes: '',
      manual_distance: false
    });
  };

  const [exporting, setExporting] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportRange, setExportRange] = useState<'month' | 'quarter' | 'year'>('month');
  const [exportVehicleFilter, setExportVehicleFilter] = useState<string>('all');

  const getExportDateRange = () => {
    const anchorDate = parseISO(`${monthFilter}-01`);
    if (exportRange === 'month') {
      return {
        start: format(startOfMonth(anchorDate), 'yyyy-MM-dd'),
        end: format(endOfMonth(anchorDate), 'yyyy-MM-dd'),
        label: format(anchorDate, 'MMMM yyyy')
      };
    } else if (exportRange === 'quarter') {
      const quarter = Math.floor(anchorDate.getMonth() / 3);
      const quarterStart = new Date(anchorDate.getFullYear(), quarter * 3, 1);
      const quarterEnd = new Date(anchorDate.getFullYear(), quarter * 3 + 3, 0);
      return {
        start: format(quarterStart, 'yyyy-MM-dd'),
        end: format(quarterEnd, 'yyyy-MM-dd'),
        label: `Q${quarter + 1} ${format(anchorDate, 'yyyy')}`
      };
    } else {
      // Tax year: March to February
      const year = anchorDate.getMonth() < 2 ? anchorDate.getFullYear() - 1 : anchorDate.getFullYear();
      return {
        start: `${year}-03-01`,
        end: format(new Date(year + 1, 2, 0), 'yyyy-MM-dd'),
        label: `Tax Year ${year}-${year + 1}`
      };
    }
  };

  const getFilteredTripsForExport = (vehicleId?: string) => {
    const { start, end } = getExportDateRange();
    const filter = vehicleId || exportVehicleFilter;
    return trips
      .filter(t => t.date >= start && t.date <= end && (filter === 'all' || t.vehicle_id === filter))
      .sort((a, b) => a.date.localeCompare(b.date));
  };

  const exportToPDF = async () => {
    setExporting(true);
    try {
      const exportTrips = getFilteredTripsForExport();
      const { start, end, label } = getExportDateRange();
      const totalKm = exportTrips.reduce((sum, t) => sum + t.distance_km, 0);
      
      const doc = new jsPDF();
      
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('TOUCH TEQ ENGINEERING', 14, 20);
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.text('Travel Logbook', 14, 28);
      
      doc.setFontSize(10);
      doc.text(`Tax Period: ${label}`, 14, 35);
      doc.text(`Generated: ${format(new Date(), 'dd MMMM yyyy')}`, 14, 41);
      
      const exportVehicle = exportVehicleFilter !== 'all' 
        ? vehicles.find(v => v.id === exportVehicleFilter)
        : null;
      
      if (exportVehicle) {
        doc.setFontSize(9);
        doc.text(`Vehicle: ${exportVehicle.vehicle_description} (${exportVehicle.registration_number})`, 14, 50);
        doc.text(`Fuel Type: ${exportVehicle.fuel_type} | Opening Odometer: ${exportVehicle.opening_odometer.toLocaleString()} km`, 14, 56);
      } else if (vehicles.length > 0) {
        doc.setFontSize(9);
        doc.text(`All Vehicles (${vehicles.filter(v => v.is_active).length} active)`, 14, 50);
      }
      
      const tableData = exportTrips.map(trip => [
        format(parseISO(trip.date), 'dd/MM/yyyy'),
        trip.vehicle_description || '-',
        trip.from_location,
        trip.to_location,
        trip.distance_km.toString(),
        trip.purpose,
        trip.client_name || '-'
      ]);
      
      autoTable(doc, {
        startY: exportVehicle ? 65 : 50,
        head: [['Date', 'Vehicle', 'From', 'To', 'km', 'Purpose', 'Client']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [255, 105, 0], textColor: 255, fontStyle: 'bold', fontSize: 8 },
        bodyStyles: { fontSize: 8 },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 25 },
          2: { cellWidth: 28 },
          3: { cellWidth: 28 },
          4: { cellWidth: 12, halign: 'right' },
          5: { cellWidth: 40 },
          6: { cellWidth: 25 }
        }
      });
      
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`Total Business Kilometres: ${totalKm.toLocaleString()} km`, 14, finalY);
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('This document is generated for SARS tax purposes.', 14, 280);
      
      doc.save(`travel-logbook-${label.replace(/\s+/g, '-').toLowerCase()}.pdf`);
      toast.success({ title: 'Exported', message: 'PDF downloaded successfully' });
    } catch (err) {
      console.error(err);
      toast.error({ title: 'Export Failed', message: 'Could not generate PDF' });
    } finally {
      setExporting(false);
    }
  };

  const exportToExcel = async () => {
    setExporting(true);
    try {
      const exportTrips = getFilteredTripsForExport();
      const { label } = getExportDateRange();
      
      const wb = XLSX.utils.book_new();
      
      const data = exportTrips.map(trip => ({
        Date: format(parseISO(trip.date), 'yyyy-MM-dd'),
        Vehicle: trip.vehicle_description || '',
        From: trip.from_location,
        To: trip.to_location,
        'Odometer Start': trip.odometer_start,
        'Odometer End': trip.odometer_end,
        'Distance (km)': trip.distance_km,
        Purpose: trip.purpose,
        Client: trip.client_name || '',
        Notes: trip.notes || ''
      }));
      
      const ws = XLSX.utils.json_to_sheet(data);
      
      const totalKm = exportTrips.reduce((sum, t) => sum + t.distance_km, 0);
      const exportVehicle = exportVehicleFilter !== 'all' 
        ? vehicles.find(v => v.id === exportVehicleFilter)
        : null;
      
      const summaryData = [
        { Field: 'Company', Value: 'Touch Teq Engineering' },
        { Field: 'Tax Period', Value: label },
        { Field: 'Vehicle', Value: exportVehicle ? `${exportVehicle.vehicle_description} (${exportVehicle.registration_number})` : 'All Vehicles' },
        { Field: 'Total Trips', Value: exportTrips.length },
        { Field: 'Total Business km', Value: totalKm }
      ];
      const summaryWs = XLSX.utils.json_to_sheet(summaryData);
      
      XLSX.utils.book_append_sheet(wb, ws, 'Trip Log');
      XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');
      
      XLSX.writeFile(wb, `travel-logbook-${label.replace(/\s+/g, '-').toLowerCase()}.xlsx`);
      toast.success({ title: 'Exported', message: 'Excel file downloaded successfully' });
    } catch (err) {
      console.error(err);
      toast.error({ title: 'Export Failed', message: 'Could not generate Excel file' });
    } finally {
      setExporting(false);
    }
  };

  const monthlyData = useMemo(() => {
    const months: Record<string, { totalKm: number; trips: number; clientKm: Record<string, number> }> = {};
    
    trips.forEach(trip => {
      const month = trip.date.substring(0, 7);
      if (!months[month]) {
        months[month] = { totalKm: 0, trips: 0, clientKm: {} };
      }
      months[month].totalKm += trip.distance_km;
      months[month].trips += 1;
      
      const clientName = trip.client_name || 'Unlinked';
      months[month].clientKm[clientName] = (months[month].clientKm[clientName] || 0) + trip.distance_km;
    });
    
    return months;
  }, [trips]);

  const currentMonthData = monthlyData[monthFilter] || { totalKm: 0, trips: 0, clientKm: {} };
  
  const topClient = Object.entries(currentMonthData.clientKm)
    .sort(([,a], [,b]) => b - a)[0];

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(val).replace('ZAR', 'R');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-orange-500" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {(vehicleFilterOpen || clientFilterOpen) && (
        <div className="fixed inset-0 z-[99]" onClick={() => { setVehicleFilterOpen(false); setClientFilterOpen(false); }} />
      )}
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Travel Logbook</h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">
            Track business travel for SARS tax deductions
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowExportModal(true)}
            className="border border-slate-700 bg-[#151B28] hover:bg-slate-800 text-white font-black uppercase text-xs tracking-[0.2em] px-6 py-4 rounded-sm transition-all flex items-center gap-3"
          >
            <Download size={18} /> Export
          </button>
          <button 
            onClick={() => setShowForm(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white font-black uppercase text-xs tracking-[0.2em] px-8 py-4 rounded-sm transition-all flex items-center gap-3 shadow-lg shadow-orange-500/20"
          >
            <Plus size={18} /> Log Trip
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-[#151B28] p-1 rounded-lg border border-slate-800 w-fit">
        <button
          onClick={() => setActiveTab('trips')}
          className={`px-6 py-3 rounded-md font-black text-xs uppercase tracking-widest transition-all ${
            activeTab === 'trips' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Trip Log
        </button>
        <button
          onClick={() => setActiveTab('summary')}
          className={`px-6 py-3 rounded-md font-black text-xs uppercase tracking-widest transition-all ${
            activeTab === 'summary' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Monthly Summary
        </button>
      </div>

      {activeTab === 'trips' ? (
        <>
          {/* Filters */}
          <div className="flex flex-wrap gap-4 items-center">
            <MonthPicker 
              value={monthFilter}
              onChange={(val) => setMonthFilter(val)}
              placeholder="Select month"
            />

            <div className="relative">
              <button
                type="button"
                onClick={() => setVehicleFilterOpen(!vehicleFilterOpen)}
                className={`flex items-center justify-between px-4 py-2.5 border rounded-lg transition-all font-bold text-sm bg-[#151B28] w-[200px] ${
                  vehicleFilterOpen ? 'border-orange-500 bg-[#0B0F19]' : 'border-slate-700 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Car size={14} className="text-slate-500" />
                  <span className="text-white">
                    {vehicleFilter === 'all' ? 'All Vehicles' : vehicles.find(v => v.id === vehicleFilter)?.vehicle_description.split(' ')[0] || 'Select'}
                  </span>
                </div>
                <ChevronDown size={14} className={`text-slate-500 transition-transform ${vehicleFilterOpen ? 'rotate-180' : ''}`} />
              </button>
              {vehicleFilterOpen && (
<div className="absolute top-full left-0 mt-2 w-64 bg-[#151B28] border border-slate-800 rounded-xl shadow-2xl z-[100] max-h-60 overflow-y-auto p-1">
                  <button
                    type="button"
                    onClick={() => { setVehicleFilter('all'); setVehicleFilterOpen(false); }}
                    className={`w-full px-4 py-2.5 text-left hover:bg-slate-800 transition-colors font-medium text-sm ${
                      vehicleFilter === 'all' ? 'text-orange-500 bg-[#0B0F19]' : 'text-slate-300'
                    }`}
                  >
                    All Vehicles
                  </button>
                  {vehicles.filter(v => v.is_active).map(v => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => { setVehicleFilter(v.id); setVehicleFilterOpen(false); }}
                      className={`w-full px-4 py-2.5 text-left hover:bg-slate-800 transition-colors font-medium text-sm ${
                        vehicleFilter === v.id ? 'text-orange-500 bg-[#0B0F19]' : 'text-slate-300'
                      }`}
                    >
                      {v.vehicle_description}
                      <span className="text-slate-500 text-xs block">{v.registration_number}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setClientFilterOpen(!clientFilterOpen)}
              className={`flex items-center justify-between px-4 py-2.5 border rounded-lg transition-all font-bold text-sm bg-[#151B28] w-[180px] ${
                clientFilterOpen ? 'border-orange-500 bg-[#0B0F19]' : 'border-slate-700 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center gap-2">
                <Users size={14} className="text-slate-500" />
                <span className="text-white">
                  {clientFilter === 'all' ? 'All Clients' : clients.find(c => c.id === clientFilter)?.company_name.split(' ')[0] || 'Select'}
                </span>
              </div>
              <ChevronDown size={14} className={`text-slate-500 transition-transform ${clientFilterOpen ? 'rotate-180' : ''}`} />
            </button>
            {clientFilterOpen && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-[#151B28] border border-slate-800 rounded-xl shadow-2xl z-[100] max-h-60 overflow-y-auto p-1">
                <button
                  type="button"
                  onClick={() => { setClientFilter('all'); setClientFilterOpen(false); }}
                  className={`w-full px-4 py-2.5 text-left hover:bg-slate-800 transition-colors font-medium text-sm ${
                    clientFilter === 'all' ? 'text-orange-500 bg-slate-800' : 'text-slate-300'
                  }`}
                >
                  All Clients
                </button>
                {clients.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => { setClientFilter(c.id); setClientFilterOpen(false); }}
                    className={`w-full px-4 py-2.5 text-left hover:bg-slate-800 transition-colors font-medium text-sm ${
                      clientFilter === c.id ? 'text-orange-500 bg-[#0B0F19]' : 'text-slate-300'
                    }`}
                  >
                    {c.company_name}
                  </button>
                ))}
              </div>
            )}

            <div className="ml-auto text-right">
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Total km</p>
              <p className="text-2xl font-black text-white">{totalKm.toLocaleString()}</p>
            </div>
          </div>

          {/* Trip Table */}
          <div className="bg-[#151B28] border border-slate-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-slate-500 text-[10px] uppercase font-black tracking-[0.2em] bg-[#0B0F19]/50 border-b border-slate-800">
                    <th className="px-6 py-5">Date</th>
                    <th className="px-6 py-5">Vehicle</th>
                    <th className="px-6 py-5">Route</th>
                    <th className="px-6 py-5">Distance</th>
                    <th className="px-6 py-5">Purpose</th>
                    <th className="px-6 py-5">Client</th>
                    <th className="px-6 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/30">
                  {filteredTrips.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-20 text-center">
                        <div className="max-w-xs mx-auto">
                          <Car size={40} className="mx-auto text-slate-700 mb-4" />
                          <p className="text-slate-500 font-bold uppercase text-sm">No trips recorded</p>
                          <p className="text-slate-600 text-xs mt-2">Log your first business trip</p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredTrips.map(trip => (
                    <tr key={trip.id} className={`hover:bg-slate-800/50 transition-colors ${trip.client_id ? 'bg-green-500/5' : ''}`}>
                      <td className="px-6 py-5">
                        <p className="text-[10px] text-slate-500 font-bold uppercase">
                          {format(parseISO(trip.date), 'dd MMM yyyy')}
                        </p>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-[10px] font-black uppercase px-2 py-1 bg-orange-500/10 text-orange-500 rounded">
                          {trip.vehicle_description?.split(' ')[0] || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <MapPin size={12} className="text-slate-500" />
                          <p className="font-black text-white text-sm">{trip.from_location}</p>
                          <span className="text-slate-600">→</span>
                          <p className="font-black text-white text-sm">{trip.to_location}</p>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <p className="font-black text-orange-500">{trip.distance_km.toLocaleString()} km</p>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-slate-300 text-sm max-w-[200px] truncate">{trip.purpose}</p>
                      </td>
                      <td className="px-6 py-5">
                        {trip.client_name ? (
                          <span className="text-[10px] font-black uppercase px-2 py-1 bg-green-500/20 text-green-500 rounded">
                            {trip.client_name}
                          </span>
                        ) : (
                          <span className="text-[10px] font-black uppercase text-slate-600">Unlinked</span>
                        )}
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => openEdit(trip)}
                            className="p-2 text-slate-500 hover:text-white hover:bg-slate-700 rounded transition-all"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button 
                            onClick={() => handleDelete(trip.id)}
                            className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-[#0B0F19]/50 border-t border-slate-800">
                  <tr>
                    <td colSpan={3} className="px-6 py-4">
                      <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Total</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-white font-black text-lg">{totalKm.toLocaleString()} km</p>
                    </td>
                    <td colSpan={3}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Monthly Summary Tab */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#151B28] border border-slate-800 p-6 rounded-xl">
            <div className="flex items-center gap-3 mb-4">
              <Car size={20} className="text-orange-500" />
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Total Business km</p>
            </div>
            <p className="text-4xl font-black text-white">{currentMonthData.totalKm.toLocaleString()}</p>
          </div>

          <div className="bg-[#151B28] border border-slate-800 p-6 rounded-xl">
            <div className="flex items-center gap-3 mb-4">
              <FileText size={20} className="text-blue-500" />
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Number of Trips</p>
            </div>
            <p className="text-4xl font-black text-white">{currentMonthData.trips}</p>
          </div>

          <div className="bg-[#151B28] border border-slate-800 p-6 rounded-xl">
            <div className="flex items-center gap-3 mb-4">
              <Users size={20} className="text-green-500" />
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Most Visited</p>
            </div>
            <p className="text-xl font-black text-white">{topClient ? topClient[0] : '-'}</p>
            {topClient && (
              <p className="text-orange-500 text-sm font-bold">{topClient[1].toLocaleString()} km</p>
            )}
          </div>

          {settings && (
            <div className="bg-[#151B28] border border-slate-800 p-6 rounded-xl col-span-1 md:col-span-3">
              <div className="flex items-center gap-3 mb-4">
                <Fuel size={20} className="text-amber-500" />
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Estimated Fuel Cost</p>
              </div>
              <p className="text-3xl font-black text-white">
                {formatCurrency(currentMonthData.totalKm * 0.12 * settings.fuel_price_per_litre)}
              </p>
              <p className="text-slate-500 text-xs mt-2">
                Based on {settings.fuel_price_per_litre}/litre × 12L/100km × {currentMonthData.totalKm}km
              </p>
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {showExportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[210] flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowExportModal(false)} />

            <motion.div
              initial={{ scale: 0.96, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 10 }}
              className="relative z-10 w-full max-w-xl rounded-2xl border border-slate-800 bg-[#151B28] overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-slate-800 px-6 py-5">
                <div>
                  <h3 className="text-white font-black uppercase tracking-widest text-sm">Export Travel Logbook</h3>
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">
                    Choose a period and download PDF or Excel
                  </p>
                </div>
                <button onClick={() => setShowExportModal(false)} className="text-slate-500 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <div className="px-6 py-5 space-y-5">
                <div>
                  <label className="block text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Vehicle Filter</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setExportVehicleFilterOpen(!exportVehicleFilterOpen)}
                      className={`w-full flex items-center justify-between px-4 py-3 border rounded-lg transition-all font-bold text-sm bg-[#0B0F19] ${
                        exportVehicleFilterOpen ? 'border-orange-500' : 'border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <span className="text-white">
                        {exportVehicleFilter === 'all' ? 'All Vehicles' : vehicles.find(v => v.id === exportVehicleFilter)?.vehicle_description || 'Select'}
                      </span>
                      <ChevronDown size={14} className={`text-slate-500 transition-transform ${exportVehicleFilterOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {exportVehicleFilterOpen && (
                      <div className="absolute top-full left-0 w-full mt-2 bg-[#151B28] border border-slate-800 rounded-xl shadow-2xl z-[100] max-h-60 overflow-y-auto p-1">
                        <button
                          type="button"
                          onClick={() => { setExportVehicleFilter('all'); setExportVehicleFilterOpen(false); }}
                          className={`w-full px-4 py-2.5 text-left hover:bg-[#151B28] transition-colors font-medium text-sm ${
                            exportVehicleFilter === 'all' ? 'text-orange-500' : 'text-slate-300'
                          }`}
                        >
                          All Vehicles
                        </button>
                        {vehicles.filter(v => v.is_active).map(v => (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => { setExportVehicleFilter(v.id); setExportVehicleFilterOpen(false); }}
                            className={`w-full px-4 py-2.5 text-left hover:bg-[#151B28] transition-colors font-medium text-sm ${
                              exportVehicleFilter === v.id ? 'text-orange-500' : 'text-slate-300'
                            }`}
                          >
                            {v.vehicle_description}
                            <span className="text-slate-500 text-xs block">{v.registration_number}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {(['month', 'quarter', 'year'] as const).map((range) => (
                    <button
                      key={range}
                      onClick={() => setExportRange(range)}
                      className={`rounded-lg border px-4 py-3 text-xs font-black uppercase tracking-widest transition-all ${
                        exportRange === range
                          ? 'border-orange-500 bg-orange-500/10 text-orange-400'
                          : 'border-slate-700 bg-[#0B0F19] text-slate-400 hover:text-white'
                      }`}
                    >
                      {range === 'month' ? 'Month' : range === 'quarter' ? 'Quarter' : 'Tax Year'}
                    </button>
                  ))}
                </div>

                <div className="rounded-xl border border-slate-800 bg-[#0B0F19] p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle size={16} className="mt-0.5 text-orange-400 shrink-0" />
                    <p className="text-slate-300 text-sm">
                      Export period: <span className="text-white font-bold">{getExportDateRange().label}</span>. 
                      {exportVehicleFilter !== 'all' 
                        ? ` Only ${vehicles.find(v => v.id === exportVehicleFilter)?.vehicle_description} trips.`
                        : ' All vehicle trips.'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={exportToPDF}
                    disabled={exporting}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-black uppercase text-xs tracking-[0.2em] px-5 py-4 rounded-sm transition-all flex items-center justify-center gap-3"
                  >
                    {exporting ? <Loader2 size={16} className="animate-spin" /> : <File size={16} />}
                    Export PDF
                  </button>
                  <button
                    onClick={exportToExcel}
                    disabled={exporting}
                    className="flex-1 border border-slate-700 bg-[#151B28] hover:bg-slate-800 disabled:opacity-60 text-white font-black uppercase text-xs tracking-[0.2em] px-5 py-4 rounded-sm transition-all flex items-center justify-center gap-3"
                  >
                    {exporting ? <Loader2 size={16} className="animate-spin" /> : <FileSpreadsheet size={16} />}
                    Export Excel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trip Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={resetForm} />
            
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="bg-[#151B28] border border-slate-800 w-full max-w-2xl rounded-2xl overflow-visible relative z-10"
            >
              <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                <h3 className="text-white font-black uppercase tracking-widest text-sm">
                  {editingTrip ? 'Edit Trip' : 'Log New Trip'}
                </h3>
                <button onClick={resetForm} className="text-slate-500 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                {odometerWarning && (
                  <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-start gap-3">
                    <AlertTriangle size={18} className="text-yellow-500 shrink-0 mt-0.5" />
                    <p className="text-yellow-500 text-sm font-medium">{odometerWarning}</p>
                  </div>
                )}

                <div>
                  <label className="block text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Vehicle</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setFormVehicleOpen(!formVehicleOpen)}
                      className={`w-full flex items-center justify-between px-4 py-3 border rounded-lg transition-all font-bold text-sm bg-[#0B0F19] ${
                        formVehicleOpen ? 'border-orange-500' : 'border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <span className="text-white">
                        {selectedVehicleId ? selectedVehicle?.vehicle_description || 'Select Vehicle' : 'Select Vehicle'}
                      </span>
                      <ChevronDown size={14} className={`text-slate-500 transition-transform ${formVehicleOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {formVehicleOpen && (
                      <div className="absolute top-full left-0 w-full mt-2 bg-[#151B28] border border-slate-800 rounded-xl shadow-2xl z-[100] max-h-60 overflow-y-auto p-1">
                        {vehicles.filter(v => v.is_active).map(v => (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => {
                              setSelectedVehicleId(v.id);
                              setFormVehicleOpen(false);
                              if (!editingTrip) {
                                const vehicleLastTrip = trips.filter(t => t.vehicle_id === v.id).sort((a, b) => b.date.localeCompare(a.date))[0];
                                setFormData(prev => ({
                                  ...prev,
                                  odometer_start: vehicleLastTrip?.odometer_end || v.opening_odometer,
                                }));
                              }
                            }}
                            className={`w-full px-4 py-2.5 text-left hover:bg-[#151B28] transition-colors font-medium text-sm ${
                              selectedVehicleId === v.id ? 'text-orange-500' : 'text-slate-300'
                            }`}
                          >
                            {v.vehicle_description}
                            <span className="text-slate-500 text-xs block">{v.registration_number}{v.is_default ? ' • Default' : ''}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {selectedVehicle && (
                    <p className="text-[10px] text-slate-500 mt-1">
                      Fuel: {selectedVehicle.fuel_type} • Opening: {selectedVehicle.opening_odometer.toLocaleString()} km
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <DatePicker 
                    label="Date"
                    value={formData.date}
                    onChange={(val) => setFormData({...formData, date: val})}
                  />
                  <div>
                    <label className="block text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Client (Optional)</label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setFormClientOpen(!formClientOpen)}
                        className={`w-full flex items-center justify-between px-4 py-3 border rounded-lg transition-all font-bold text-sm bg-[#0B0F19] ${
                          formClientOpen ? 'border-orange-500' : 'border-slate-700 hover:border-slate-600'
                        }`}
                      >
                        <span className={formData.client_id ? 'text-white' : 'text-slate-500'}>
                          {formData.client_id ? clients.find(c => c.id === formData.client_id)?.company_name || 'Select Client' : 'Select Client'}
                        </span>
                        <ChevronDown size={14} className={`text-slate-500 transition-transform ${formClientOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {formClientOpen && (
                        <div className="absolute top-full left-0 w-full mt-2 bg-[#151B28] border border-slate-800 rounded-xl shadow-2xl z-[100] max-h-60 overflow-y-auto p-1">
                          <button
                            type="button"
                            onClick={() => { setFormData(prev => ({ ...prev, client_id: '' })); setFormClientOpen(false); }}
                            className={`w-full px-4 py-2.5 text-left hover:bg-[#151B28] transition-colors font-medium text-sm ${
                              !formData.client_id ? 'text-orange-500' : 'text-slate-300'
                            }`}
                          >
                            No Client
                          </button>
                          {clients.map(c => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => { setFormData(prev => ({ ...prev, client_id: c.id })); setFormClientOpen(false); }}
                              className={`w-full px-4 py-2.5 text-left hover:bg-[#151B28] transition-colors font-medium text-sm ${
                                formData.client_id === c.id ? 'text-orange-500' : 'text-slate-300'
                              }`}
                            >
                              {c.company_name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">From</label>
                    <input 
                      type="text" 
                      placeholder="Starting location"
                      value={formData.from_location}
                      onChange={(e) => setFormData({...formData, from_location: e.target.value})}
                      className="w-full bg-[#0B0F19] border border-slate-700 rounded-lg px-4 py-3 text-white font-bold text-sm focus:border-orange-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">To</label>
                    <input 
                      type="text" 
                      placeholder="Destination"
                      value={formData.to_location}
                      onChange={(e) => setFormData({...formData, to_location: e.target.value})}
                      className="w-full bg-[#0B0F19] border border-slate-700 rounded-lg px-4 py-3 text-white font-bold text-sm focus:border-orange-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Odometer Start (km)</label>
                    <input 
                      type="number" 
                      value={formData.odometer_start || ''}
                      onChange={(e) => handleOdometerChange('odometer_start', parseInt(e.target.value) || 0)}
                      className="w-full bg-[#0B0F19] border border-slate-700 rounded-lg px-4 py-3 text-white font-bold text-sm focus:border-orange-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Odometer End (km)</label>
                    <input 
                      type="number" 
                      value={formData.odometer_end || ''}
                      onChange={(e) => handleOdometerChange('odometer_end', parseInt(e.target.value) || 0)}
                      className="w-full bg-[#0B0F19] border border-slate-700 rounded-lg px-4 py-3 text-white font-bold text-sm focus:border-orange-500 outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="block text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Distance (km)</label>
                    <input 
                      type="number" 
                      value={formData.distance_km || ''}
                      onChange={(e) => setFormData({
                        ...formData, 
                        distance_km: parseInt(e.target.value) || 0,
                        manual_distance: true
                      })}
                      className="w-full bg-[#0B0F19] border border-slate-700 rounded-lg px-4 py-3 text-white font-bold text-sm focus:border-orange-500 outline-none"
                    />
                  </div>
                  <div className="flex items-end pb-3">
                    <label className="flex items-center gap-2 text-slate-400 text-sm font-bold cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={formData.manual_distance}
                        onChange={(e) => setFormData({...formData, manual_distance: e.target.checked})}
                        className="w-4 h-4 accent-orange-500"
                      />
                      Manual override
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Purpose of Trip</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Site visit — Client Name"
                    value={formData.purpose}
                    onChange={(e) => setFormData({...formData, purpose: e.target.value})}
                    className="w-full bg-[#0B0F19] border border-slate-700 rounded-lg px-4 py-3 text-white font-bold text-sm focus:border-orange-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Notes (Optional)</label>
                  <textarea 
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="w-full bg-[#0B0F19] border border-slate-700 rounded-lg px-4 py-3 text-white font-bold text-sm focus:border-orange-500 outline-none resize-none"
                  />
                </div>
              </div>

              <div className="p-6 border-t border-slate-800 flex justify-end gap-4">
                <button 
                  onClick={resetForm}
                  className="px-6 py-3 text-slate-400 font-black uppercase text-xs hover:text-white"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSubmit}
                  disabled={saving || !selectedVehicleId || !formData.from_location || !formData.to_location || !formData.distance_km}
                  className="bg-orange-500 hover:bg-orange-600 px-8 py-3 rounded-sm font-black text-xs uppercase tracking-widest text-white transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {editingTrip ? 'Update Trip' : 'Save Trip'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
