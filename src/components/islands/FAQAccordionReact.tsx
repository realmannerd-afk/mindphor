import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion.tsx";

const faqItems = [
  {
    value: "item-1",
    question: "How does Mindphor track Google Play reviews?",
    answer: "We connect to public Google Play Store data to monitor your app. Our engine automatically ingests new user reviews in real-time, analyzes their underlying sentiment, and highlights critical issues before they severely impact your app's rating."
  },
  {
    value: "item-2",
    question: "How does Competitor Intelligence work?",
    answer: "Simply provide the Play Store URL of any competitor app. Mindphor will instantly begin tracking their reviews, analyzing what their users love or hate, and sending you alerts when they experience bugs or negative sentiment spikes."
  },
  {
    value: "item-3",
    question: "What exactly are AI Action Plans?",
    answer: "Instead of just showing you raw data, our AI engine synthesizes thousands of user reviews into a prioritized, step-by-step action plan. It tells your engineering and product teams exactly which bugs to fix and which features to build next to maximize user satisfaction."
  },
  {
    value: "item-4",
    question: "Can I customize the anomaly alerts?",
    answer: "Yes! You can configure custom keywords (e.g., 'crash', 'battery', 'refund') or set thresholds for sudden drops in your average rating. When a trigger is hit, you receive an immediate alert on your dashboard."
  },
  {
    value: "item-5",
    question: "Do I need technical skills to set this up?",
    answer: "Not at all. You can get started by just pasting your app's Play Store link. No SDKs, coding, or complex integrations are required to start tracking sentiment."
  }
];

export default function FAQAccordionReact() {
  return (
    <Accordion type="single" collapsible className="w-full divide-y divide-border-faint" defaultValue="item-1">
      {faqItems.map((item) => (
        <AccordionItem key={item.value} value={item.value} className="border-none">
          <AccordionTrigger className="py-5 text-left text-[15px] font-medium text-text-primary hover:no-underline hover:text-text-secondary transition-colors">
            {item.question}
          </AccordionTrigger>
          <AccordionContent className="pb-5 text-[13.5px] text-text-secondary leading-relaxed pt-1">
            {item.answer}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
