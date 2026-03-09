import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "12 Random Things — Isaiah Dasen",
};

// ─── Replace these with your real facts / opinions ────────
const THINGS = [
  "I think film photography is better than digital for everything except convenience.",
  "I've never finished a book I didn't enjoy by chapter three.",
  "Cold brew is objectively superior to hot coffee in every way.",
  "I believe the best ideas come on walks, not at desks.",
  "Tabs over spaces — I will not be taking questions.",
  "The best travel days are the ones where nothing goes as planned.",
  "I've watched the same three movies more times than I can count.",
  "Dark mode isn't a preference, it's a personality trait.",
  "Most problems in software are really just communication problems.",
  "I think everyone should learn to cook at least three things really well.",
  "Golden hour makes everything look like a different world.",
  "I am irrationally attached to the specific pen I'm currently using.",
];

export default function RandomThings() {
  return (
    <main className="min-h-screen px-6 py-16 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-2">12 Random Things</h1>
      <p className="text-white/40 text-sm mb-12">
        Facts, opinions, and observations. In no particular order.
      </p>

      <ol className="space-y-5">
        {THINGS.map((thing, i) => (
          <li key={i} className="flex gap-5 items-start group">
            <span
              className="text-sm font-mono mt-0.5 shrink-0 w-6 text-right"
              style={{ color: "rgba(139, 92, 246, 0.5)" }}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <p className="text-white/70 text-base leading-7 group-hover:text-white/90 transition-colors duration-150">
              {thing}
            </p>
          </li>
        ))}
      </ol>
    </main>
  );
}
