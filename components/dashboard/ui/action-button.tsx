// components/dashboard/ui/action-button.tsx
import type { LucideIcon } from 'lucide-react';
import { Button, type buttonVariants } from '@/components/ui/button';
import type { VariantProps } from 'class-variance-authority';

type ButtonSize = VariantProps<typeof buttonVariants>['size'];

export interface ActionButtonProps
  extends Omit<React.ComponentProps<typeof Button>, 'variant'> {
  /** Semantic dashboard intent. */
  variant?: 'primary' | 'cta' | 'success' | 'secondary' | 'danger';
  size?: ButtonSize;
  icon?: LucideIcon;
}

const VARIANT_MAP: Record<
  NonNullable<ActionButtonProps['variant']>,
  React.ComponentProps<typeof Button>['variant']
> = {
  primary: 'default', // navy in dashboard via --primary override
  cta: 'gold',
  success: 'green',
  secondary: 'outline',
  danger: 'destructive',
};

export function ActionButton({
  variant = 'primary',
  icon: Icon,
  children,
  ...props
}: ActionButtonProps) {
  return (
    <Button variant={VARIANT_MAP[variant]} {...props}>
      {Icon && <Icon className="h-4 w-4" />}
      {children}
    </Button>
  );
}
