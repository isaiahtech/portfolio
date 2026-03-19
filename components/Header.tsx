"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import SocialLinks from "./SocialLinks";

export default function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { label: "About", href: "/about" },
    { label: "12 Random Things", href: "/12-random-things" },
  ];

  const linkColor = (href: string) =>
    pathname === href ? "#1c1b19" : "rgba(28, 27, 25, 0.45)";

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-4 sm:px-6"
        style={{
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(28, 27, 25, 0.08)",
          background: "rgba(249, 248, 246, 0.88)",
        }}
      >
        {/* Left group: name + nav links together */}
        <div className="flex items-center gap-5 sm:gap-8">
          <Link
            href="/"
            className="transition-colors duration-150 shrink-0"
            style={{
              fontFamily: "var(--font-signature)",
              fontSize: "1.5rem",
              color: linkColor("/"),
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.color = "rgba(28, 27, 25, 0.8)")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.color = linkColor("/"))
            }
          >
            Isaiah Dasen
          </Link>

          {/* Nav links — desktop only */}
          <div className="hidden sm:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm tracking-wide transition-colors duration-150 whitespace-nowrap"
                style={{ color: linkColor(link.href) }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLElement).style.color = "rgba(28, 27, 25, 0.8)")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLElement).style.color = linkColor(link.href))
                }
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Right group: social icons (desktop) + hamburger (mobile) */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <SocialLinks compact />
          </div>

          {/* Hamburger button — mobile only */}
          <button
            className="sm:hidden flex flex-col justify-center items-center w-9 h-9"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
            style={{ gap: "5px", background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            <span
              style={{
                display: "block", width: "20px", height: "1.5px",
                background: "rgba(28,27,25,0.6)",
                transition: "transform 0.2s",
                transform: menuOpen ? "translateY(6.5px) rotate(45deg)" : "none",
              }}
            />
            <span
              style={{
                display: "block", width: "20px", height: "1.5px",
                background: "rgba(28,27,25,0.6)",
                transition: "opacity 0.2s",
                opacity: menuOpen ? 0 : 1,
              }}
            />
            <span
              style={{
                display: "block", width: "20px", height: "1.5px",
                background: "rgba(28,27,25,0.6)",
                transition: "transform 0.2s",
                transform: menuOpen ? "translateY(-6.5px) rotate(-45deg)" : "none",
              }}
            />
          </button>
        </div>
      </header>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-30 sm:hidden"
            onClick={() => setMenuOpen(false)}
          />
          <div
            className="fixed top-16 left-0 right-0 z-40 sm:hidden"
            style={{
              background: "rgba(249, 248, 246, 0.97)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              borderBottom: "1px solid rgba(28, 27, 25, 0.08)",
            }}
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="block px-6 py-4 text-sm tracking-wide transition-colors duration-150"
                style={{
                  color: linkColor(link.href),
                  borderBottom: "1px solid rgba(28, 27, 25, 0.06)",
                }}
              >
                {link.label}
              </Link>
            ))}
            <div className="px-6 py-4">
              <SocialLinks compact />
            </div>
          </div>
        </>
      )}
    </>
  );
}
