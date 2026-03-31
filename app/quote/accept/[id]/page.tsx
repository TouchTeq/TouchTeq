'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, XCircle, AlertTriangle, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { format } from 'date-fns';

export default function QuoteAcceptPage({ params }: { params: Promise<{ id: string }> }) {
  const [quote, setQuote] = useState<any>(null);
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null);

  useEffect(() => {
    params.then(p => setResolvedParams(p));
  }, [params]);

  useEffect(() => {
    const paramId = resolvedParams?.id;
    if (!paramId) return;

    async function fetchQuote() {
      try {
        const { data, error } = await supabase
          .from('quotes')
          .select(`
            *,
            clients(company_name, email, contact_person)
          `)
          .eq('id', paramId)
          .single();

        if (error || !data) {
          setError('Quote not found. The link may be invalid or expired.');
          return;
        }

        setQuote(data);
        
        if (data.clients) {
          setClient(data.clients);
        }
      } catch (err) {
        setError('Failed to load quote details.');
      } finally {
        setLoading(false);
      }
    }

    fetchQuote();
  }, [resolvedParams, supabase]);

  const getClientIp = async () => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'Unknown';
    }
  };

  const handleAccept = async () => {
    if (!resolvedParams) return;
    setProcessing(true);
    try {
      const ipAddress = await getClientIp();
      const acceptanceRecord = {
        accepted_at: new Date().toISOString(),
        ip_address: ipAddress,
        user_agent: navigator.userAgent,
        accepted_from: 'quote_acceptance_link'
      };

      const { error } = await supabase
        .from('quotes')
        .update({
          status: 'Accepted',
          acceptance_status: 'Accepted',
          accepted_at: new Date().toISOString(),
          accepted_ip_address: ipAddress,
          acceptance_record: acceptanceRecord
        })
        .eq('id', resolvedParams.id);

      if (error) throw error;

      setSuccess('Thank you! Your acceptance has been recorded.');
      
      // Send notification to Thabo
      await fetch('/api/emails/quote-accepted-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoteId: resolvedParams.id,
          quoteNumber: quote.quote_number,
          clientName: client?.company_name,
          acceptedAt: new Date().toISOString()
        })
      });

    } catch (err: any) {
      setError(err.message || 'Failed to accept quote. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleDecline = async () => {
    if (!resolvedParams || !declineReason.trim()) {
      return;
    }

    setProcessing(true);
    try {
      const ipAddress = await getClientIp();

      const { error } = await supabase
        .from('quotes')
        .update({
          status: 'Declined',
          acceptance_status: 'Declined',
          decline_reason: declineReason,
          accepted_at: new Date().toISOString(),
          accepted_ip_address: ipAddress
        })
        .eq('id', resolvedParams.id);

      if (error) throw error;

      setSuccess('Your response has been recorded. Thank you for your feedback.');
      
      // Send notification to Thabo
      await fetch('/api/emails/quote-declined-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoteId: resolvedParams.id,
          quoteNumber: quote.quote_number,
          clientName: client?.company_name,
          declineReason: declineReason,
          declinedAt: new Date().toISOString()
        })
      });

    } catch (err: any) {
      setError(err.message || 'Failed to submit response. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0F1A] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-orange-500 animate-spin mx-auto" />
          <p className="text-slate-400 mt-4">Loading quote...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0A0F1A] flex items-center justify-center p-4">
        <div className="bg-[#151B28] border border-red-500/30 rounded-xl p-8 max-w-md text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-black text-white mb-2">Error</h1>
          <p className="text-slate-400">{error}</p>
          <Link href="/" className="inline-flex items-center gap-2 text-orange-500 mt-6 hover:text-orange-400">
            <ArrowLeft size={16} /> Return to Home
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#0A0F1A] flex items-center justify-center p-4">
        <div className="bg-[#151B28] border border-green-500/30 rounded-xl p-8 max-w-md text-center">
          <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h1 className="text-xl font-black text-white mb-2">Thank You!</h1>
          <p className="text-slate-400">{success}</p>
          <Link href="/" className="inline-flex items-center gap-2 text-orange-500 mt-6 hover:text-orange-400">
            <ArrowLeft size={16} /> Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0F1A] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-500/10 rounded-full mb-4">
            <span className="text-orange-500 font-black text-2xl">T</span>
          </div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tight">Quote Response</h1>
          <p className="text-slate-400 mt-2">Please review and respond to the quote below</p>
        </div>

        {/* Quote Details Card */}
        <div className="bg-[#151B28] border border-slate-800 rounded-xl p-6 mb-6">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Quote Number</p>
              <p className="text-white font-bold">{quote?.quote_number}</p>
            </div>
            <div>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Date</p>
              <p className="text-white font-bold">{quote?.issue_date ? format(new Date(quote.issue_date), 'dd MMMM yyyy') : 'N/A'}</p>
            </div>
            <div>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Client</p>
              <p className="text-white font-bold">{client?.company_name}</p>
            </div>
            <div>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Total Amount</p>
              <p className="text-orange-500 font-black text-xl">R {quote?.total?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-4">
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Confirmation Statement</p>
            <p className="text-slate-300 text-sm">
              By clicking Accept, I confirm my agreement to the quoted scope of work and pricing.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setShowDeclineModal(true)}
            disabled={processing}
            className="flex items-center justify-center gap-2 py-4 px-6 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-500 rounded-xl font-black uppercase tracking-widest transition-all disabled:opacity-50"
          >
            <XCircle size={20} />
            Decline Quote
          </button>
          <button
            onClick={handleAccept}
            disabled={processing}
            className="flex items-center justify-center gap-2 py-4 px-6 bg-green-500 hover:bg-green-600 text-white rounded-xl font-black uppercase tracking-widest transition-all disabled:opacity-50"
          >
            <CheckCircle2 size={20} />
            Accept Quote
          </button>
        </div>

        {/* Decline Modal */}
        {showDeclineModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <div className="bg-[#151B28] border border-slate-800 rounded-xl p-6 max-w-md w-full">
              <h3 className="text-white font-black uppercase mb-4">Decline Quote</h3>
              <p className="text-slate-400 text-sm mb-4">
                Please let us know why you're declining this quote. Your feedback helps us improve.
              </p>
              <textarea
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="Reason for declining (optional)..."
                className="w-full bg-[#0B0F19] border border-slate-700 rounded-lg p-3 text-white text-sm mb-4 h-24 resize-none"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeclineModal(false)}
                  className="flex-1 py-3 bg-slate-800 text-slate-300 rounded-lg font-bold uppercase text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDecline}
                  disabled={processing}
                  className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-black uppercase text-sm disabled:opacity-50"
                >
                  {processing ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-slate-500 text-xs">
          <p>Powered by Touch Teq Engineering Services</p>
        </div>
      </div>
    </div>
  );
}
