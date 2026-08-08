import { motion } from 'framer-motion';

const sections = [
  {
    num: '01',
    title: 'License',
    content: [
      'Your purchase grants you a personal, non-transferable license to use Creator OS.',
      'You may not resell, redistribute, or share your account credentials.',
      'Copying the software or reverse-engineering premium features is strictly prohibited.',
    ],
  },
  {
    num: '02',
    title: 'Payments',
    content: [
      'Creator OS is sold as a digital product.',
      'Access is granted immediately after successful payment.',
      'Recurring subscriptions renew automatically until cancelled by the user.',
    ],
  },
  {
    num: '03',
    title: 'Refund Policy',
    content: [
      'Due to the digital nature of Creator OS, refunds are generally not available once access has been granted.',
      'Exceptions may apply where required by applicable consumer protection law.',
    ],
  },
  {
    num: '04',
    title: 'Availability',
    content: [
      'We continuously improve Creator OS.',
      'Features may be added, updated, or removed without prior notice as part of our ongoing development process.',
    ],
  },
  {
    num: '05',
    title: 'User Responsibilities',
    content: [
      'You agree to use Creator OS in compliance with applicable laws.',
      'Misuse of the platform, abuse of AI systems, or unauthorized access attempts are grounds for immediate termination of your account.',
    ],
  },
  {
    num: '06',
    title: 'Intellectual Property',
    content: [
      'All software, branding, UI, documentation, prompts, and assets within Creator OS remain the exclusive property of Creator OS.',
      'No rights are transferred beyond the personal use license described herein.',
    ],
  },
  {
    num: '07',
    title: 'Disclaimer',
    content: [
      'Creator OS is designed to improve creator workflows and productivity.',
      'We do not guarantee views, followers, campaign approvals, earnings, or any financial outcomes.',
      'Results depend entirely on user execution, content quality, and market conditions.',
    ],
  },
  {
    num: '08',
    title: 'Contact',
    content: [
      'For questions regarding these Terms, contact us at sauravwhop@gmail.com.',
    ],
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#080808] font-sans text-[#FAFAFA]">
      <div className="max-w-3xl mx-auto px-6 pt-32 pb-40">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="mb-20"
        >
          <p className="text-[13px] font-medium text-[#71717A] tracking-widest uppercase mb-4">
            Legal
          </p>
          <h1 className="text-[40px] md:text-[52px] font-semibold tracking-[-0.03em] leading-[1.05] text-[#FAFAFA] mb-5">
            Terms & Conditions
          </h1>
          <p className="text-[#71717A] text-[15px] tracking-tight">
            Last Updated: August 2026
          </p>
          <div className="mt-8 p-5 rounded-[14px] bg-[#111111] border border-white/[0.06]">
            <p className="text-[15px] text-[#A1A1AA] leading-relaxed tracking-tight">
              Welcome to Creator OS. By accessing or purchasing Creator OS, you agree to be bound by these Terms. Please read them carefully before using the platform.
            </p>
          </div>
        </motion.div>

        {/* Sections */}
        <div className="space-y-2">
          {sections.map((section, i) => (
            <motion.div
              key={section.num}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.06, ease: 'easeOut' }}
              className="group"
            >
              <div className="flex gap-8 py-8 border-b border-white/[0.06]">
                <span className="text-[13px] font-medium text-[#71717A] tracking-widest pt-1 shrink-0 w-8">
                  {section.num}
                </span>
                <div className="flex-1">
                  <h2 className="text-[18px] font-semibold tracking-tight text-[#FAFAFA] mb-4">
                    {section.title}
                  </h2>
                  <ul className="space-y-2.5">
                    {section.content.map((line, j) => (
                      <li key={j} className="text-[15px] text-[#A1A1AA] leading-relaxed tracking-tight flex gap-3">
                        <span className="text-[#71717A] mt-[6px] shrink-0 h-1.5 w-1.5 rounded-full bg-[#71717A] mt-[9px]" />
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-16 text-center text-[13px] text-[#71717A]"
        >
          © 2026 Creator OS. All rights reserved.
        </motion.div>
      </div>
    </div>
  );
}
