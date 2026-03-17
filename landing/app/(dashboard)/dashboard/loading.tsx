export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header skeleton */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="h-8 w-40 bg-slate-200 rounded animate-pulse" />
            <div className="h-4 w-56 bg-slate-100 rounded animate-pulse mt-2" />
          </div>
          <div className="h-10 w-32 bg-slate-200 rounded animate-pulse" />
        </div>

        {/* Stats grid skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
              <div className="h-4 w-20 bg-slate-100 rounded animate-pulse mb-3" />
              <div className="h-9 w-28 bg-slate-200 rounded animate-pulse mb-2" />
              <div className="h-3 w-24 bg-slate-100 rounded animate-pulse" />
            </div>
          ))}
        </div>

        {/* Chart skeleton */}
        <div className="grid gap-6 lg:grid-cols-3 mb-8">
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm lg:col-span-2">
            <div className="px-6 py-4 border-b border-slate-100">
              <div className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
            </div>
            <div className="p-6">
              <div className="h-52 bg-slate-100 rounded animate-pulse" />
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100">
              <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
            </div>
            <div className="p-6">
              <div className="h-52 bg-slate-100 rounded animate-pulse" />
            </div>
          </div>
        </div>

        {/* Bottom grid skeleton */}
        <div className="grid gap-6 lg:grid-cols-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-slate-100">
                <div className="h-4 w-20 bg-slate-200 rounded animate-pulse" />
              </div>
              <div className="p-6">
                <div className="h-40 bg-slate-100 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
