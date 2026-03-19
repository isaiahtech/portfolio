import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "12 Random Things — Isaiah Dasen",
};

// ─── Replace these with your real facts / opinions ────────
const THINGS = [
  "I fight internet bots for a living. It's exactly as nerdy as it sounds, but I love keeping the web secure.",
  "I spend a lot of time falling off rock walls. Eventually, I figure out the puzzle and climb to the top of them.",
  "I'm a dad to three kids. They keep me grounded, laughing, and constantly on my toes.",
  "I always have a camera nearby. Chasing the perfect light is my favorite kind of scavenger hunt.",
  "I grew up in Montana. That's probably where my love for being outside and exploring dirt trails started.",
  "I like picking up really heavy things. Powerlifting and strongman training are my favorite ways to clear my head.",
  "I run on iced Americanos. They fuel pretty much everything else on this list.",
  "My daily routines are non-negotiable. I rarely miss my mid-morning walk to step away from the screens.",
  "I'm a massive sci-fi and fantasy nerd. If there are spaceships, magic, or a good anime plotline involved, I'm hooked.",
  "I still play plenty of video games. I just call it \"interactive stress relief\" these days.",
  "If there's snow, I want to be in it. Skiing is my favorite excuse to freeze outside all day.",
  "I'm always tinkering with something. Whether it's a camera lens, a bouldering problem, or a piece of code, I just love figuring out how things work.",
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
              {thing}
            </p>
          </li>
        ))}
      </ol>
    </main>
  );
}
