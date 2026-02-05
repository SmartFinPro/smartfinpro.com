import { DollarSign, TrendingUp, Clock, CheckCircle, BarChart3, ArrowUpRight } from 'lucide-react';
import { getRevenueStats, getAffiliateLinksForMapping } from '@/lib/actions/revenue';
import { CSVImporter } from '@/components/dashboard/csv-importer';
import { RecentConversions } from '@/components/dashboard/recent-conversions';
import { RevenueChart } from '@/components/dashboard/revenue-chart';
import { AddConversionForm } from '@/components/dashboard/add-conversion-form';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Stat card icon colors - Canua style
const iconStyles = {
  revenue: 'bg-emerald-50 text-emerald-500',
  pending: 'bg-amber-50 text-amber-500',
  conversions: 'bg-blue-50 text-blue-500',
  average: 'bg-purple-50 text-purple-500',
};

export default async function RevenuePage() {
  const [stats, affiliateLinks] = await Promise.all([
    getRevenueStats(),
    getAffiliateLinksForMapping(),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Revenue Management</h1>
          <p className="text-slate-500 mt-1">
            Track commissions and import data from affiliate networks
          </p>
        </div>
        <AddConversionForm affiliateLinks={affiliateLinks} />
      </div>

      {/* Stats Grid - Canua Style */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Revenue */}
        <div className="dashboard-card p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Revenue</p>
              <p className="text-3xl font-semibold text-slate-800 mt-1">
                <span className="text-lg text-slate-400">$</span>
                {stats.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-slate-400 mt-2">approved commissions</p>
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconStyles.revenue}`}>
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Pending Revenue */}
        <div className="dashboard-card p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500">Pending Revenue</p>
              <p className="text-3xl font-semibold text-slate-800 mt-1">
                <span className="text-lg text-slate-400">$</span>
                {stats.pendingRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-slate-400 mt-2">awaiting approval</p>
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconStyles.pending}`}>
              <Clock className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Total Conversions */}
        <div className="dashboard-card p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Conversions</p>
              <p className="text-3xl font-semibold text-slate-800 mt-1">
                {stats.totalConversions}
              </p>
              <p className="text-sm text-slate-400 mt-2">all time</p>
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconStyles.conversions}`}>
              <CheckCircle className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Avg Commission */}
        <div className="dashboard-card p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500">Avg. Commission</p>
              <p className="text-3xl font-semibold text-slate-800 mt-1">
                <span className="text-lg text-slate-400">$</span>
                {stats.totalConversions > 0
                  ? (stats.approvedRevenue / Math.max(stats.totalConversions, 1)).toFixed(2)
                  : '0.00'}
              </p>
              <p className="text-sm text-slate-400 mt-2">per conversion</p>
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconStyles.average}`}>
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* CSV Importer */}
        <CSVImporter affiliateLinks={affiliateLinks} />

        {/* Revenue Chart */}
        <div className="dashboard-card overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-slate-400" />
            <h3 className="font-semibold text-slate-800">Monthly Revenue</h3>
          </div>
          <div className="p-6">
            <RevenueChart data={stats.conversionsByMonth} />
          </div>
        </div>
      </div>

      {/* Recent Conversions */}
      <div className="dashboard-card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <ArrowUpRight className="h-5 w-5 text-slate-400" />
          <h3 className="font-semibold text-slate-800">Recent Conversions</h3>
        </div>
        <div className="p-6">
          <RecentConversions conversions={stats.recentConversions} />
        </div>
      </div>
    </div>
  );
}
