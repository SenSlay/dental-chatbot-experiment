import { loadKb } from "../src/lib/data/loadKb";
import { getKbEntryCount } from "../src/lib/data/validateDataset";
import { KB_SIZES, type KnowledgeBase } from "../src/types/kb";

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  if (value && typeof value === "object") {
    return `{${Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}

function entryMap(kb: KnowledgeBase): Map<string, string> {
  const map = new Map<string, string>();
  const groups = [
    ["faqs", kb.faqs],
    ["offerings", kb.offerings],
    ["policies", kb.policies],
    ["dentistProfiles", kb.dentistProfiles],
  ] as const;

  for (const [group, entries] of groups) {
    for (const entry of entries) {
      map.set(`${group}:${entry.id}`, stableStringify(entry));
    }
  }

  return map;
}

function assertExactSubset(
  smallerLabel: string,
  smaller: KnowledgeBase,
  largerLabel: string,
  larger: KnowledgeBase,
): void {
  const smallerEntries = entryMap(smaller);
  const largerEntries = entryMap(larger);
  const missing: string[] = [];
  const changed: string[] = [];

  for (const [key, value] of smallerEntries) {
    if (!largerEntries.has(key)) {
      missing.push(key);
    } else if (largerEntries.get(key) !== value) {
      changed.push(key);
    }
  }

  if (missing.length > 0 || changed.length > 0) {
    throw new Error(
      `${smallerLabel} must be an exact subset of ${largerLabel}; ` +
        `missing=${missing.join(", ") || "none"}, ` +
        `changed=${changed.join(", ") || "none"}`,
    );
  }
}

async function main() {
  const datasets = new Map<number, KnowledgeBase>();

  for (const kbSize of KB_SIZES) {
    const kb = await loadKb(kbSize);
    datasets.set(kbSize, kb);
    console.log(`Validated kb_${kbSize}.json (${getKbEntryCount(kb)} entries)`);
  }

  assertExactSubset("kb_30", datasets.get(30)!, "kb_100", datasets.get(100)!);
  assertExactSubset("kb_100", datasets.get(100)!, "kb_300", datasets.get(300)!);
  console.log("Validated KB subset relationships");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
