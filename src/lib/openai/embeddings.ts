import { formatOpenAIError } from "./errors";
import { getOpenAIClient } from "./client";

export function getEmbeddingModel(): string {
  const model = process.env.OPENAI_EMBEDDING_MODEL?.trim();

  if (!model) {
    throw new Error("Missing required environment variable: OPENAI_EMBEDDING_MODEL");
  }

  return model;
}

function validateEmbeddingText(text: string, index: number): void {
  if (!text.trim()) {
    throw new Error(`Embedding input at index ${index} must not be empty.`);
  }
}

export async function embedTexts(
  texts: string[],
  model = getEmbeddingModel(),
): Promise<number[][]> {
  if (texts.length === 0) {
    return [];
  }

  texts.forEach(validateEmbeddingText);

  const client = getOpenAIClient();

  try {
    const response = await client.embeddings.create({
      model,
      input: texts,
      encoding_format: "float",
    });

    if (response.data.length !== texts.length) {
      throw new Error(
        `OpenAI returned ${response.data.length} embeddings for ${texts.length} inputs.`,
      );
    }

    return response.data
      .slice()
      .sort((a, b) => a.index - b.index)
      .map((item, index) => {
        if (!Array.isArray(item.embedding) || item.embedding.length === 0) {
          throw new Error(`OpenAI embedding response at index ${index} was empty.`);
        }

        return item.embedding;
      });
  } catch (error) {
    throw new Error(formatOpenAIError(error));
  }
}

export async function embedText(
  text: string,
  model = getEmbeddingModel(),
): Promise<number[]> {
  const [embedding] = await embedTexts([text], model);
  return embedding;
}
