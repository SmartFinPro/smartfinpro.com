import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowRight, Calendar, Clock, CheckCircle2 } from 'lucide-react';
import { StarRating } from './trust-badges';
import { CTABox } from './cta-box';
import { FAQSection } from './faq-section';
import { generateArticleSchema } from '@/lib/seo/schema';

interface PillarProduct {
  name: string;
  slug: string;
  description: string;
  rating: number;
  reviewCount: number;
  price: string;
  features: string[];
  affiliateUrl: string;
  isRecommended?: boolean;
}

interface PillarPageProps {
  title: string;
  description: string;
  category: string;
  market: string;
  products: PillarProduct[];
  sections: { id: string; title: string; content: string }[];
  faqs: { question: string; answer: string }[];
  publishDate: string;
  modifiedDate: string;
}

export function PillarTemplate({
  title,
  description,
  category,
  market,
  products,
  sections,
  faqs,
  publishDate,
  modifiedDate,
}: PillarPageProps) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://smartfinpro.com';
  const marketPrefix = `/${market}`;

  return (
    <article className="max-w-4xl mx-auto px-4 py-12">
      {/* Schema Markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            generateArticleSchema({
              title,
              description,
              publishDate,
              modifiedDate,
              author: 'SmartFinPro Team',
              url: `${baseUrl}${marketPrefix}/${category}`,
            })
          ),
        }}
      />

      {/* Hero Section */}
      <header className="mb-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href={marketPrefix || '/'} className="hover:text-primary">
            Home
          </Link>
          <span>/</span>
          <span className="text-foreground">
            {category.replace('-', ' ')}
          </span>
        </nav>

        <Badge variant="secondary" className="mb-4">
          Updated {new Date().getFullYear()}
        </Badge>

        <h1 className="font-bold leading-tight mb-4" style={{ fontSize: 'clamp(2.25rem, 5vw, 3rem)' }}>{title}</h1>

        <p className="text-xl text-muted-foreground mb-6">{description}</p>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>
              Last updated:{' '}
              {new Date(modifiedDate).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>15 min read</span>
          </div>
        </div>
      </header>

      {/* Quick Overview - Top Picks */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Our Top Picks</h2>
        <div className="space-y-4">
          {products.slice(0, 3).map((product, index) => (
            <Card
              key={product.slug}
              className={
                product.isRecommended ? 'border-primary border-2' : ''
              }
            >
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">#{index + 1}</Badge>
                      {product.isRecommended && (
                        <Badge variant="default">Editor&apos;s Choice</Badge>
                      )}
                    </div>
                    <h3 className="text-xl font-bold mb-1">{product.name}</h3>
                    <p className="text-muted-foreground text-sm mb-2">
                      {product.description}
                    </p>
                    <div className="flex items-center gap-2 mb-3">
                      <StarRating value={product.rating} size="sm" />
                      <span className="text-sm text-muted-foreground">
                        ({product.reviewCount} reviews)
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {product.features.slice(0, 3).map((feature) => (
                        <span
                          key={feature}
                          className="flex items-center gap-1 text-xs text-muted-foreground"
                        >
                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-right">
                      <div className="text-2xl font-bold">{product.price}</div>
                      <div className="text-sm text-muted-foreground">
                        per month
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`${marketPrefix}/${category}/${product.slug}`}>
                          Read Review
                        </Link>
                      </Button>
                      <Button asChild size="sm" className="gap-1">
                        <Link href={product.affiliateUrl}>
                          Try Free
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Table of Contents */}
      <Card className="mb-12">
        <CardHeader>
          <CardTitle>In This Guide</CardTitle>
        </CardHeader>
        <CardContent>
          <nav className="grid md:grid-cols-2 gap-2">
            {sections.map((section, i) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors p-2 rounded-lg hover:bg-muted"
              >
                <span className="text-sm">{i + 1}.</span>
                <span>{section.title}</span>
              </a>
            ))}
          </nav>
        </CardContent>
      </Card>

      {/* Main Content Sections */}
      <div className="prose prose-lg max-w-none mb-12">
        {sections.map((section) => (
          <section key={section.id} id={section.id} className="mb-12">
            <h2>{section.title}</h2>
            <div dangerouslySetInnerHTML={{ __html: section.content }} />
          </section>
        ))}
      </div>

      {/* All Products Grid */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Complete Comparison</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {products.map((product) => (
            <Card key={product.slug}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{product.name}</CardTitle>
                  <StarRating value={product.rating} size="sm" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {product.description}
                </p>
                <div className="text-lg font-bold mb-4">{product.price}/mo</div>
                <ul className="space-y-1 mb-4">
                  {product.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-2 text-sm"
                    >
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="flex gap-2">
                  <Button asChild variant="outline" size="sm" className="flex-1">
                    <Link href={`${marketPrefix}/${category}/${product.slug}`}>
                      Full Review
                    </Link>
                  </Button>
                  <Button asChild size="sm" className="flex-1">
                    <Link href={product.affiliateUrl}>Visit Site</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <FAQSection faqs={faqs} />

      {/* Final CTA */}
      <CTABox
        headline="Need Help Choosing?"
        description="Take our 2-minute quiz to find the perfect tool for your needs."
        primaryCta={{ text: 'Take the Quiz', href: '/tools/finder' }}
        secondaryCta={{ text: 'Contact Us', href: '/contact' }}
        variant="highlight"
      />

      {/* Disclaimer */}
      <Separator className="my-12" />
      <aside className="bg-muted/50 p-6 rounded-lg text-sm text-muted-foreground">
        <p>
          <strong>Affiliate Disclosure:</strong> SmartFinPro may earn a
          commission when you click links and make a purchase. This does not
          affect our editorial independence.{' '}
          <Link href="/affiliate-disclosure" className="underline">
            Learn more
          </Link>
          .
        </p>
      </aside>
    </article>
  );
}
