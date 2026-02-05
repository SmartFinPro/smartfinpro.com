import { AlertTriangle } from 'lucide-react';

interface RiskWarningBoxProps {
  variant?: 'prominent' | 'compact';
  lossPercentage?: string;
  market?: 'us' | 'uk' | 'ca' | 'au';
}

const marketWarnings: Record<string, { title: string; text: (loss: string) => string }> = {
  us: {
    title: 'Risk Warning',
    text: () =>
      'Forex trading involves significant risk of loss and is not suitable for all investors. High leverage can work against you as well as for you. Before deciding to trade forex, you should carefully consider your investment objectives, level of experience, and risk appetite. Past performance is not indicative of future results.',
  },
  uk: {
    title: 'Risk Warning',
    text: (loss) =>
      `CFDs are complex instruments and come with a high risk of losing money rapidly due to leverage. ${loss} of retail investor accounts lose money when trading CFDs. You should consider whether you understand how CFDs work and whether you can afford to take the high risk of losing your money.`,
  },
  ca: {
    title: 'Risk Warning',
    text: () =>
      'Forex and CFD trading involves significant risk of loss. Leveraged products can result in losses exceeding your initial deposit. You should carefully consider whether trading is appropriate for you in light of your financial situation. CIRO (Canadian Investment Regulatory Organization) regulates investment dealers and trading activity in Canada.',
  },
  au: {
    title: 'Risk Warning',
    text: (loss) =>
      `CFDs are complex instruments and come with a high risk of losing money rapidly due to leverage. ${loss} of retail investor accounts lose money when trading CFDs with this provider. You should consider whether you understand how CFDs work and whether you can afford to take the high risk of losing your money. ASIC requires this risk warning for all CFD providers.`,
  },
};

export function RiskWarningBox({
  variant = 'prominent',
  lossPercentage = '74-89%',
  market,
}: RiskWarningBoxProps) {
  const warning = market ? marketWarnings[market] : marketWarnings.uk;
  const text = warning.text(lossPercentage);

  if (variant === 'compact') {
    return (
      <div className="not-prose my-6 rounded-lg border border-red-500/20 bg-red-950/10 px-4 py-3">
        <p className="text-[11px] leading-relaxed text-slate-400">
          <span className="font-semibold text-red-400/80">{warning.title}:</span>{' '}
          {text}
        </p>
      </div>
    );
  }

  return (
    <div className="not-prose my-8 rounded-xl border border-red-500/25 bg-gradient-to-r from-red-950/20 via-red-950/10 to-transparent p-5">
      <div className="flex gap-3">
        <div className="shrink-0 mt-0.5">
          <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
            <AlertTriangle className="h-4 w-4 text-red-400" />
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-red-400 mb-1.5">{warning.title}</h4>
          <p className="text-xs leading-relaxed text-slate-400">
            {text}
          </p>
        </div>
      </div>
    </div>
  );
}
