import Link from "next/link";
import type { ReactNode } from "react";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Local Thesis Runner</p>
          <h1>Dental Chatbot Experiment</h1>
        </div>
        <nav className="top-nav" aria-label="Primary navigation">
          <Link href="/experiments">Experiments</Link>
          <Link href="/results">Results</Link>
          <Link href="/analysis">Analysis</Link>
        </nav>
      </header>
      {children}
    </main>
  );
}
