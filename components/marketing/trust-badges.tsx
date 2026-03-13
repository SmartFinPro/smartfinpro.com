'use client';

import { Star, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

interface TrustBadgesProps {
  rating?: number;
  reviewCount?: number;
  userCount?: number;
  featured?: string[];
}

export function TrustBadges({
  rating = 4.8,
  reviewCount = 2347,
  userCount,
  featured,
}: TrustBadgesProps) {
  return (
    <div className="flex flex-wrap gap-4 items-center py-4">
      {/* Star Rating */}
      <div className="flex items-center gap-2">
        <div className="flex">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`h-4 w-4 ${
                star <= Math.floor(rating)
                  ? 'text-yellow-400 fill-yellow-400'
                  : star <= rating
                    ? 'text-yellow-400 fill-yellow-400/50'
                    : 'text-gray-300'
              }`}
            />
          ))}
        </div>
        <span className="text-sm text-muted-foreground">
          {rating}/5 ({(reviewCount ?? 0).toLocaleString('en-US')} reviews)
        </span>
      </div>

      {/* User Count */}
      {userCount && (
        <Badge variant="outline" className="gap-1">
          <Users className="w-4 h-4" />
          {userCount.toLocaleString('en-US')}+ active users
        </Badge>
      )}

      {/* Featured In */}
      {featured && featured.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">As seen in:</span>
          <div className="flex items-center gap-3">
            {featured.map((logo) => (
              <Image
                key={logo}
                src={`/logos/${logo}.svg`}
                alt={logo}
                width={60}
                height={20}
                className="h-5 w-auto opacity-60 grayscale"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface StarRatingProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
}

export function StarRating({ value, max = 5, size = 'md' }: StarRatingProps) {
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <div className="flex">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={`${sizeClasses[size]} ${
            i < Math.floor(value)
              ? 'text-yellow-400 fill-yellow-400'
              : i < value
                ? 'text-yellow-400 fill-yellow-400/50'
                : 'text-gray-300'
          }`}
        />
      ))}
    </div>
  );
}
