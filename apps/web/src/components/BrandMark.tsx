import { cn } from '@/lib/utils';

type BrandMarkProps = {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
};

const sizeMap = { sm: 'h-8 w-8', md: 'h-12 w-12', lg: 'h-16 w-16' };

export default function BrandMark({ className, size = 'md' }: BrandMarkProps) {
  return <img src="/brand/creator-os-mark-128-v1.webp" alt="Creator OS - AI Content Workspace" width={128} height={97} className={cn('block rounded-[14px] object-cover', sizeMap[size], className)} />;
}
