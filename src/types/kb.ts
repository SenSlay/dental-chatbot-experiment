export const KB_SIZES = [30, 100, 300] as const;

export type KbSize = (typeof KB_SIZES)[number];

export type OfferingType = "service" | "product";

export type FaqEntry = {
  id: string;
  question: string;
  answer: string;
};

export type OfferingEntry = {
  id: string;
  offeringType: OfferingType;
  name: string;
  price: string;
  description: string;
  duration: string | null;
};

export type PolicyEntry = {
  id: string;
  category: string;
  title: string;
  description: string;
};

export type DentistProfileEntry = {
  id: string;
  name: string;
  aliases: string[];
  specialization: string;
  bio: string;
};

export type KnowledgeBase = {
  faqs: FaqEntry[];
  offerings: OfferingEntry[];
  policies: PolicyEntry[];
  dentistProfiles: DentistProfileEntry[];
};
