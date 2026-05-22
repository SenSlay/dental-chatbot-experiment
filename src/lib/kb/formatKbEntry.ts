import type {
  DentistProfileEntry,
  FaqEntry,
  OfferingEntry,
  PolicyEntry,
} from "@/types/kb";

export function formatDuration(duration: string | null): string {
  return duration ?? "Not applicable";
}

export function formatFaqEntry(entry: FaqEntry): string {
  return [
    `ID: ${entry.id}`,
    "Type: FAQ",
    `Question: ${entry.question}`,
    `Answer: ${entry.answer}`,
  ].join("\n");
}

export function formatOfferingEntry(entry: OfferingEntry): string {
  return [
    `ID: ${entry.id}`,
    `Type: Offering (${entry.offeringType})`,
    `Name: ${entry.name}`,
    `Price: ${entry.price}`,
    `Duration: ${formatDuration(entry.duration)}`,
    `Description: ${entry.description}`,
  ].join("\n");
}

export function formatPolicyEntry(entry: PolicyEntry): string {
  return [
    `ID: ${entry.id}`,
    "Type: Policy",
    `Category: ${entry.category}`,
    `Title: ${entry.title}`,
    `Description: ${entry.description}`,
  ].join("\n");
}

export function formatDentistProfileEntry(entry: DentistProfileEntry): string {
  return [
    `ID: ${entry.id}`,
    "Type: Dentist Profile",
    `Name: ${entry.name}`,
    `Aliases: ${entry.aliases.join(", ")}`,
    `Specialization: ${entry.specialization}`,
    `Bio: ${entry.bio}`,
  ].join("\n");
}
