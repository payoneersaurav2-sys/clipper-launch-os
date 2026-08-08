import { Loader2 } from 'lucide-react';

type WhopOAuthButtonProps = {
  disabled?: boolean;
  loading?: boolean;
  onClick: () => void;
};

/**
 * Whop's public OAuth flow is redirect-based rather than an embeddable widget.
 * This control keeps the official Whop sign-in language and brand treatment
 * while delegating the actual authorization to the existing PKCE flow.
 */
export function WhopOAuthButton({ disabled = false, loading = false, onClick }: WhopOAuthButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className="group relative flex h-12 w-full items-center justify-center gap-3 overflow-hidden rounded-[12px] border border-[#FF6243]/45 bg-[#FF6243] px-4 text-[14px] font-semibold text-white shadow-[0_10px_24px_rgba(255,98,67,0.16)] transition-all duration-200 hover:-translate-y-px hover:bg-[#ff7356] hover:shadow-[0_14px_30px_rgba(255,98,67,0.28)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8A73] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111111] disabled:cursor-not-allowed disabled:opacity-65"
    >
      <span className="flex h-6 w-6 items-center justify-center rounded-[7px] bg-white text-[#171717] shadow-sm" aria-hidden="true">
        <span className="text-[11px] font-black leading-none tracking-[-0.12em]">W</span>
      </span>
      <span>{loading ? 'Redirecting to Whop…' : 'Sign in with Whop'}</span>
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      <span className="pointer-events-none absolute inset-x-0 bottom-0 h-px translate-x-[-100%] bg-white/80 transition-transform duration-500 group-hover:translate-x-full motion-reduce:transition-none" />
    </button>
  );
}
