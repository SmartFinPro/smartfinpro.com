// components/dashboard/backlink-import-button.tsx — Client wrapper for backlink import dialog
'use client';

import { useState } from 'react';
import { Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { BacklinkCsvImporter } from './backlink-csv-importer';

export function BacklinkImportButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-violet-200 hover:text-violet-700 transition-all shadow-sm"
      >
        <Upload className="h-4 w-4" />
        Import Backlinks
      </button>
      <BacklinkCsvImporter
        open={open}
        onOpenChange={setOpen}
        onImportComplete={() => router.refresh()}
      />
    </>
  );
}
