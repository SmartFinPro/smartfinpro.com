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
    <div
      className={`glass-card my-10 p-8 rounded-2xl ${
        variant === 'highlight'
          ? 'border-emerald-500/40 shadow-lg shadow-emerald-500/10'
          : variant === 'minimal'
          ? 'border-slate-700/50'
          : ''
      }`}
    >
      <div className="flex items-start gap-5">
        {/* Expert Avatar */}
        <div className="shrink-0">
          {image ? (
            <Image
              src={image}
              alt={name}
              width={72}
              height={72}
              className="rounded-full border-2 border-emerald-500/50"
            />
          ) : (
            <div className="w-[72px] h-[72px] rounded-full bg-gradient-to-br from-emerald-500/20 to-blue-500/20 flex items-center justify-center border border-emerald-500/30">
              <Award className="h-9 w-9 text-emerald-400" />
            </div>
          )}
        </div>

        {/* Expert Info */}
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap mb-2">
            <h4 className="font-bold text-xl text-white">{name}</h4>
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
              <Shield className="h-3 w-3 mr-1" />
              Verified Expert
            </Badge>
          </div>
          <p className="text-slate-400 mb-4">{title}</p>
          <div className="flex flex-wrap gap-2">
            {credentials.map((cred) => (
              <span
                key={cred}
                className="inline-flex items-center gap-1.5 text-xs bg-slate-800/50 text-slate-300 px-3 py-1.5 rounded-full border border-slate-700/50"
              >
                <CheckCircle className="h-3 w-3 text-emerald-400" />
                {cred}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Quote */}
      <blockquote className="relative pl-5 border-l-4 border-emerald-500/50 mt-6">
        <Quote className="absolute -left-4 -top-2 h-7 w-7 text-emerald-500/30 bg-slate-900 rounded" />
        <p className="italic text-slate-300 text-lg leading-relaxed">&ldquo;{quote}&rdquo;</p>
        {rating && (
          <div className="flex items-center gap-3 mt-4">
            <span className="text-sm font-medium text-slate-400">Expert Rating:</span>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-5 w-5 ${
                    i < Math.floor(rating)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-slate-700'
                  }`}
                />
              ))}
              <span className="text-lg font-bold gradient-text ml-2">{rating}/5</span>
            </div>
          </div>
        )}
      </blockquote>
    </div>
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
    <div className="glass-card flex items-center gap-4 p-5 rounded-xl border-emerald-500/30 my-6 hover:border-emerald-500/50 transition-all">
      <div className="shrink-0">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500/20 to-blue-500/20 flex items-center justify-center border border-emerald-500/30">
          <CheckCircle className="h-6 w-6 text-emerald-400" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-base font-semibold text-white">
          {name} <span className="text-slate-400 font-normal">({title})</span>
        </p>
        <p className="text-sm text-emerald-300/80 italic mt-1">&ldquo;{verdict}&rdquo;</p>
      </div>
      <div className="shrink-0 text-right">
        <div className="text-2xl font-bold gradient-text">{rating}/5</div>
        <div className="text-xs text-slate-500">Expert Score</div>
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
    <div className="glass-card grid grid-cols-2 md:grid-cols-4 gap-6 my-10 p-8 rounded-2xl">
      {stats.map((stat) => (
        <div key={stat.label} className="text-center group">
          {stat.icon && (
            <div className="flex justify-center mb-3">
              <div className="w-12 h-12 rounded-xl bg-slate-800/50 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                {stat.icon}
              </div>
            </div>
          )}
          <div className="text-3xl md:text-4xl font-bold gradient-text mb-1">{stat.value}</div>
          <div className="text-sm text-slate-400">{stat.label}</div>
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
    <div className="glass-card my-10 p-8 rounded-2xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
          <Shield className="h-5 w-5 text-blue-400" />
        </div>
        <h4 className="font-bold text-xl text-white">{title}</h4>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <div className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
          <div className="text-3xl font-bold gradient-text">{hoursResearch}+</div>
          <div className="text-sm text-slate-400">Hours of Research</div>
        </div>
        <div className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
          <div className="text-3xl font-bold gradient-text">{dataPoints.toLocaleString('en-US')}+</div>
          <div className="text-sm text-slate-400">Data Points Analyzed</div>
        </div>
      </div>

      <ol className="space-y-4">
        {steps.map((step, index) => (
          <li key={index} className="flex items-start gap-4">
            <span className="shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 text-white flex items-center justify-center text-sm font-bold shadow-lg shadow-emerald-500/25">
              {index + 1}
            </span>
            <span className="text-slate-300 pt-1">{step}</span>
          </li>
        ))}
        </ol>
      </div>
  );
}
