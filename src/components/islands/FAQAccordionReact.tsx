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
    question: "Which app stores do you currently support?",
    answer: "Mindphor supports fully automated review tracking for both the Google Play Store and the Apple App Store. You can monitor unlimited Android apps, and track up to 3,000 iOS reviews per month depending on your plan."
  },
  {
    value: "item-2",
    question: "How does Competitor Intelligence work?",
    answer: "Simply paste the app store URL of any competitor app. Mindphor instantly begins tracking their reviews and analyzing what their users love or hate, sending you alerts when they experience bugs or negative sentiment spikes."
  },
  {
    value: "item-3",
    question: "What exactly are AI Action Plans?",
    answer: "Instead of just showing you raw data, our AI engine synthesizes thousands of user reviews into prioritized, step-by-step action plans. It tells your engineering and product teams exactly which bugs to fix and which features to build next."
  },
  {
    value: "item-4",
    question: "How do I receive anomaly alerts?",
    answer: "You can view real-time anomaly alerts directly in your Mindphor dashboard, or you can route them straight to your team's workflow using our native Slack, Discord, and Custom HMAC webhook integrations."
  },
  {
    value: "item-5",
    question: "Do I need technical skills to set this up?",
    answer: "Not at all. You can get started by just pasting your app's store link. No SDKs, no code, and no complex engineering integrations are required to start tracking sentiment."
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
