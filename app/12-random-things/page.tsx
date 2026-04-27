import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "12 Random Things — Isaiah Dasen",
};

// ─── Replace these with your real facts / opinions ────────
const THINGS: (string | { text: string; href: string })[] = [
  "Iced Americanos are the only acceptable fuel source, regardless of the weather outside.",
  "Half the internet is bots, the other half is humans talking to bots.",
  "I will absolutely stop mid-conversation if the lighting looks interesting enough to photograph.",
  "Bouldering is really just solving complex physical puzzles while trying to fall gracefully.",
  "Most cybersecurity vulnerabilities are just communication problems in disguise.",
  "I believe the best ideas come on walks, not at desks.",
  "Growing up in Montana completely ruined my tolerance for mediocre hiking trails.",
  "Picking up extremely heavy things and putting them back down is elite-tier therapy.",
  "I can and will passionately debate the plot arcs of my favorite sci-fi novels and anime.",
  "Dark mode isn't a preference, it's a personality trait.",
  "Every dog believes they are a lap dog, completely regardless of their actual size.",
  { text: "You can verify a card number here.", href: "/card" },
];

export default function RandomThings() {
  return (
    <main className="min-h-screen px-6 py-16 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-2" style={{ color: "#1c1b19" }}>
        12 Random Things
      </h1>
      <p className="text-sm mb-12" style={{ color: "rgba(28, 27, 25, 0.4)" }}>
        Facts, opinions, and observations. In no particular order.
      </p>

      <ol className="space-y-6">
        {THINGS.map((thing, i) => (
          <li key={i} className="flex gap-5 items-start group">
            <span
              className="text-sm font-mono mt-0.5 shrink-0 w-6 text-right"
              style={{ color: "rgba(196, 149, 106, 0.6)" }}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <p
              className="text-base leading-7"
              style={{ color: "rgba(28, 27, 25, 0.7)" }}
            >
              {typeof thing === "string" ? (
                thing
              ) : (
                <Link
                  href={thing.href}
                  className="underline underline-offset-4 hover:opacity-70 transition-opacity"
                  style={{ color: "rgba(28, 27, 25, 0.7)" }}
                >
                  {thing.text}
                </Link>
              )}
            </p>
          </li>
        ))}
      </ol>
    </main>
  );
}
