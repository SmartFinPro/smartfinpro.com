import Link from 'next/link';
import { TrackedAffiliateLink } from '@/components/marketing/tracked-affiliate-link';
import type { Category, Market } from '@/lib/i18n/config';
import { AFFILIATE_LINK_TEXT, BUTTON_COMPARE, BUTTON_VISIT } from './button-style';

export interface ReviewActionButtonsProps {
  productName: string;
  compareHref: string;
  compareLabel: string;
  affiliateUrl: string | null;
  market: Market;
  category: Category;
  layoutVariant: string;
  placement: string;
}

/** One implementation of the Review V2 Compare/Visit pair. */
export function ReviewActionButtons({
  productName,
  compareHref,
  compareLabel,
  affiliateUrl,
  market,
  category,
  layoutVariant,
  placement,
}: ReviewActionButtonsProps) {
  return (
    <div className="flex flex-col gap-2.5">
      <Link href={compareHref} className={`${BUTTON_COMPARE} block w-full`}>
        {compareLabel}
      </Link>
      {affiliateUrl && (
        <TrackedAffiliateLink
          href={affiliateUrl}
          className={`${BUTTON_VISIT} block w-full`}
          style={AFFILIATE_LINK_TEXT}
          eventLabel={`Visit ${productName}`}
          market={market}
          category={category}
          pageType="review"
          layoutVariant={layoutVariant}
          placement={placement}
        >
          Visit {productName}
        </TrackedAffiliateLink>
      )}
    </div>
  );
}
