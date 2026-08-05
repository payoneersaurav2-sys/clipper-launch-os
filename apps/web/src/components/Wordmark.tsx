import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface WordmarkProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  href?: string;
  as?: 'link' | 'div';
}

const sizeMap = {
  sm: 'text-[14px]',
  md: 'text-[15px]',
  lg: 'text-[20px]',
};

function WordmarkInner({ size = 'md', className }: { size?: WordmarkProps['size']; className?: string }) {
  return (
    <span
      className={cn(
        'font-semibold tracking-[-0.04em] leading-none select-none',
        sizeMap[size],
        className
      )}
      style={{ fontFeatureSettings: '"kern" 1, "liga" 1' }}
    >
      <span className="text-[#FAFAFA]">Creator</span>
      <span className="text-primary"> OS</span>
    </span>
  );
}

export default function Wordmark({ className, size = 'md', href = '/', as = 'link' }: WordmarkProps) {
  if (as === 'div') {
    return <WordmarkInner size={size} className={className} />;
  }
  return (
    <Link to={href} className="flex items-center">
      <WordmarkInner size={size} className={className} />
    </Link>
  );
}
