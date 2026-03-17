export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AffiliateCommandCenter } from '@/components/dashboard/affiliate-command-center';
import { CreateLinkDialog } from '@/components/dashboard/create-link-dialog';
import { getAffiliateLinksService } from '@/lib/actions/affiliate-links';

export default async function LinksPage() {
  const { data: links } = await getAffiliateLinksService();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <CreateLinkDialog>
          <Button className="gap-2 !bg-violet-600 hover:!bg-violet-700 !text-white">
            <Plus className="h-4 w-4" />
            Add Link
          </Button>
        </CreateLinkDialog>
      </div>

      <Suspense
        fallback={
          <div className="h-[600px] animate-pulse bg-slate-100 rounded-lg" />
        }
      >
        <AffiliateCommandCenter initialLinks={links || []} />
      </Suspense>
    </div>
  );
}
