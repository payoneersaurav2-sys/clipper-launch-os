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
  sm: { fontSize: '13px', letterSpacing: '0.02em' },
  md: { fontSize: '15px', letterSpacing: '0.02em' },
  lg: { fontSize: '20px', letterSpacing: '0.025em' },
};

function WordmarkInner({ size = 'md', className }: { size?: WordmarkProps['size']; className?: string }) {
  const { fontSize, letterSpacing } = sizeMap[size];
  return (
    <span
      className={cn('leading-none select-none', className)}
      style={{
        fontFamily: '"Orbitron", sans-serif',
        fontWeight: 800,
        fontSize,
        letterSpacing,
        lineHeight: 1,
      }}
    >
      <span style={{ color: '#FAFAFA' }}>CREATOR</span>
      <span style={{ color: '#7C3AED' }}> OS</span>
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

