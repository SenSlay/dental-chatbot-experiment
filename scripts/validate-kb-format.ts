import { loadKb } from "../src/lib/data/loadKb";
import { getKbEntryCount } from "../src/lib/data/validateDataset";
import { flattenKb } from "../src/lib/kb/flattenKb";
import { formatKbForPrompt } from "../src/lib/kb/formatKbForPrompt";
import { KB_SIZES } from "../src/types/kb";

const REQUIRED_PROMPT_SECTIONS = [
  "# Knowledge Base",
  "## FAQs",
  "## Offerings",
  "## Policies",
  "## Dentist Profiles",
] as const;

async function main() {
  for (const kbSize of KB_SIZES) {
    const kb = await loadKb(kbSize);
    const expectedCount = getKbEntryCount(kb);
    const flattened = flattenKb(kb);
    const promptText = formatKbForPrompt(kb);

    if (flattened.length !== expectedCount) {
      throw new Error(
        `kb_${kbSize}: expected ${expectedCount} flattened entries, found ${flattened.length}`,
      );
    }

    for (const entry of flattened) {
      if (!entry.id || !entry.title || !entry.text) {
        throw new Error(`kb_${kbSize}: flattened entry has empty fields`);
      }

      if (!entry.text.includes(`ID: ${entry.id}`)) {
        throw new Error(`kb_${kbSize}: flattened entry ${entry.id} omits its ID`);
      }
    }

    for (const section of REQUIRED_PROMPT_SECTIONS) {
      if (!promptText.includes(section)) {
        throw new Error(`kb_${kbSize}: prompt text missing section ${section}`);
      }
    }

    if (promptText.trim().length === 0) {
      throw new Error(`kb_${kbSize}: prompt text must not be empty`);
    }

    console.log(
      `Validated kb_${kbSize} formatting (${flattened.length} flattened entries)`,
    );
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
