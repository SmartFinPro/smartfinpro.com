'use client';

import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Quote, Award, CheckCircle, Shield, Star } from 'lucide-react';

interface ExpertBoxProps {
  name: string;
  title: string;
  credentials: string[];
  image?: string;
  quote: string;
  rating?: number;
  variant?: 'default' | 'highlight' | 'minimal';
}

export function ExpertBox({
  name,
  title,
  credentials,
  image,
  quote,
  rating,
  variant = 'default',
}: ExpertBoxProps) {
  return (
    <Card
      className={`my-8 ${
        variant === 'highlight'
          ? 'border-primary bg-primary/5'
          : variant === 'minimal'
          ? 'border-muted'
          : 'border-2'
      }`}
    >
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {/* Expert Avatar */}
          <div className="shrink-0">
            {image ? (
              <Image
                src={image}
                alt={name}
                width={64}
                height={64}
                className="rounded-full border-2 border-primary"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Award className="h-8 w-8 text-primary" />
              </div>
            )}
          </div>

          {/* Expert Info */}
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h4 className="font-bold text-lg">{name}</h4>
              <Badge variant="secondary" className="text-xs">
                <Shield className="h-3 w-3 mr-1" />
                Verified Expert
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-2">{title}</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {credentials.map((cred) => (
                <span
                  key={cred}
                  className="inline-flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded"
                >
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  {cred}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Quote */}
        <blockquote className="relative pl-4 border-l-4 border-primary mt-4">
          <Quote className="absolute -left-3 -top-2 h-6 w-6 text-primary/30 bg-background" />
          <p className="italic text-muted-foreground">{quote}</p>
          {rating && (
            <div className="flex items-center gap-2 mt-3">
              <span className="text-sm font-medium">Expert Rating:</span>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < Math.floor(rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
                <span className="text-sm font-bold ml-1">{rating}/5</span>
              </div>
            </div>
          )}
        </blockquote>
      </CardContent>
    </Card>
  );
}

// Compact expert endorsement for inline use
interface ExpertEndorsementProps {
  name: string;
  title: string;
  verdict: string;
  rating: number;
}

export function ExpertEndorsement({ name, title, verdict, rating }: ExpertEndorsementProps) {
  return (
    <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900 my-4">
      <div className="shrink-0">
        <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
          <CheckCircle className="h-5 w-5 text-green-600" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {name} <span className="text-muted-foreground font-normal">({title})</span>
        </p>
        <p className="text-sm text-muted-foreground">{verdict}</p>
      </div>
      <div className="shrink-0 text-right">
        <div className="text-xl font-bold text-green-600">{rating}/5</div>
        <div className="text-xs text-muted-foreground">Expert Score</div>
      </div>
    </div>
  );
}

// Trust Authority Section
interface TrustAuthorityProps {
  stats: {
    label: string;
    value: string;
    icon?: React.ReactNode;
  }[];
}

export function TrustAuthority({ stats }: TrustAuthorityProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-8 p-6 bg-muted/30 rounded-xl border">
      {stats.map((stat) => (
        <div key={stat.label} className="text-center">
          {stat.icon && <div className="flex justify-center mb-2">{stat.icon}</div>}
          <div className="text-2xl md:text-3xl font-bold text-primary">{stat.value}</div>
          <div className="text-xs text-muted-foreground">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}

// Methodology Box for transparency
interface MethodologyBoxProps {
  title?: string;
  steps: string[];
  dataPoints?: number;
  hoursResearch?: number;
}

export function MethodologyBox({
  title = 'How We Test & Review',
  steps,
  dataPoints = 50,
  hoursResearch = 100,
}: MethodologyBoxProps) {
  return (
    <Card className="my-8 bg-muted/30">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-5 w-5 text-primary" />
          <h4 className="font-bold text-lg">{title}</h4>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-3 p-3 bg-background rounded-lg">
            <div className="text-2xl font-bold text-primary">{hoursResearch}+</div>
            <div className="text-sm text-muted-foreground">Hours of Research</div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-background rounded-lg">
            <div className="text-2xl font-bold text-primary">{dataPoints}+</div>
            <div className="text-sm text-muted-foreground">Data Points Analyzed</div>
          </div>
        </div>

        <ol className="space-y-2">
          {steps.map((step, index) => (
            <li key={index} className="flex items-start gap-3 text-sm">
              <span className="shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                {index + 1}
              </span>
              <span className="text-muted-foreground">{step}</span>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
