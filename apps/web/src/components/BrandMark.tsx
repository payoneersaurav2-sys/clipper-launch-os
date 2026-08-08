import { cn } from '@/lib/utils';

type BrandMarkProps = {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
};

const sizeMap = { sm: 'h-8 w-8', md: 'h-12 w-12', lg: 'h-16 w-16' };

export default function BrandMark({ className, size = 'md' }: BrandMarkProps) {
  return <img src="/brand/creator-os-mark-transparent.png" alt="Creator OS" className={cn('block rounded-[14px] object-cover', sizeMap[size], className)} />;
}
