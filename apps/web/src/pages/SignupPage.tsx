import { Link } from 'react-router-dom';

export default function SignupPage() {
  return (
    <div className="flex flex-col gap-8 animate-in fade-in zoom-in-95 duration-500 font-sans text-[#FAFAFA] w-full max-w-[360px] mx-auto p-8 rounded-[20px] bg-[#111111] border border-white/[0.06] shadow-xl">
      <div className="flex flex-col items-center text-center">
        <div className="h-10 w-10 mb-6 rounded-[12px] bg-primary flex items-center justify-center shadow-[0_0_20px_rgba(124,58,237,0.3)]">
          <span className="font-bold text-white text-[14px] tracking-tighter">CR</span>
        </div>
        <h1 className="text-[24px] font-semibold tracking-tight text-[#FAFAFA]">Get Access</h1>
        <p className="text-[14px] text-[#A1A1AA] mt-2 tracking-tight">
          Purchase a license to enter Creator OS.
        </p>
      </div>
      
      <Link to="/pricing" className="inline-flex h-12 items-center justify-center rounded-[12px] bg-primary text-[15px] font-medium text-white transition-all duration-300 shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:bg-primary/90 hover:shadow-[0_0_30px_rgba(124,58,237,0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#111111]">
        Choose a plan
      </Link>

      <div className="text-center text-[13px] text-[#71717A]">
        Already have access?{' '}
        <Link to="/login" className="font-medium text-[#FAFAFA] hover:text-primary transition-colors">
          Sign in
        </Link>
      </div>
    </div>
  );
}
