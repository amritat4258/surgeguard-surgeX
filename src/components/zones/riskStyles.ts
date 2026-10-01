import type { RiskLevel } from '@/types';

export interface RiskStyle {
  label: string;
  /** colored text */
  text: string;
  /** pill/badge: background + text + border */
  badge: string;
  /** card border */
  border: string;
  /** filled progress bar */
  bar: string;
  /** small status dot */
  dot: string;
  /** extra card glow (only critical has one) */
  glow: string;
}

// Full class names are written out on purpose: Tailwind only keeps
// classes it can find as complete strings in the source.
export const riskStyles: Record<RiskLevel, RiskStyle> = {
  normal: {
    label: 'NORMAL',
    text: 'text-risk-normal',
    badge: 'bg-risk-normal/15 text-risk-normal border-risk-normal/40',
    border: 'border-surface-border',
    bar: 'bg-risk-normal',
    dot: 'bg-risk-normal',
    glow: '',
  },
  warning: {
    label: 'WARNING',
    text: 'text-risk-warning',
    badge: 'bg-risk-warning/15 text-risk-warning border-risk-warning/40',
    border: 'border-risk-warning/40',
    bar: 'bg-risk-warning',
    dot: 'bg-risk-warning',
    glow: '',
  },
  high: {
    label: 'HIGH',
    text: 'text-risk-high',
    badge: 'bg-risk-high/15 text-risk-high border-risk-high/40',
    border: 'border-risk-high/50',
    bar: 'bg-risk-high',
    dot: 'bg-risk-high',
    glow: '',
  },
  critical: {
    label: 'CRITICAL',
    text: 'text-risk-critical',
    badge: 'bg-risk-critical/15 text-risk-critical border-risk-critical/50',
    border: 'border-risk-critical/60',
    bar: 'bg-risk-critical',
    dot: 'bg-risk-critical animate-pulse-slow',
    glow: 'shadow-critical-glow',
  },
};