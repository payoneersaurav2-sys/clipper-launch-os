import { motion } from 'framer-motion';

export function FAQSection() {
  const faqs = [
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

  return (
    <section id="faq" aria-label="AEO Structured Questions & Answers" className="py-16 sm:py-24 px-4 bg-background relative z-10 text-foreground">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-[30px] sm:text-[40px] font-semibold tracking-[-0.04em] mb-4 leading-none">Frequently Asked Questions</h2>
          <p className="text-muted-foreground text-[16px] tracking-tight">Everything you need to know about the Creator OS platform.</p>
        </div>
        
        <div className="space-y-8">
          {faqs.map((faq, index) => (
            <motion.div 
              key={index} 
              initial={{ opacity: 0, y: 10 }} 
              whileInView={{ opacity: 1, y: 0 }} 
              viewport={{ once: true, amount: 0.8 }} 
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="bg-card border border-border rounded-[16px] p-6 sm:p-8"
            >
              <h3 className="text-[18px] sm:text-[20px] font-semibold tracking-tight mb-3 text-primary">{faq.question}</h3>
              <p className="text-muted-foreground text-[15px] leading-relaxed">{faq.answer}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
