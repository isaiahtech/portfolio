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
          className="relative w-28 h-28 rounded-full"
          style={{
            border: "1px solid rgba(196, 149, 106, 0.3)",
            boxShadow: "0 0 24px rgba(196, 149, 106, 0.15)",
          }}
        >
          <Image
            src="/avatar.jpg"
            alt="Isaiah Dasen"
            fill
            priority
            unoptimized
            className="rounded-full object-cover"
          />
        </div>

        {/* Name + tagline */}
        <div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: "#1c1b19" }}>
            Isaiah Dasen
          </h1>
          <p className="text-base" style={{ color: "rgba(28, 27, 25, 0.5)" }}>
            Photographer. Developer. Explorer of light and code.
          </p>
        </div>

        {/* Bio */}
        <div
          className="glass-card p-8 text-left text-base leading-7 w-full"
          style={{ color: "rgba(28, 27, 25, 0.65)" }}
        >
          <p>
            Based wherever curiosity—and the next good climb—takes me. I work in cybersecurity to keep the web resilient, and use photography to slow down and capture the moments in between. If I don&apos;t have a camera in my hand or a keyboard in front of me, I&apos;m probably chalking up at the crag or exploring a new trail.
          </p>
        </div>

        {/* Socials */}
        <SocialLinks />
      </div>
    </main>
  );
}
