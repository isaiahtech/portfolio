"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import SocialLinks from "./SocialLinks";

export default function Header() {
  const pathname = usePathname();

  const navLinks = [
    { label: "About", href: "/about" },
    { label: "12 Random Things", href: "/12-random-things" },
  ];

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-10 h-16"
      style={{
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        background: "rgba(15, 12, 41, 0.7)",
      }}
    >
      {/* Name / home link */}
      <Link
        href="/"
        className="text-white/90 font-medium text-base tracking-wide hover:text-white transition-colors duration-150"
      >
        Isaiah Dasen
      </Link>

      {/* Nav + socials */}
      <div className="flex items-center gap-6 md:gap-8">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`text-sm tracking-wide transition-colors duration-150 ${
              pathname === link.href
                ? "text-white"
                : "text-white/45 hover:text-white/80"
            }`}
          >
            {link.label}
          </Link>
        ))}
        <div className="hidden sm:block">
          <SocialLinks compact />
        </div>
      </div>
    </header>
  );
}
