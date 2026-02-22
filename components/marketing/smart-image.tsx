import Image from 'next/image';

interface SmartImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  caption?: string;
  className?: string;
  aspect?: 'hero' | 'landscape' | 'square';
}

export function SmartImage({
  src,
  alt,
  width = 1200,
  height = 630,
  priority = false,
  caption,
  className = '',
  aspect = 'landscape',
}: SmartImageProps) {
  const aspectClasses = {
    hero: 'aspect-[21/9]',
    landscape: 'aspect-[16/9]',
    square: 'aspect-square',
  };

  return (
    <figure className={`relative overflow-hidden rounded-2xl border border-gray-200 ${className}`}>
      <div className={`relative w-full ${aspectClasses[aspect]} bg-gray-100`}>
        {/* Shimmer placeholder */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-200/50 to-transparent animate-pulse" />
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          priority={priority}
          className="object-cover w-full h-full transition-opacity duration-500"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
        />
      </div>
      {caption && (
        <figcaption className="px-4 py-2.5 text-xs text-center" style={{ background: 'var(--sfp-gray)', color: 'var(--sfp-slate)' }}>
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
