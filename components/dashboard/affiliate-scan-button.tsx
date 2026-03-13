'use client';

import { useState } from 'react';
import { Search, Loader2, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

export function AffiliateScanButton() {
  const [scanning, setScanning] = useState(false);

  const handleScan = async () => {
    setScanning(true);
    try {
      const res = await fetch('/api/dashboard/affiliate-scan', { method: 'POST' });
      const result = await res.json();

      if (result.plans.length > 0) {
        toast.success(
          `${result.plans.length} neue High-CPA ${result.plans.length === 1 ? 'Chance' : 'Chancen'} gefunden!`,
          { description: result.plans.map((p) => p.keyword).join(', ') },
        );
        // Reload to show new cards
        window.location.reload();
      } else {
        toast('Keine neuen Chancen', {
          description: result.error || 'Alle High-CPA Partner sind bereits abgedeckt.',
        });
      }
    } catch {
      toast.error('Scan fehlgeschlagen');
    } finally {
      setScanning(false);
    }
  };

  return (
    <button
      onClick={handleScan}
      disabled={scanning}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all
                 text-emerald-700 bg-emerald-50 border border-emerald-200
                 hover:bg-emerald-100 hover:border-emerald-300
                 disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {scanning ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <DollarSign className="h-3.5 w-3.5" />
      )}
      {scanning ? 'Scanne...' : 'Affiliate Opportunities'}
      {!scanning && <Search className="h-3 w-3 text-emerald-500" />}
    </button>
  );
}
