"use client";

import { useState, useEffect, useRef } from "react";
import type { FormEvent } from "react";

export default function CardPage() {
  const [cardNumber, setCardNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<boolean | null>(null);
  const errorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showError(msg: string) {
    setError(msg);
    setResult(null);
    if (errorTimer.current) clearTimeout(errorTimer.current);
    errorTimer.current = setTimeout(() => setError(null), 4000);
  }

  useEffect(() => () => { if (errorTimer.current) clearTimeout(errorTimer.current); }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const digits = cardNumber.replace(/\s/g, "");

    if (!/^\d{19}$/.test(digits)) {
      showError("Card number must be exactly 19 digits.");
      return;
    }

    try {
      const res = await fetch("/api/card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardNumber: digits }),
      });

      if (!res.ok) {
        showError("Request failed. Please try again.");
        return;
      }

      const data = await res.json();
      if (!data.isValid) {
        showError("That card number is not valid.");
      } else {
        setError(null);
        setResult(true);
      }
    } catch {
      showError("Network error. Please try again.");
    }
  }

  return (
    <main className="min-h-screen px-6 py-16 max-w-md mx-auto">
      <h1 className="text-3xl font-bold mb-2" style={{ color: "#1c1b19" }}>
        Card Lookup
      </h1>
      <p className="text-sm mb-12" style={{ color: "rgba(28,27,25,0.4)" }}>
        Enter a 19-digit card number to verify it.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          inputMode="numeric"
          maxLength={19}
          placeholder="0000000000000000000"
          value={cardNumber}
          onChange={(e) => {
            setResult(null);
            setCardNumber(e.target.value.replace(/\D/g, "").slice(0, 19));
          }}
          className="w-full px-4 py-3 rounded-xl border text-base font-mono tracking-widest outline-none transition-colors"
          style={{
            background: "#ffffff",
            border: "1px solid rgba(28,27,25,0.15)",
            color: "#1c1b19",
          }}
        />

        <button
          type="submit"
          className="w-full py-3 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
          style={{ background: "#1c1b19", color: "#f9f8f6" }}
        >
          Verify
        </button>
      </form>

      {error && (
        <div
          className="mt-6 px-4 py-3 rounded-xl text-sm font-medium animate-fade-in"
          style={{
            background: "rgba(220,38,38,0.08)",
            border: "1px solid rgba(220,38,38,0.25)",
            color: "rgb(185,28,28)",
          }}
        >
          {error}
        </div>
      )}

      {result && (
        <div
          className="mt-6 px-4 py-3 rounded-xl text-sm font-medium"
          style={{
            background: "rgba(22,163,74,0.08)",
            border: "1px solid rgba(22,163,74,0.25)",
            color: "rgb(21,128,61)",
          }}
        >
          Card is valid.
        </div>
      )}
    </main>
  );
}
