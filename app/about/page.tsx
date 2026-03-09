import Image from "next/image";
import SocialLinks from "@/components/SocialLinks";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About — Isaiah Dasen",
};

export default function About() {
  return (
    <main className="min-h-screen px-6 py-16 max-w-2xl mx-auto">
      <div className="flex flex-col items-center text-center gap-8">
        {/* Avatar */}
        <div
          className="relative w-28 h-28 rounded-full ring-2 ring-purple-400/30 ring-offset-4 ring-offset-transparent"
          style={{ boxShadow: "0 0 32px rgba(139, 92, 246, 0.35)" }}
        >
          <Image
            src="/avatar.svg"
            alt="Isaiah Dasen"
            fill
            priority
            unoptimized
            className="rounded-full object-cover"
          />
        </div>

        {/* Name + tagline */}
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Isaiah Dasen</h1>
          <p className="text-white/50 text-base">
            Photographer. Developer. Explorer of light and code.
          </p>
        </div>

        {/* Bio */}
        <div className="glass-card p-8 text-left text-white/65 text-base leading-7 space-y-4 w-full">
          <p>
            {/* Replace with your real bio */}
            Based wherever curiosity takes me. I make photographs that tell
            stories and build things on the web that feel alive.
          </p>
          <p>
            When I'm not behind a camera or a keyboard, I'm usually exploring
            somewhere new, chasing light, or thinking about how to make
            something look and feel just right.
          </p>
        </div>

        {/* Socials */}
        <SocialLinks />
      </div>
    </main>
  );
}
