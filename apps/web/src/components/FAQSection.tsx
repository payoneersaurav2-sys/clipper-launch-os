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
    question: "What is Creator OS?",
    answer: "Creator OS is a unified content creation operating system designed for short-form video creators and agencies. It replaces disconnected tools by integrating an AI hook generator, SEO caption writer, clip pipeline, and campaign analytics into one dashboard."
  },
  {
    question: "How does the AI Hook Engine improve video retention?",
    answer: "The Hook Engine scores and rewrites video hooks using loss aversion, curiosity gaps, and historical high-retention frameworks to keep viewers from swiping away during the critical first 3 seconds of TikToks and YouTube Shorts."
  },
  {
    question: "How is Creator OS different from Notion or Google Docs?",
    answer: "Unlike static document editors, Creator OS is an active workflow engine built specifically for video creators with built-in AI hook scoring, platform SEO caption engines, multi-brand workspaces, and dedicated short-form clip pipelines."
  },
  {
    question: "How much does Creator OS cost?",
    answer: "Creator OS offers three pricing tiers: the Creator Plan at $29/month, the Pro Plan at $49/month, and the Agency Plan at $149/month, with annual billing discounts available."
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
  title = "Frequently Asked Questions", 
  subtitle = "Everything you need to know about the Creator OS platform.",
  items = defaultFaqs,
  className = "py-16 sm:py-24 px-4 bg-background relative z-10 text-foreground"
}: FAQSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleOpen = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  // Generate structured data only if these are text-only answers (basic heuristic)
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
        <div className="text-center mb-10 sm:mb-14">
          <h2 className="text-[28px] sm:text-[36px] font-semibold tracking-[-0.04em] mb-4 leading-none">{title}</h2>
          {subtitle && <p className="text-muted-foreground text-[15px] sm:text-[16px] tracking-tight">{subtitle}</p>}
        </div>
        
        <div className="space-y-4">
          {items.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <motion.div 
                key={index} 
                initial={{ opacity: 0, y: 10 }} 
                whileInView={{ opacity: 1, y: 0 }} 
                viewport={{ once: true, amount: 0.8 }} 
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="bg-card/50 border border-border rounded-[14px] overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggleOpen(index)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${index}`}
                  className="w-full flex items-center justify-between p-5 sm:p-6 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
                >
                  <h3 className="text-[16px] sm:text-[17px] font-medium tracking-tight text-foreground pr-8">{faq.question}</h3>
                  <div className="flex-shrink-0 text-primary">
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
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                    >
                      <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-0 text-muted-foreground text-[14px] sm:text-[15px] leading-relaxed">
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

