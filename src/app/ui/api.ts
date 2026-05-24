import type { ApiData, ApiError } from "./types";

export async function readApiData<T>(response: Response): Promise<T> {
  const body = (await response.json()) as ApiData<T> | ApiError;

  if (!response.ok || "error" in body) {
    throw new Error("error" in body ? body.error : "Request failed.");
  }

  return body.data;
}

export function formatDateTime(value: string | null): string {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatTechnique(value: string): string {
  return value === "PROMPT_ENGINEERING" ? "Prompt Engineering" : "RAG";
}

export function formatStatus(value: string): string {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

export function compactText(value: string | null, maxLength = 120): string {
  if (!value) {
    return "No response recorded.";
  }

  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1)}...`;
}
