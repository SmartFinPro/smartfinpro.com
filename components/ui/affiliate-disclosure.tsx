// components/ui/affiliate-disclosure.tsx
import { cn } from "@/lib/utils";
import { AlertCircle } from "lucide-react";

interface AffiliateDisclosureProps {
  market?: "us" | "uk" | "ca" | "au";
  className?: string;
  position?: "top" | "bottom";
  /** 'compact' renders a single short sentence + regulatory tag — for dense
   *  in-tool placements (e.g. Wealth Horizon's product row). Default 'full'
   *  is unchanged and stays what the Best-X cockpit routes render. */
  variant?: "full" | "compact" | "minimal";
}

/**
 * Affiliate Disclosure Component
 *
 * FTC/FCA/ASIC/CIRO compliant affiliate disclosure.
 * Must appear ABOVE THE FOLD on pages with affiliate links.
 *
 * Market-specific disclaimers:
 * - US: FTC guidelines
 * - UK: FCA Consumer Duty + CCI Regime
 * - AU: ASIC General Advice Warning
 * - CA: OSC/CIRO disclosure
 *
 * Usage:
 * <AffiliateDisclosure market="us" position="top" />
 */
export function AffiliateDisclosure({
  market = "us",
  className,
  position = "top",
  variant = "full",
}: AffiliateDisclosureProps) {
  const disclaimers = {
    us: {
      title: "Affiliate Disclosure",
      text: "SmartFinPro is reader-supported. When you click on affiliate links on this page and make a qualifying purchase, we may earn a commission at no additional cost to you. Our recommendations are based on independent research and testing. We may receive compensation from partners featured on this page, which may influence the products we review and where they appear. This does not affect our editorial independence or the integrity of our reviews.",
      regulatory: "FTC 16 CFR Part 255 compliant",
    },
    uk: {
      title: "Affiliate & FCA Disclosure",
      text: "SmartFinPro may earn commissions when you click on certain links and purchase financial products. This does not affect the price you pay. Our reviews are editorially independent and based on publicly available information and our own testing. Capital at risk with investment products.",
      regulatory:
        "FCA Consumer Duty compliant | CCI Regime: This is a marketing communication",
    },
    au: {
      title: "Affiliate & General Advice Warning",
      text: "SmartFinPro may receive commissions from financial product providers featured on this page. This is general information only and does not constitute personal financial advice. Before making any financial decisions, consider your personal circumstances and consult a licensed financial adviser. We do not guarantee product performance.",
      regulatory:
        "ASIC General Advice Warning | This information is not financial advice",
    },
    ca: {
      title: "Affiliate & CIRO Disclosure",
      text: "SmartFinPro may earn affiliate commissions when you sign up for products through our referral links. These partnerships do not influence our editorial reviews, which are based on independent research. For investment products, consult a licensed advisor before investing.",
      regulatory:
        "OSC/CIRO compliant | Investing involves risk, including loss of principal",
    },
  };

  const compactTexts: Record<string, { text: string; regulatory: string }> = {
    us: {
      text: "SmartFinPro is reader-supported — we may earn a commission when you open an account through links on this page, at no extra cost to you. This never affects our rankings.",
      regulatory: "FTC 16 CFR \u00a7255",
    },
    uk: {
      text: "We may earn a commission from links on this page at no extra cost to you. Editorially independent. Capital at risk with investment products.",
      regulatory: "FCA: marketing communication",
    },
    au: {
      text: "We may earn commissions from featured providers. General information only \u2014 not personal financial advice.",
      regulatory: "ASIC General Advice Warning",
    },
    ca: {
      text: "We may earn a commission from links on this page at no extra cost to you. Reviews remain editorially independent.",
      regulatory: "OSC/CIRO disclosure",
    },
  };

  const disclaimer = disclaimers[market];

  if (variant === "minimal") {
    // Whisper variant — no border, no fill, no icon. A quiet grey line for
    // dense rails where the disclosure must be present and legible (FTC
    // "clear and conspicuous" = not hidden, not micro-type) but must not
    // compete with the editorial content. Still real 11px slate text, never
    // greyed-into-invisibility.
    const c = compactTexts[market];
    return (
      <p
        className={cn("m-0 text-[11px] leading-snug text-sfp-slate", className)}
        role="note"
        aria-label="Affiliate disclosure"
      >
        {c.text}
      </p>
    );
  }

  if (variant === "compact") {
    const c = compactTexts[market];
    return (
      <div
        className={cn(
          "border-l-4 border-sfp-gold bg-amber-50 px-4 py-3 rounded-md",
          className
        )}
        role="note"
        aria-label="Affiliate disclosure"
      >
        <p className="m-0 text-xs text-sfp-slate leading-relaxed">
          <AlertCircle className="mr-1.5 inline size-3.5 text-sfp-gold align-[-2px]" />
          {c.text} <span className="italic font-medium whitespace-nowrap">{c.regulatory}</span>
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "border-l-4 border-sfp-gold bg-amber-50 p-4 rounded-md",
        position === "top" ? "mb-8" : "mt-8",
        className
      )}
      role="note"
      aria-label="Affiliate disclosure"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="size-5 text-sfp-gold shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-semibold text-sfp-ink text-sm mb-1">
            {disclaimer.title}
          </h4>
          <p className="text-xs text-sfp-slate leading-relaxed mb-2">
            {disclaimer.text}
          </p>
          <p className="text-xs text-sfp-slate italic font-medium">
            {disclaimer.regulatory}
          </p>
        </div>
      </div>
    </div>
  );
}
