// ============================================================
// CREATOR OS — AI OUTPUT PANEL
// Streaming output display with cancel, copy, regenerate.
// ============================================================

import React, { useRef, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Copy, RotateCcw, Square, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AIOutputPanelProps {
  isGenerating: boolean;
  isStreaming: boolean;
  streamedText: string;
  content?: string;
  error?: string | null;
  onCancel?: () => void;
  onRegenerate?: () => void;
  onCopy?: () => void;
  className?: string;
  label?: string;
}

export default function AIOutputPanel({
  isGenerating,
  isStreaming,
  streamedText,
  content,
  error,
  onCancel,
  onRegenerate,
  className,
  label = 'AI Output',
}: AIOutputPanelProps) {
  const [copied, setCopied] = React.useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  const displayText = isStreaming ? streamedText : (content ?? streamedText);

  // Auto-scroll during streaming
  useEffect(() => {
    if (isStreaming && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [streamedText, isStreaming]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(displayText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isGenerating && !displayText && !error) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.25 }}
      className={cn(
        'rounded-[16px] border border-white/[0.06] bg-[#111111] overflow-hidden',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span className="text-[12px] font-medium text-[#71717A] tracking-widest uppercase">
            {label}
          </span>
          {isStreaming && (
            <span className="flex items-center gap-1 text-[11px] text-primary">
              <motion.span
                animate={{ opacity: [1, 0.3, 1] }}
                transition={reduceMotion ? { duration: 0 } : { repeat: Infinity, duration: 1.2 }}
                className="inline-block h-1.5 w-1.5 rounded-full bg-primary"
              />
              Generating…
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {isStreaming && onCancel && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="h-7 px-3 text-[12px] text-[#A1A1AA] hover:text-red-400 hover:bg-red-400/10 rounded-[8px]"
            >
              <Square className="h-3 w-3 mr-1" />
              Stop
            </Button>
          )}
          {!isGenerating && displayText && onRegenerate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRegenerate}
              className="h-7 px-3 text-[12px] text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-white/[0.05] rounded-[8px]"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          )}
          {displayText && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-7 px-3 text-[12px] text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-white/[0.05] rounded-[8px]"
            >
              {copied ? <Check className="h-3 w-3 mr-1 text-emerald-400" /> : <Copy className="h-3 w-3 mr-1" />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div
        ref={scrollRef}
        className="px-5 py-4 max-h-[400px] overflow-y-auto font-mono text-[13px] leading-relaxed text-[#A1A1AA] whitespace-pre-wrap"
      >
        {error ? (
          <p className="text-red-400">{error}</p>
        ) : isGenerating && !displayText ? (
          <div className="flex items-center gap-3 py-2">
            <div className="flex gap-1">
              {[0, 1, 2].map(i => (
                <motion.span
                  key={i}
                  className="h-1.5 w-1.5 rounded-full bg-primary"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={reduceMotion ? { duration: 0 } : { repeat: Infinity, duration: 1, delay: i * 0.2 }}
                />
              ))}
            </div>
            <span className="text-[#71717A] text-[12px]">Thinking…</span>
          </div>
        ) : (
          <span>
            {displayText}
            {isStreaming && (
              <motion.span
                animate={reduceMotion ? { opacity: 1 } : { opacity: [1, 0] }}
                transition={reduceMotion ? { duration: 0 } : { repeat: Infinity, duration: 0.6 }}
                className="inline-block ml-0.5 w-0.5 h-[14px] bg-primary align-middle"
              />
            )}
          </span>
        )}
      </div>
    </motion.div>
  );
}
