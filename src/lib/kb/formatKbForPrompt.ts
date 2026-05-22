import type { KnowledgeBase } from "@/types/kb";
import {
  formatDentistProfileEntry,
  formatFaqEntry,
  formatOfferingEntry,
  formatPolicyEntry,
} from "./formatKbEntry";

function formatSection(title: string, entries: string[]): string {
  return [`## ${title}`, ...entries].join("\n\n");
}

export function formatKbForPrompt(kb: KnowledgeBase): string {
  return [
    "# Knowledge Base",
    formatSection("FAQs", kb.faqs.map(formatFaqEntry)),
    formatSection("Offerings", kb.offerings.map(formatOfferingEntry)),
    formatSection("Policies", kb.policies.map(formatPolicyEntry)),
    formatSection(
      "Dentist Profiles",
      kb.dentistProfiles.map(formatDentistProfileEntry),
    ),
  ].join("\n\n");
}
