import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface WordmarkProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  href?: string;
  as?: 'link' | 'div';
}

const sizeMap = {
  sm: 'w-[98px] sm:w-[108px]',
  md: 'w-[132px] sm:w-[144px]',
  lg: 'w-[188px] sm:w-[212px]',
};

function WordmarkImage({ size = 'md', className }: Pick<WordmarkProps, 'size' | 'className'>) {
  return <img src="/brand/creator-os-wordmark-transparent.png" alt="Creator OS" width={1135} height={220} className={cn('block h-auto select-none', sizeMap[size], className)} />;
}

export default function Wordmark({ className, size = 'md', href = '/', as = 'link' }: WordmarkProps) {
  if (as === 'div') return <WordmarkImage size={size} className={className} />;

  return (
    <Link to={href} className="flex items-center" aria-label="Creator OS home">
      <WordmarkImage size={size} className={className} />
    </Link>
  );
}
