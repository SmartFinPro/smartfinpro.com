'use client';

import Link from 'next/link';
import {
  AlertTriangle,
  ExternalLink,
  Inbox,
  Loader2,
  RefreshCw,
  Settings,
  type LucideIcon,
} from 'lucide-react';

interface WidgetLoadingProps {
  label?: string;
  minHeight?: string;
}

export function WidgetLoading({ label = 'Lädt…', minHeight }: WidgetLoadingProps) {
  return (
    <div
      className={`dashboard-card p-12 flex items-center justify-center ${minHeight ?? ''}`.trim()}
    >
      <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      <span className="ml-3 text-slate-500">{label}</span>
    </div>
  );
}

interface WidgetEmptyAction {
  label: string;
  href: string;
  external?: boolean;
}

interface WidgetEmptyProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: WidgetEmptyAction;
}

export function WidgetEmpty({
  title,
  description,
  icon: Icon = Inbox,
  action,
}: WidgetEmptyProps) {
  return (
    <div className="dashboard-card p-8">
      <div className="flex items-start gap-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ background: 'var(--sfp-sky)' }}
        >
          <Icon className="h-6 w-6" style={{ color: 'var(--sfp-navy)' }} />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-slate-800 text-lg">{title}</h3>
          {description && (
            <p className="text-slate-500 mt-1 text-sm">{description}</p>
          )}
          {action &&
            (action.external ? (
              <a
                href={action.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-4 text-sm font-medium px-4 py-2 rounded-lg"
                style={{ background: 'var(--sfp-sky)', color: 'var(--sfp-navy)' }}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                {action.label}
              </a>
            ) : (
              <Link
                href={action.href}
                className="inline-flex items-center gap-1.5 mt-4 text-sm font-medium px-4 py-2 rounded-lg"
                style={{ background: 'var(--sfp-sky)', color: 'var(--sfp-navy)' }}
              >
                {action.label}
              </Link>
            ))}
        </div>
      </div>
    </div>
  );
}

interface WidgetErrorProps {
  message: string;
  label?: string;
  onRetry?: () => void;
}

export function WidgetError({ message, label = 'Fehler', onRetry }: WidgetErrorProps) {
  return (
    <div className="dashboard-card p-6">
      <div className="flex items-center gap-3 text-amber-600">
        <AlertTriangle className="h-5 w-5" />
        <span className="font-medium">{label}:</span>
        <span className="text-sm text-slate-500">{message}</span>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-3 text-sm flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
          style={{ background: 'var(--sfp-sky)', color: 'var(--sfp-navy)' }}
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Erneut versuchen
        </button>
      )}
    </div>
  );
}

interface WidgetNotConfiguredProps {
  title: string;
  description?: string;
  envVars?: Array<{ name: string; description: string }>;
  testUrl?: string;
  testLabel?: string;
}

export function WidgetNotConfigured({
  title,
  description,
  envVars,
  testUrl,
  testLabel = 'Verbindung testen',
}: WidgetNotConfiguredProps) {
  return (
    <div className="dashboard-card p-8">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-amber-50">
          <Settings className="h-6 w-6 text-amber-500" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-slate-800 text-lg">{title}</h3>
          {description && (
            <p className="text-slate-500 mt-1 text-sm">{description}</p>
          )}
          {envVars && envVars.length > 0 && (
            <div className="mt-4 space-y-2 text-sm text-slate-600">
              <p>Benötigte Umgebungsvariablen:</p>
              <ul className="list-disc list-inside space-y-1 text-xs text-slate-500">
                {envVars.map((env) => (
                  <li key={env.name}>
                    <code className="bg-slate-100 px-1 rounded">{env.name}</code> — {env.description}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {testUrl && (
            <a
              href={testUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-4 text-sm font-medium px-4 py-2 rounded-lg"
              style={{ background: 'var(--sfp-sky)', color: 'var(--sfp-navy)' }}
            >
              <ExternalLink className="h-3.5 w-3.5" />
              {testLabel}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
