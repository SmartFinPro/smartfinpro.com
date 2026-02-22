import { Shield } from 'lucide-react';
import { getLinkDistribution } from '@/lib/actions/compliance-audit';
import { ComplianceAudit } from '@/components/dashboard/compliance-audit';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ComplianceAuditPage() {
  const linkDistribution = await getLinkDistribution();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Shield className="h-6 w-6 text-violet-500" />
          Compliance Audit
        </h1>
        <p className="text-slate-500 mt-1">
          Regional disclaimer matrix &amp; affiliate link compliance scanner
        </p>
      </div>

      {/* Compliance Audit Component */}
      <ComplianceAudit linkDistribution={linkDistribution} />
    </div>
  );
}
