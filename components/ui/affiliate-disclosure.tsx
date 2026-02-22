// components/ui/affiliate-disclosure.tsx
import { cn } from "@/lib/utils";
import { AlertCircle } from "lucide-react";

interface AffiliateDisclosureProps {
  market?: "us" | "uk" | "ca" | "au";
  className?: string;
  position?: "top" | "bottom";
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

  const disclaimer = disclaimers[market];

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
