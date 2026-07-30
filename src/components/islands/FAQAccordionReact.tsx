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
    question: "Which app stores do you support?",
    answer: "Mindphor tracks both the Google Play Store and Apple App Store, covering reviews from every country/storefront, so you see the full global picture of what users are saying about your app."
  },
  {
    value: "item-2",
    question: "How many reviews can I track?",
    answer: "Both Google Play Store and Apple App Store reviews are unlimited on every plan."
  },
  {
    value: "item-3",
    question: "Can I track competitors, not just my own app?",
    answer: "Yes, add any competitor's app or public changelog and Mindphor monitors it alongside your own, so you always know how you compare."
  },
  {
    value: "item-4",
    question: "How does Mindphor generate insights from reviews?",
    answer: "We use AI to analyze sentiment and surface the key themes across your reviews automatically, so you can spot what's working and what needs attention without reading every review yourself."
  },
  {
    value: "item-5",
    question: "Do you store my payment information?",
    answer: "No. Payments are securely processed by Paddle, our payment partner, and we never see or store your card details."
  },
  {
    value: "item-6",
    question: "Can I cancel anytime?",
    answer: "Yes. Cancel anytime from your account settings and you will keep access until the end of your current billing period."
  },

  {
    value: "item-8",
    question: "How often are reviews synced?",
    answer: "You are fully in control. You can set your apps to sync automatically every 6 hours, daily, or weekly. You can also set them to manual only if you prefer to trigger syncs yourself!"
  },
  {
    value: "item-9",
    question: "Do I need to install anything to track my app or a competitor's?",
    answer: "No installation needed, just add the app's store URL and Mindphor starts tracking it automatically."
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
