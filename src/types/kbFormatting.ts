export type FlattenedKbSourceType =
  | "faq"
  | "offering"
  | "policy"
  | "dentist_profile";

export type FlattenedKbEntry = {
  id: string;
  sourceType: FlattenedKbSourceType;
  title: string;
  text: string;
};
