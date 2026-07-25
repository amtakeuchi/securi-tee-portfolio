"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const NAV_LINKS = [
  { href: "/", label: "home" },
  { href: "/about", label: "about" },
  { href: "/blog", label: "blog" },
  { href: "/projects", label: "projects" },
  { href: "/contact", label: "contact" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);

  const close = () => setOpen(false);

  useEffect(() => {
    document.body.classList.toggle("menu-open", open);

    if (!open) return;

    lastFocus.current = document.activeElement as HTMLElement | null;
    menuRef.current?.querySelector<HTMLElement>("a")?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        close();
        return;
      }
      if (e.key !== "Tab" || !menuRef.current || !btnRef.current) return;
      const items = [btnRef.current, ...Array.from(menuRef.current.querySelectorAll<HTMLElement>("a"))];
      const i = items.indexOf(document.activeElement as HTMLElement);
      if (e.shiftKey && i <= 0) {
        e.preventDefault();
        items[items.length - 1].focus();
      } else if (!e.shiftKey && i === items.length - 1) {
        e.preventDefault();
        items[0].focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open && lastFocus.current) {
      if (document.contains(lastFocus.current)) lastFocus.current.focus();
      lastFocus.current = null;
    }
  }, [open]);

  useEffect(() => {
    const mq = matchMedia("(min-width: 769px)");
    const onChange = (m: MediaQueryListEvent) => {
      if (m.matches) close();
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return (
    <>
      <header className="site-header">
        <div className="wrap">
          <Link className="wordmark" href="/">
            securi<span className="tee">-tee</span>
          </Link>
          <nav className="site-nav" aria-label="primary">
            {NAV_LINKS.map((l) => (
              <Link key={l.href} href={l.href}>
                {l.label}
              </Link>
            ))}
          </nav>
          <button
            ref={btnRef}
            className="menu-btn"
            id="menu-btn"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "close menu" : "open menu"}
            onClick={() => setOpen((o) => !o)}
          >
            <span className="bar" aria-hidden="true"></span>
            <span className="bar" aria-hidden="true"></span>
            <span className="bar" aria-hidden="true"></span>
          </button>
        </div>
      </header>

      <div
        className="mobile-menu"
        id="mobile-menu"
        data-open={open}
        role="dialog"
        aria-modal="true"
        aria-label="menu"
        ref={menuRef}
        onClick={(e) => {
          if ((e.target as HTMLElement).closest("a")) close();
        }}
      >
        <nav aria-label="mobile">
          {NAV_LINKS.map((l, i) => (
            <Link key={l.href} href={l.href}>
              <span className="idx">{String(i + 1).padStart(2, "0")}</span> {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}
