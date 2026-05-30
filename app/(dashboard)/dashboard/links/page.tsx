export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import { Link2, Plus } from 'lucide-react';
import { AffiliateCommandCenter } from '@/components/dashboard/affiliate-command-center';
import { CreateLinkDialog } from '@/components/dashboard/create-link-dialog';
import { getAffiliateLinksService } from '@/lib/actions/affiliate-links';
import { WidgetErrorBoundary } from '@/components/dashboard/widget-error-boundary';
import { PageHeader, ActionButton } from '@/components/dashboard/ui';

export default async function LinksPage() {
  const { data: links } = await getAffiliateLinksService();

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Link2}
        title="Affiliate Links"
        description="Manage cloaked affiliate links and CPA mapping"
        actions={
          <CreateLinkDialog>
            <ActionButton variant="primary" icon={Plus}>
              Add Link
            </ActionButton>
          </CreateLinkDialog>
        }
      />

      <WidgetErrorBoundary label="Affiliate Links" minHeight="h-[600px]">
        <Suspense
          fallback={
            <div className="h-[600px] animate-pulse bg-slate-100 rounded-lg" />
          }
        >
          <AffiliateCommandCenter initialLinks={links || []} />
        </Suspense>
      </WidgetErrorBoundary>
    </div>
  );
}
