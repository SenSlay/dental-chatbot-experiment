import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dental Chatbot Experiment Runner",
  description:
    "Local thesis experiment runner for comparing Prompt Engineering and RAG.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
