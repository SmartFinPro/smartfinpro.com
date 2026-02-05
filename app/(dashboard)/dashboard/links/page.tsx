import { Suspense } from 'react';
import { Plus, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LinkTable } from '@/components/dashboard/link-table';
import { CreateLinkDialog } from '@/components/dashboard/create-link-dialog';

export default function LinksPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Affiliate Links</h1>
          <p className="text-slate-500 mt-1">
            Manage your affiliate links and track their performance.
          </p>
        </div>
        <CreateLinkDialog>
          <Button className="gap-2 bg-emerald-500 hover:bg-emerald-600 text-white">
            <Plus className="h-4 w-4" />
            Add Link
          </Button>
        </CreateLinkDialog>
      </div>

      <div className="dashboard-card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <Link2 className="h-5 w-5 text-slate-400" />
          <h3 className="font-semibold text-slate-800">All Links</h3>
        </div>
        <div className="p-6">
          <Suspense
            fallback={
              <div className="h-[400px] animate-pulse bg-slate-100 rounded-lg" />
            }
          >
            <LinkTable />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
