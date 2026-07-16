<script lang="ts">
  import { Accordion } from "bits-ui";
  import { IconChevronDown } from "@tabler/icons-svelte";
  import { slide } from "svelte/transition";

  const faqItems = [
    {
      value: "item-1",
      question: "How does review ingestion work?",
      answer: "Mindphor connects securely to your Google Play Console API. We ingest incoming reviews in real time, run them through our sentiment classification engine, and map them to trace logs instantly."
    },
    {
      value: "item-2",
      question: "Can I track multiple competitor apps?",
      answer: "Yes. Depending on your subscription plan, you can add competitor packages (e.g. com.competitor.app) to track their rating updates, customer bug complaints, and sentiment changes side-by-side."
    },
    {
      value: "item-3",
      question: "Is there a limit on real-time alerts?",
      answer: "No. You can configure as many custom keyword thresholds, anomaly limits, or classification triggers as you need. Notifications sync straight to your Slack channel or JIRA backlog."
    },
    {
      value: "item-4",
      question: "Do you support custom database integrations?",
      answer: "Yes. Our Enterprise tier includes options for manual or automated database sync rows, letting your data warehouse read feedback streams directly."
    }
  ];
</script>

<Accordion.Root class="w-full divide-y divide-border-faint" type="single" defaultValue="item-1">
  {#each faqItems as item}
    <Accordion.Item
      value={item.value}
      class="bg-transparent overflow-hidden"
    >
      <Accordion.Header class="flex">
        <Accordion.Trigger class="flex-1 flex items-center justify-between py-5 text-left text-[15px] font-medium text-text-primary group">
          <span>{item.question}</span>
          <IconChevronDown class="w-4 h-4 text-text-secondary group-data-[state=open]:rotate-180 transition-transform duration-300" />
        </Accordion.Trigger>
      </Accordion.Header>
      <Accordion.Content class="pb-5 text-[13.5px] text-text-secondary leading-relaxed pt-1 bg-transparent">
        <div>
          {item.answer}
        </div>
      </Accordion.Content>
    </Accordion.Item>
  {/each}
</Accordion.Root>
