import type { KnowledgeBase } from "@/types/kb";
import type { FlattenedKbEntry } from "@/types/kbFormatting";
import {
  formatDentistProfileEntry,
  formatFaqEntry,
  formatOfferingEntry,
  formatPolicyEntry,
} from "./formatKbEntry";

export function flattenKb(kb: KnowledgeBase): FlattenedKbEntry[] {
  return [
    ...kb.faqs.map((entry) => ({
      id: entry.id,
      sourceType: "faq" as const,
      title: entry.question,
      text: formatFaqEntry(entry),
    })),
    ...kb.offerings.map((entry) => ({
      id: entry.id,
      sourceType: "offering" as const,
      title: entry.name,
      text: formatOfferingEntry(entry),
    })),
    ...kb.policies.map((entry) => ({
      id: entry.id,
      sourceType: "policy" as const,
      title: entry.title,
      text: formatPolicyEntry(entry),
    })),
    ...kb.dentistProfiles.map((entry) => ({
      id: entry.id,
      sourceType: "dentist_profile" as const,
      title: entry.name,
      text: formatDentistProfileEntry(entry),
    })),
  ];
}
