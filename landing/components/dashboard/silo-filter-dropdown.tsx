'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

const SILOS = [
  { value: 'all', label: 'All Markets' },
  { value: 'us-credit-repair', label: 'US - Credit Repair' },
  { value: 'us-debt-relief', label: 'US - Debt Relief' },
  { value: 'uk-remortgage', label: 'UK - Remortgage' },
  { value: 'uk-cost-of-living', label: 'UK - Cost of Living' },
  { value: 'au-superannuation', label: 'AU - Superannuation' },
  { value: 'au-gold-investing', label: 'AU - Gold Investing' },
  { value: 'ca-tax-investing', label: 'CA - Tax Investing' },
  { value: 'ca-housing', label: 'CA - Housing' },
];

export function SiloFilterDropdown({ currentSilo }: { currentSilo: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLabel = SILOS.find((s) => s.value === currentSilo)?.label || 'All Markets';

  const handleSiloChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'all') {
      params.delete('silo');
    } else {
      params.set('silo', value);
    }
    router.push(`/dashboard/analytics?${params.toString()}`);
    setIsOpen(false);
  };

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
      >
        <svg
          className="h-4 w-4 text-slate-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3.5 6h17m-4 6h-9m-4 6h13"
          />
        </svg>
        <span className="truncate max-w-xs">{currentLabel}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-xl z-50">
          <div className="py-1">
            {SILOS.map((silo) => (
              <button
                key={silo.value}
                onClick={() => handleSiloChange(silo.value)}
                className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                  currentSilo === silo.value
                    ? 'bg-slate-100 text-slate-900 font-medium'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {silo.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
