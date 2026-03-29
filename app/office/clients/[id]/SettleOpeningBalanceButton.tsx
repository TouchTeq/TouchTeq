'use client';

import { useState } from 'react';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
        style: 'currency',
        currency: 'ZAR',
        minimumFractionDigits: 2,
    }).format(amount).replace('ZAR', 'R');
};

export default function SettleOpeningBalanceButton({
    clientId,
    openingBalance
}: {
    clientId: string;
    openingBalance: number;
}) {
    const [loading, setLoading] = useState(false);

    const handleSettle = async () => {
        if (!confirm(`Mark this opening balance of ${formatCurrency(openingBalance)} as settled? This cannot be undone.`)) {
            return;
        }

        setLoading(true);
        try {
            await fetch(`/api/clients/${clientId}/settle-opening-balance`, { method: 'POST' });
            window.location.reload();
        } catch (error) {
            console.error('Failed to settle opening balance:', error);
            alert('Failed to settle opening balance. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleSettle}
            disabled={loading}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-black uppercase tracking-widest rounded transition-all disabled:opacity-50"
        >
            {loading ? 'Settling...' : 'Mark as Settled'}
        </button>
    );
}