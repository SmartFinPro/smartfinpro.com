import { AffiliateDisclosure } from '@/components/ui/affiliate-disclosure';
import { RiskWarningBox } from '@/components/marketing/risk-warning';
import type { Category, Market } from '@/lib/i18n/config';
import { ReviewActionButtons } from './review-action-buttons';

export interface ReviewMobileActionsProps {
  productName: string;
  compareHref: string;
  compareLabel: string;
  affiliateUrl: string | null;
  market: Market;
  category: Category;
  hasLeverageRisk?: boolean;
}

/**
 * Compact in-verdict action surface for viewports without the desktop rail.
 * It deliberately omits the provider card and Market Check: both delay or
 * repeat the decision signals already present in the opening.
 */
export function ReviewMobileActions({
  productName,
  compareHref,
  compareLabel,
  affiliateUrl,
  market,
  category,
  hasLeverageRisk,
}: ReviewMobileActionsProps) {
  return (
    <div
      data-review-mobile-actions
      className="lg:hidden"
      style={{
        marginTop: '22px',
        paddingTop: '20px',
        borderTop: '1px solid var(--sfp-hairline-row)',
        fontFamily: 'var(--font-primary)',
      }}
    >
      <ReviewActionButtons
        productName={productName}
        compareHref={compareHref}
        compareLabel={compareLabel}
        affiliateUrl={affiliateUrl}
        market={market}
        category={category}
        layoutVariant="v2_mobile"
        placement="verdict"
      />

      {affiliateUrl && (
        <div className="flex flex-col gap-1.5 pt-3">
          <AffiliateDisclosure market={market} variant="minimal" />
          {hasLeverageRisk ? (
            <RiskWarningBox variant="compact" market={market} />
          ) : (
            <p className="m-0 text-[11px] leading-snug text-sfp-slate">
              Investing involves risk, including possible loss of principal.
              Options and crypto carry additional risk.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
