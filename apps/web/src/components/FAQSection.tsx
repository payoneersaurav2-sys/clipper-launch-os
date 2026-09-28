import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface FAQItem {
  question: string;
  answer: React.ReactNode;
}

interface FAQSectionProps {
  title?: string;
  subtitle?: string;
  items?: FAQItem[];
  className?: string;
}

const defaultFaqs: FAQItem[] = [
  {
    question: "Do I need video editing skills to use Creator OS?",
    answer: "No. Creator OS is not a video editor. It is a workflow operating system that focuses on planning, ideation, hook scoring, SEO captions, campaigns, and knowledge management. You still use your own video editor (like Premiere, CapCut, or Opus Clip) to cut the actual video."
  },
  {
    question: "Can I use Creator OS for client work?",
    answer: "Yes. With the Agency plan, you can set up isolated client workspaces (Brand Profiles). This ensures client-specific knowledge, context, and AI generations remain completely separated. You can also invite team members with specific roles and access permissions."
  },
  {
    question: "Can I start Creator OS for free?",
    answer: "Yes, Creator OS has a Free plan that lets you explore the platform. You get 1 Workspace, up to 10 active campaigns, and access to core Idea & Hook tools. You can upgrade when your workflow demands it."
  },
  {
    question: "Who is Creator OS built for?",
    answer: "Creator OS is built for short-form video creators, solopreneurs, UGC creators, and agencies who want a repeatable system for content creation instead of chaotic spreadsheets."
  },
  {
    question: "Does Creator OS work for agencies?",
    answer: "Yes. Creator OS helps agencies manage multiple brands without mixing their context. Agency workspaces provide multi-client environment isolation and client-scoped AI context."
  },
  {
    question: "Can Creator OS use my brand and knowledge?",
    answer: "Yes. You can add specific brand guidelines, facts, and context into your Knowledge Vault. The AI will securely use this information as context to ensure generated ideas, hooks, and captions sound like your brand."
  },
  {
    question: "What can I do with Creator OS?",
    answer: "You can brainstorm viral angles in the Idea Studio, predict viewer retention with the Hook Engine, write platform-specific SEO captions with Caption OS, organize deliverables in the Campaign Center, and store brand facts in the Knowledge Vault."
  },
  {
    question: "What happens when I upgrade my plan?",
    answer: "When you upgrade, your account immediately unlocks higher AI generation limits, more workspaces, and advanced features like the Knowledge Vault or Agency client isolation. Billing and subscriptions are securely handled through Whop."
  }
];

export const pricingFaqs: FAQItem[] = [
  {
    question: "What do I get with Creator OS?",
    answer: "Creator OS is an AI-powered creator workspace. You get access to our Idea Studio, Hook Engine, Caption OS, Campaign Center, Knowledge Vault, and Analytics dashboard."
  },
  {
    question: "How do I get access after paying?",
    answer: "Creator OS is delivered digitally. After successful payment, you can immediately access the service through the Creator OS platform."
  },
  {
    question: "Is Creator OS a subscription?",
    answer: "Yes. We offer both monthly and annual subscription plans. Payments and subscription processing are handled through Whop, our third-party payment and subscription provider."
  },
  {
    question: "Can I cancel?",
    answer: "Yes, you may cancel your Creator OS subscription at any time by logging into your Whop dashboard. Cancellations take effect at the end of your current billing cycle, and you will retain access until that cycle concludes."
  },
  {
    question: "How do refunds work?",
    answer: <>Subscriptions are generally non-refundable since you receive immediate access to digital tools and AI generations. Refund eligibility is strictly governed by our <Link to="/refund-policy" className="text-primary hover:underline">Refund Policy</Link>.</>
  },
  {
    question: "Is there a free trial?",
    answer: "We currently do not offer a free trial. You can start with our monthly plan to test the workflow."
  },
  {
    question: "What happens after I cancel?",
    answer: "You will retain access to Creator OS until the end of your current billing cycle. After the cycle concludes, your account will lose access to premium features."
  },
  {
    question: "What happens if my payment fails?",
    answer: "If your payment fails, Whop will handle the billing attempt. Access may be paused until a successful payment is processed."
  },
  {
    question: "How does billing work?",
    answer: "Payments and subscription processing are handled through Whop, our third-party payment and subscription provider."
  },
  {
    question: "How do I get help?",
    answer: "For assistance with your account, billing, technical, or product questions, you can email our support team at sauravwhop@gmail.com."
  }
];

export function FAQSection({ 
  title = "Questions, answered.", 
  subtitle = "Everything you need to know before you start.",
  items = defaultFaqs,
  className = "py-16 sm:py-24 px-4 bg-[#080808] relative z-10 text-foreground border-t border-white/[0.05]"
}: FAQSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleOpen = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  // Generate structured data
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": items.map(item => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": typeof item.answer === 'string' ? item.answer : "Please see our FAQ for details."
      }
    }))
  };

  return (
    <section id="faq" className={className}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }} />
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-[32px] sm:text-[40px] font-semibold tracking-tight text-[#FAFAFA] mb-4 leading-tight">{title}</h2>
          {subtitle && <p className="text-[#A1A1AA] text-[16px] sm:text-[18px] tracking-tight">{subtitle}</p>}
        </div>
        
        <div className="space-y-3">
          {items.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <motion.div 
                key={index} 
                initial={{ opacity: 0, y: 15 }} 
                whileInView={{ opacity: 1, y: 0 }} 
                viewport={{ once: true, amount: 0.8 }} 
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className={`overflow-hidden rounded-[16px] border transition-colors duration-300 ${isOpen ? 'bg-[#111111] border-primary/20' : 'bg-[#0D0D0D] border-white/[0.06] hover:border-white/[0.12]'}`}
              >
                <button
                  type="button"
                  onClick={() => toggleOpen(index)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${index}`}
                  className="w-full flex items-center justify-between p-5 sm:p-7 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset group"
                >
                  <h3 className={`text-[16px] sm:text-[17px] font-medium tracking-tight pr-8 transition-colors ${isOpen ? 'text-primary' : 'text-[#FAFAFA] group-hover:text-primary'}`}>
                    {faq.question}
                  </h3>
                  <div className={`flex-shrink-0 transition-colors ${isOpen ? 'text-primary' : 'text-[#71717A] group-hover:text-primary'}`}>
                    {isOpen ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                  </div>
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      id={`faq-answer-${index}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <div className="px-5 sm:px-7 pb-5 sm:pb-7 pt-0 text-[#A1A1AA] text-[15px] sm:text-[16px] leading-relaxed">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

