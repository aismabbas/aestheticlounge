"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

const navLinks = [
  { href: "/#services", label: "Services" },
  { href: "/#doctors", label: "Doctors" },
  { href: "/#results", label: "Results" },
  { href: "/#about", label: "About" },
  { href: "/promotions", label: "Promotions" },
  { href: "/social", label: "Social" },
  { href: "/blog", label: "Blog" },
  { href: "/#contact", label: "Contact" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-[1000] transition-all duration-500 ${
        scrolled
          ? "bg-white/92 backdrop-blur-2xl py-4 shadow-[0_1px_0_var(--color-border)]"
          : "py-6"
      }`}
    >
      <div className="mx-auto flex max-w-[1320px] items-center justify-between px-5 md:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo-icon.png"
            alt="Aesthetic Lounge"
            width={72}
            height={72}
            className="h-[72px] w-[72px]"
            priority
          />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-10 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="nav-link text-[13px] font-medium uppercase tracking-[0.06em] text-text-light transition-colors hover:text-gold"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Book CTA */}
        <a
          href="/#book"
          className="gold-shimmer-bg relative hidden overflow-hidden rounded-md px-7 py-3 text-[13px] font-semibold uppercase tracking-[0.04em] text-white transition-all duration-400 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(184,146,74,0.15)] md:inline-block"
        >
          Book a Visit
        </a>

        {/* Mobile Toggle */}
        <button
          className="flex flex-col gap-1.5 p-1 md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <span
            className={`block h-[1.5px] w-6 bg-text-dark transition-all duration-300 ${
              mobileOpen ? "translate-y-[7.5px] rotate-45" : ""
            }`}
          />
          <span
            className={`block h-[1.5px] w-6 bg-text-dark transition-all duration-300 ${
              mobileOpen ? "opacity-0" : ""
            }`}
          />
          <span
            className={`block h-[1.5px] w-6 bg-text-dark transition-all duration-300 ${
              mobileOpen ? "-translate-y-[7.5px] -rotate-45" : ""
            }`}
          />
        </button>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <nav className="absolute top-full left-0 right-0 flex flex-col gap-5 border-b border-border bg-white/98 px-8 py-6 backdrop-blur-xl md:hidden">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-[13px] font-medium uppercase tracking-[0.06em] text-text-light transition-colors hover:text-gold"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <a
            href="/#book"
            className="gold-shimmer-bg mt-2 inline-block rounded-md px-7 py-3 text-center text-[13px] font-semibold uppercase tracking-[0.04em] text-white"
            onClick={() => setMobileOpen(false)}
          >
            Book a Visit
          </a>
        </nav>
      )}
    </header>
  );
}
