import { createClient } from '@/lib/supabase/server';
import { 
  ArrowLeft, 
  Edit2, 
  Building2, 
  Mail, 
  Phone, 
  PhoneCall,
  MapPin, 
  FileText, 
  Receipt,
  Plus,
  ExternalLink,
  Info,
  History,
  TrendingDown,
  TrendingUp,
  CreditCard,
  AlertCircle,
  Tag,
  Wallet,
  MailX,
  CheckCircle2,
  MessageSquare
} from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import { ClientCommunicationsLog } from '@/components/office/ClientCommunicationsLog';
import { ClientDetailPageHeader } from './HeaderActions';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
  }).format(amount).replace('ZAR', 'R');
};

export default async function ClientDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>,
  searchParams: Promise<{ tab?: string }>
}) {
  const { id } = await params;
  const { tab = 'quotes' } = await searchParams;
  const supabase = await createClient();

  const { data: client, error } = await supabase
    .from('clients')
    .select(`
      *,
      client_contacts(*),
      quotes(*),
      invoices(*),
      client_communications(id)
    `)
    .eq('id', id)
    .single();

  if (error || !client) {
    notFound();
  }

  // Financial Summary Calculations
  const totalInvoiced = client.invoices?.reduce((sum: number, inv: any) => sum + (inv.total || 0), 0) || 0;
  const totalCollected = client.invoices?.reduce((sum: number, inv: any) => sum + (inv.amount_paid || 0), 0) || 0;
  const totalOutstanding = client.invoices?.reduce((sum: number, inv: any) => sum + (inv.balance_due || 0), 0) || 0;
  
  const now = new Date();
  const totalOverdue = client.invoices?.filter((inv: any) => (inv.status !== 'Paid' && new Date(inv.due_date) < now)).reduce((sum: number, inv: any) => sum + (inv.balance_due || 0), 0) || 0;

  const contacts = (client.client_contacts || [])
    .slice()
    .sort((a: any, b: any) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0));

  return (
    <div className="space-y-8 pb-20">
      {/* Header & Back Link */}
      <ClientDetailPageHeader 
        id={id} 
        companyName={client.company_name} 
        clientEmail={client.email}
      />

      {/* Stats Summary Row — Dedicated Card for Opening Balance */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#151B28] border border-slate-800/50 p-6 rounded-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <FileText size={40} className="text-blue-500" />
          </div>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Quotes Total</p>
          <h3 className="text-xl font-black text-white">
            {formatCurrency(client.quotes?.reduce((s: number, q: any) => s + (q.total || 0), 0) || 0)}
          </h3>
        </div>
        
        <div className="bg-[#151B28] border border-slate-800/50 p-6 rounded-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <Receipt size={40} className="text-orange-500" />
          </div>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Invoice Total</p>
          <h3 className="text-xl font-black text-white">{formatCurrency(totalInvoiced)}</h3>
        </div>

        <div className="bg-[#151B28] border border-slate-800/50 p-6 rounded-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp size={40} className="text-green-500" />
          </div>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Collected</p>
          <h3 className="text-xl font-black text-green-500">{formatCurrency(totalCollected)}</h3>
        </div>

        {(client.opening_balance !== 0 && client.opening_balance !== null) ? (
          <div className="bg-[#151B28] border border-amber-500/30 p-6 rounded-xl relative overflow-hidden group shadow-lg shadow-amber-500/5">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <Wallet size={40} className="text-amber-400" />
            </div>
            <p className="text-amber-500/70 text-[10px] font-black uppercase tracking-widest mb-1">Opening Balance (Sage)</p>
            <h3 className={`text-xl font-black ${client.opening_balance < 0 ? 'text-red-400' : 'text-amber-400'}`}>
              {formatCurrency(client.opening_balance)}
            </h3>
          </div>
        ) : (
          <div className="bg-[#151B28] border border-red-500/20 p-6 rounded-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <AlertCircle size={40} className="text-red-500" />
            </div>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Outstanding (Inv)</p>
            <h3 className="text-xl font-black text-red-500">{formatCurrency(totalOutstanding)}</h3>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Client Profile Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#151B28] border border-slate-800/50 rounded-xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-800/50 flex items-center gap-3">
              <Info size={18} className="text-orange-500" />
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-white">Client Summary</h2>
            </div>
            
            <div className="p-8 space-y-6">

              {/* Status + Flags Row */}
              <div className="flex flex-wrap gap-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-widest ${
                  client.is_active ? 'bg-green-500/10 text-green-500' : 'bg-slate-800 text-slate-500'
                }`}>
                  <CheckCircle2 size={12} />
                  {client.is_active ? 'Active' : 'Inactive'}
                </span>
                {client.email_missing && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-500">
                    <MailX size={12} />
                    Email Missing
                  </span>
                )}
              </div>

              {/* Category */}
              {client.category && (
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-white/5 rounded-lg text-slate-500"><Tag size={16} /></div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Category</p>
                    <p className="text-slate-200 text-sm font-black mt-0.5">{client.category}</p>
                  </div>
                </div>
              )}

              {/* Opening Balance */}
              {(client.opening_balance !== null && client.opening_balance !== undefined) && (
                <div className="flex items-center gap-4 pt-4 border-t border-slate-800/50">
                  <div className="p-2 bg-white/5 rounded-lg text-slate-500"><Wallet size={16} /></div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Opening Balance (Sage)</p>
                    <p className={`text-sm font-black mt-0.5 ${
                      client.opening_balance < 0 ? 'text-red-400' :
                      client.opening_balance > 0 ? 'text-amber-400' : 'text-slate-500'
                    }`}>
                      {formatCurrency(client.opening_balance)}
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-4 pt-4 border-t border-slate-800/50">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-white/5 rounded-lg text-slate-500"><MapPin size={18} /></div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Physical Address</p>
                    <p className="text-slate-400 text-xs leading-relaxed mt-1">
                      {client.physical_address || 'No address provided'}
                    </p>
                  </div>
                </div>

                {client.postal_address && client.postal_address !== client.physical_address && (
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-white/5 rounded-lg text-slate-500"><MapPin size={18} /></div>
                    <div className="flex-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Postal Address</p>
                      <p className="text-slate-400 text-xs leading-relaxed mt-1">
                        {client.postal_address}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {client.notes && (
                <div className="pt-4 border-t border-slate-800/50">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Company Notes</p>
                  <p className="text-slate-400 text-xs italic bg-black/20 p-4 rounded border-l-2 border-orange-500/50 whitespace-pre-wrap">
                    "{client.notes}"
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-[#151B28] border border-slate-800/50 rounded-xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-800/50 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Mail size={18} className="text-orange-500" />
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-white">Contacts</h2>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                {contacts.length} total
              </span>
            </div>

            <div className="p-6 grid grid-cols-1 gap-4">
              {contacts.length > 0 ? (
                contacts.map((c: any) => (
                  <div key={c.id} className="bg-[#0B0F19]/60 border border-slate-800 rounded-xl p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="px-2 py-1 rounded bg-orange-500/10 text-orange-500 text-[10px] font-black uppercase tracking-widest">
                            {c.contact_type}
                          </span>
                          {c.is_primary && (
                            <span className="px-2 py-1 rounded bg-green-500/10 text-green-500 text-[10px] font-black uppercase tracking-widest">
                              Primary
                            </span>
                          )}
                        </div>
                        <p className="text-white font-black text-sm truncate">{c.full_name}</p>
                        <p className="text-slate-500 text-xs font-bold truncate">{c.job_title || '—'}</p>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2 text-xs">
                      {c.email && (
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-slate-500 font-bold">Email</span>
                          <span className="text-slate-200 font-black truncate">{c.email}</span>
                        </div>
                      )}
                      {c.cell_number && (
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-slate-500 font-bold">Cell</span>
                          <span className="text-slate-200 font-black">{c.cell_number}</span>
                        </div>
                      )}
                      {(c.landline_number || c.extension) && (
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-slate-500 font-bold">Landline</span>
                          <span className="text-slate-200 font-black">
                            {c.landline_number || '—'}
                            {c.extension ? ` ext. ${c.extension}` : ''}
                          </span>
                        </div>
                      )}
                      {c.notes && (
                        <div className="pt-2">
                          <p className="text-slate-500 font-bold mb-1">Notes</p>
                          <p className="text-slate-300 text-xs font-medium bg-black/20 border border-slate-800/60 rounded-lg p-3 whitespace-pre-wrap">
                            {c.notes}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-800/60 flex items-center justify-end gap-2">
                      {c.email && (
                        <a
                          href={`mailto:${c.email}`}
                          className="p-2 rounded-lg bg-slate-800/50 text-slate-300 hover:text-white hover:bg-slate-700 transition-all"
                          title="Email contact"
                        >
                          <Mail size={16} />
                        </a>
                      )}
                      {(c.cell_number || c.landline_number) && (
                        <a
                          href={`tel:${(c.cell_number || c.landline_number || '').replace(/\s+/g, '')}`}
                          className="p-2 rounded-lg bg-slate-800/50 text-slate-300 hover:text-white hover:bg-slate-700 transition-all"
                          title="Call contact"
                        >
                          <PhoneCall size={16} />
                        </a>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-6 py-12 text-center text-slate-600 font-bold uppercase text-[10px] tracking-widest">
                  No contacts added yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Content Tabs */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex bg-[#151B28] p-1 rounded-sm border border-slate-800/50 w-fit">
            <Link
              href={`/office/clients/${id}?tab=quotes`}
              className={`px-8 py-3 text-[10px] font-black uppercase tracking-[0.2em] rounded-sm transition-all flex items-center gap-3 ${
                tab === 'quotes' 
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/10' 
                  : 'text-slate-500 hover:text-white'
              }`}
            >
              <FileText size={16} /> Quotes
            </Link>
            <Link
              href={`/office/clients/${id}?tab=invoices`}
              className={`px-8 py-3 text-[10px] font-black uppercase tracking-[0.2em] rounded-sm transition-all flex items-center gap-3 ${
                tab === 'invoices' 
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/10' 
                  : 'text-slate-500 hover:text-white'
              }`}
            >
              <Receipt size={16} /> Invoices
            </Link>
            <Link
              href={`/office/clients/${id}?tab=communications`}
              className={`px-8 py-3 text-[10px] font-black uppercase tracking-[0.2em] rounded-sm transition-all flex items-center gap-3 ${
                tab === 'communications' 
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/10' 
                  : 'text-slate-500 hover:text-white'
              }`}
            >
              <MessageSquare size={16} /> Comms
              {client.client_communications?.length > 0 && (
                <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.5 rounded-full min-w-[1.2rem] text-center font-black">
                  {client.client_communications.length}
                </span>
              )}
            </Link>
          </div>

          {/* Tab Content */}
          <div className="bg-[#151B28] border border-slate-800/50 rounded-xl overflow-hidden shadow-2xl">
            {tab === 'quotes' ? (
              <div>
                <div className="p-6 border-b border-slate-800/50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText size={18} className="text-blue-500" />
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white">Quotation History</h3>
                  </div>
                  <Link href="/office/quotes/new" className="p-2 bg-blue-500/10 text-blue-500 rounded hover:bg-blue-500/20 transition-all border border-blue-500/20">
                    <Plus size={16} />
                  </Link>
                </div>
                <div className="overflow-x-auto text-sm">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-slate-500 text-[10px] uppercase font-bold tracking-[0.2em] bg-black/20">
                        <th className="px-6 py-3">Quote #</th>
                        <th className="px-6 py-3">Issue Date</th>
                        <th className="px-6 py-3">Amount</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3 text-right"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/30">
                      {(client.quotes?.length || 0) > 0 ? (
                        client.quotes.map((q: any) => (
                          <tr key={q.id} className="hover:bg-slate-800/20 transition-colors">
                            <td className="px-6 py-4 font-black text-white">{q.quote_number}</td>
                            <td className="px-6 py-4 text-slate-400 font-medium">{format(new Date(q.issue_date), 'dd MMM yyyy')}</td>
                            <td className="px-6 py-4 font-black">{formatCurrency(q.total || 0)}</td>
                            <td className="px-6 py-4">
                              <span className="text-[10px] font-black uppercase px-2 py-1 bg-blue-500/10 text-blue-500 rounded">
                                {q.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button className="text-slate-600 hover:text-white transition-colors"><ExternalLink size={14} /></button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-slate-600 font-bold uppercase text-[10px] tracking-widest">
                            No quotes found for this client.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div>
                <div className="p-6 border-b border-slate-800/50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Receipt size={18} className="text-orange-500" />
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white">Invoice History</h3>
                  </div>
                  <Link href="/office/invoices/new" className="p-2 bg-orange-500/10 text-orange-500 rounded hover:bg-orange-500/20 transition-all border border-orange-500/20">
                    <Plus size={16} />
                  </Link>
                </div>
                <div className="overflow-x-auto text-sm">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-slate-500 text-[10px] uppercase font-bold tracking-[0.2em] bg-black/20">
                        <th className="px-6 py-3">Inv #</th>
                        <th className="px-6 py-3">Due Date</th>
                        <th className="px-6 py-3">Total</th>
                        <th className="px-6 py-3">Paid</th>
                        <th className="px-6 py-3">Balance</th>
                        <th className="px-6 py-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/30">
                      {(client.invoices?.length || 0) > 0 ? (
                        client.invoices.map((inv: any) => {
                          const isOverdue = inv.status !== 'Paid' && new Date(inv.due_date) < now;
                          return (
                            <tr key={inv.id} className="hover:bg-slate-800/20 transition-colors">
                              <td className="px-6 py-4 font-black text-white">{inv.invoice_number}</td>
                              <td className={`px-6 py-4 font-medium ${isOverdue ? 'text-red-500' : 'text-slate-400'}`}>
                                {format(new Date(inv.due_date), 'dd MMM yyyy')}
                              </td>
                              <td className="px-6 py-4 font-black">{formatCurrency(inv.total || 0)}</td>
                              <td className="px-6 py-4 text-green-500 font-bold">{formatCurrency(inv.amount_paid || 0)}</td>
                              <td className={`px-6 py-4 font-black ${inv.balance_due > 0 ? 'text-amber-500' : 'text-slate-400'}`}>
                                {formatCurrency(inv.balance_due || 0)}
                              </td>
                              <td className="px-6 py-4 text-right">
                                <span className={`text-[10px] font-black uppercase px-2 py-1 rounded inline-block ${
                                  inv.status === 'Paid' ? 'bg-green-500/10 text-green-500' :
                                  isOverdue ? 'bg-red-500/10 text-red-500' :
                                  'bg-amber-500/10 text-amber-500'
                                }`}>
                                  {isOverdue ? 'Overdue' : inv.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-slate-600 font-bold uppercase text-[10px] tracking-widest">
                            No invoices found for this client.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Financial Summary Card */}
          <div className="bg-[#151B28] border border-slate-800/50 rounded-xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-800/50 flex items-center gap-3">
              <TrendingUp size={18} className="text-orange-500" />
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white">Financial Summary</h3>
            </div>
            <div className="p-8 grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Invoiced Total</p>
                <p className="text-xl font-black text-white">{formatCurrency(totalInvoiced)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Collected Total</p>
                <p className="text-xl font-black text-green-500">{formatCurrency(totalCollected)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-500/70">Outstanding</p>
                <p className="text-xl font-black text-amber-500">{formatCurrency(totalOutstanding)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-red-500/70">Overdue Amount</p>
                <p className="text-xl font-black text-red-500">{formatCurrency(totalOverdue)}</p>
              </div>
              {(client.opening_balance !== null && client.opening_balance !== undefined && client.opening_balance !== 0) && (
                <div className="space-y-1 col-span-2 md:col-span-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Opening Balance</p>
                  <p className={`text-xl font-black ${
                    client.opening_balance < 0 ? 'text-red-400' : 'text-slate-300'
                  }`}>{formatCurrency(client.opening_balance)}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
