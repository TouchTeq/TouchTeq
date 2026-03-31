import React from 'react';
import { buildInvoiceRenderData, formatInvoiceCurrency } from '@/lib/invoices/invoice-renderer-data';

type InvoiceRendererProps = {
  invoice: any;
  lineItems: any[];
  businessProfile: any;
  className?: string;
};

function SupplierBrand({ logoUrl, supplierName, accentColor }: { logoUrl?: string; supplierName?: string; accentColor: string }) {
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={supplierName || 'Supplier logo'}
        className="max-h-16 max-w-[220px] object-contain object-left"
      />
    );
  }

  const name = supplierName || 'Invoice';
  const highlighted = name.startsWith('Touch') ? name.replace(/^Touch/i, '') : '';

  return (
    <div className="flex items-center gap-3">
      <div
        className="flex h-11 w-11 items-center justify-center rounded-2xl text-lg font-black text-white"
        style={{ backgroundColor: accentColor }}
      >
        {name.slice(0, 1).toUpperCase()}
      </div>
      <div>
        <p className="text-lg font-black tracking-tight text-slate-950">
          {name.startsWith('Touch') ? (
            <>
              Touch<span style={{ color: accentColor }}>{highlighted}</span>
            </>
          ) : (
            name
          )}
        </p>
        <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-slate-400">Engineering Services</p>
      </div>
    </div>
  );
}

