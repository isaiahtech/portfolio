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
      className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-center gap-16 px-6"
      style={{
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(28, 27, 25, 0.08)",
        background: "rgba(249, 248, 246, 0.88)",
      }}
    >
      {/* Name */}
      <Link
        href="/"
        className="transition-colors duration-150"
        style={{
          fontFamily: "var(--font-signature)",
          fontSize: "1.6rem",
          color: pathname === "/" ? "#1c1b19" : "rgba(28, 27, 25, 0.5)",
        }}
        onMouseEnter={(e) =>
          ((e.currentTarget as HTMLElement).style.color = "rgba(28, 27, 25, 0.8)")
        }
        onMouseLeave={(e) =>
          ((e.currentTarget as HTMLElement).style.color =
            pathname === "/" ? "#1c1b19" : "rgba(28, 27, 25, 0.45)")
        }
      >
        Isaiah Dasen
      </Link>

      {/* Nav links */}
      {navLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="text-sm tracking-wide transition-colors duration-150"
          style={{
            color: pathname === link.href ? "#1c1b19" : "rgba(28, 27, 25, 0.45)",
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLElement).style.color = "rgba(28, 27, 25, 0.8)")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLElement).style.color =
              pathname === link.href ? "#1c1b19" : "rgba(28, 27, 25, 0.45)")
          }
        >
          {link.label}
        </Link>
      ))}

      {/* Social icons */}
      <SocialLinks compact />
    </header>
  );
}
