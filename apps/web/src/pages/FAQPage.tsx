import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';

const faqs = [
  {
    q: 'What is Creator OS?',
    a: 'Creator OS is an all-in-one operating system that helps creators generate ideas, create content, manage campaigns, and organize their entire workflow from one place. It replaces the chaos of juggling disconnected tools with a single, cohesive workspace engineered for modern creators.',
  },
  {
    q: 'Who is Creator OS for?',
    a: 'Creator OS is designed for creators, clippers, UGC creators, freelancers, agencies, and anyone building a serious content business. Whether you are just starting out or managing a team, Creator OS scales with your ambitions.',
  },
  {
    q: 'Do I need AI experience to use Creator OS?',
    a: 'No. Creator OS is built to be immediately accessible for beginners while remaining powerful enough for experienced creators. The AI tools are guided, contextual, and require no technical background.',
  },
  {
    q: 'Does Creator OS guarantee income?',
    a: 'No. Creator OS provides premium tools and structured workflows that significantly improve your productivity and output quality. Success depends on your execution, consistency, and content strategy.',
  },
  {
    q: 'Will I receive future updates?',
    a: 'Yes. Product updates and improvements are included according to your purchased plan. We continuously ship new features, modules, and improvements based on creator feedback.',
  },
  {
    q: 'Can I cancel my subscription?',
    a: 'Yes. Recurring subscriptions can be cancelled at any time directly from your account settings. Cancellation takes effect at the end of the current billing period.',
  },
  {
    q: 'Can I use Creator OS on multiple devices?',
    a: 'Yes. Creator OS is a web-based application. Simply sign into your account from any supported device and browser.',
  },
  {
    q: 'How can I contact support?',
    a: 'Reach us directly at sauravwhop@gmail.com. We aim to respond to all inquiries within 24–48 hours.',
  },
];

function FAQItem({ item, index }: { item: typeof faqs[0]; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: 'easeOut' }}
      className="border-b border-white/[0.06] last:border-0"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-6 py-6 text-left group"
      >
        <span className={`text-[16px] font-medium tracking-tight transition-colors duration-200 ${open ? 'text-[#FAFAFA]' : 'text-[#A1A1AA] group-hover:text-[#FAFAFA]'}`}>
          {item.q}
        </span>
        <motion.div
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className={`shrink-0 h-6 w-6 rounded-full border flex items-center justify-center transition-colors duration-200 ${open ? 'border-primary bg-primary/10' : 'border-white/[0.12] bg-transparent'}`}
        >
          <Plus className={`h-3.5 w-3.5 transition-colors duration-200 ${open ? 'text-primary' : 'text-[#71717A]'}`} strokeWidth={2} />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <p className="text-[15px] text-[#A1A1AA] leading-relaxed tracking-tight pb-6 pr-12">
              {item.a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-[#080808] font-sans text-[#FAFAFA]">
      <div className="max-w-3xl mx-auto px-6 pt-32 pb-40">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="mb-20 text-center"
        >
          <p className="text-[13px] font-medium text-[#71717A] tracking-widest uppercase mb-4">
            Support
          </p>
          <h1 className="text-[40px] md:text-[52px] font-semibold tracking-[-0.03em] leading-[1.05] text-[#FAFAFA] mb-5">
            Frequently Asked<br />Questions
          </h1>
          <p className="text-[17px] text-[#A1A1AA] max-w-xl mx-auto tracking-tight leading-relaxed">
            Everything you need to know about Creator OS. Can't find the answer?{' '}
            <a href="mailto:sauravwhop@gmail.com" className="text-[#FAFAFA] hover:text-primary transition-colors">
              Email us.
            </a>
          </p>
        </motion.div>

        {/* FAQ List */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-[#111111] border border-white/[0.06] rounded-[20px] px-8 py-2"
        >
          {faqs.map((item, i) => (
            <FAQItem key={i} item={item} index={i} />
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5, ease: 'easeOut' }}
          className="mt-16 text-center"
        >
          <p className="text-[15px] text-[#71717A] tracking-tight">
            Still have questions?{' '}
            <a
              href="mailto:sauravwhop@gmail.com"
              className="text-[#FAFAFA] hover:text-primary transition-colors font-medium"
            >
              sauravwhop@gmail.com
            </a>
          </p>
        </motion.div>

      </div>
    </div>
  );
}