export default function InvoiceRenderer({ invoice, lineItems, businessProfile, className = '' }: InvoiceRendererProps) {
  const data = buildInvoiceRenderData(invoice, lineItems, businessProfile);
  const accentColor = data.settings.primaryColor;

  return (
    <div
      className={`mx-auto w-[794px] min-h-[1123px] bg-white px-12 py-12 text-slate-900 shadow-[0_24px_80px_rgba(15,23,42,0.18)] ${className}`.trim()}
      style={{ fontFamily: data.settings.fontFamily }}
    >
      <div className="flex items-start justify-between border-b pb-8" style={{ borderColor: accentColor }}>
        <SupplierBrand logoUrl={data.logoUrl} supplierName={data.supplierName} accentColor={accentColor} />
        <div className="text-right">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Tax Invoice</p>
          {data.invoiceNumber && (
            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
              {data.invoiceNumber}
            </h1>
          )}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-[1.1fr_0.9fr] gap-10">
        <section className="space-y-4">
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Supplier</p>
          {data.supplierName && <p className="text-sm font-black uppercase text-slate-950">{data.supplierName}</p>}
          <div className="space-y-1.5 text-xs font-medium text-slate-600">
            {data.supplierAddressLines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
          <div className="space-y-1.5 pt-2 text-[11px]">
            {data.supplierDetails.map((detail) => (
              <p key={`${detail.label}-${detail.value}`} className="text-slate-500">
                <span className="font-black uppercase tracking-wide text-slate-400">{detail.label}:</span>{' '}
                <span className="font-bold text-slate-700">{detail.value}</span>
              </p>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Bill To</p>
            <div className="mt-4 space-y-1.5">
              {data.clientName && <p className="text-sm font-black uppercase text-slate-950">{data.clientName}</p>}
              {data.clientAttention && (
                <p className="text-xs font-bold text-slate-700">
                  <span className="uppercase text-slate-400">Attention:</span> {data.clientAttention}
                </p>
              )}
              <div className="space-y-1 text-xs font-medium text-slate-600">
                {data.clientAddressLines.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
              {data.clientVatNumber && (
                <p className="pt-2 text-[11px] text-slate-500">
                  <span className="font-black uppercase tracking-wide text-slate-400">VAT No:</span>{' '}
                  <span className="font-bold text-slate-700">{data.clientVatNumber}</span>
                </p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Issue Date</p>
                <p className="mt-1 text-sm font-black text-slate-900">{data.issueDate || '—'}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Due Date</p>
                <p className="mt-1 text-sm font-black text-slate-900">{data.dueDate || '—'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Payment Reference</p>
                <p className="mt-1 text-sm font-black text-slate-900">{data.paymentReference || '—'}</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="mt-10 overflow-hidden rounded-2xl border border-slate-200">
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-left text-[10px] font-black uppercase tracking-[0.22em] text-white" style={{ backgroundColor: '#1E293B' }}>
              <th className="px-6 py-4">Description</th>
              <th className="px-4 py-4 text-center">{data.quantityLabel}</th>
              <th className="px-4 py-4 text-right">Unit Price</th>
              <th className="px-6 py-4 text-right">Line Total</th>
            </tr>
          </thead>
          <tbody>
            {data.lineItems.map((item, index) => (
              <tr key={`${item.description}-${index}`} className="border-t border-slate-100 align-top">
                <td className="px-6 py-4 text-xs font-semibold leading-6 text-slate-800 whitespace-pre-line">
                  {item.description || '—'}
                </td>
                <td className="px-4 py-4 text-center text-xs font-bold text-slate-500">
                  {item.quantity} {item.qtyType === 'hrs' ? 'hrs' : ''}
                </td>
                <td className="px-4 py-4 text-right text-xs font-bold text-slate-500">
                  R {formatInvoiceCurrency(item.unitPrice)}
                </td>
                <td className="px-6 py-4 text-right text-xs font-black text-slate-900">
                  R {formatInvoiceCurrency(item.lineTotal)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8 flex justify-end">
        <div className="w-[320px] space-y-3">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
            <span>Subtotal</span>
            <span>R {formatInvoiceCurrency(data.subtotal)}</span>
          </div>
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
            <span>VAT (15%)</span>
            <span>R {formatInvoiceCurrency(data.vatAmount)}</span>
          </div>
          <div className="flex items-end justify-between gap-6 border-t border-slate-200 pt-4">
            <span className="text-xs font-black uppercase tracking-[0.22em] text-slate-900">Total</span>
            <span className="text-2xl font-black tracking-tight" style={{ color: accentColor }}>
              R {formatInvoiceCurrency(data.total)}
            </span>
          </div>
          <div className="flex items-center justify-between border-t-2 border-slate-900 pt-4">
            <span className="text-xs font-black uppercase tracking-[0.22em] text-slate-900">Balance Due</span>
            <span className="text-sm font-black text-slate-900">
              R {formatInvoiceCurrency(data.balanceDue)}
            </span>
          </div>
        </div>
      </div>

      {data.bankDetails.length > 0 && (
        <section className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 px-6 py-6">
          <h2 className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-900">Please Make Payment To:</h2>
          <div className="mt-5 grid grid-cols-2 gap-x-10 gap-y-4">
            {data.bankDetails.map((detail) => (
              <div key={`${detail.label}-${detail.value}`}>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{detail.label}</p>
                <p className="mt-1 text-sm font-bold text-slate-800">{detail.value}</p>
              </div>
            ))}
          </div>
          {data.bankReference && (
            <div className="mt-5 border-t border-slate-200 pt-4">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Use Reference</p>
              <p className="mt-1 text-sm font-black text-slate-900">{data.bankReference}</p>
            </div>
          )}
        </section>
      )}

      {(data.notes || data.terms) && (
        <section className="mt-8 grid gap-4">
          {data.notes && (
            <div className="rounded-2xl border border-orange-100 bg-orange-50/60 px-5 py-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Notes</p>
              <p className="mt-2 text-xs leading-6 text-slate-700 whitespace-pre-line">{data.notes}</p>
            </div>
          )}
          {data.terms && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Terms</p>
              <p className="mt-2 text-xs leading-6 text-slate-700 whitespace-pre-line">{data.terms}</p>
            </div>
          )}
        </section>
      )}

      <footer className="mt-10 border-t border-slate-200 pt-6 text-center">
        {data.thankYouMessage && (
          <p className="text-sm font-medium italic text-slate-600">{data.thankYouMessage}</p>
        )}
        {data.footerLine && (
          <p className="mt-3 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{data.footerLine}</p>
        )}
        {data.paymentDueFooter && (
          <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">{data.paymentDueFooter}</p>
        )}
      </footer>
    </div>
  );
}
