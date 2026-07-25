"use client";

import { useState } from "react";
import Link from "next/link";
import type { Track, Writeup } from "../lib/featured-work";

const FILTERS: { key: "all" | Track; label: string }[] = [
  { key: "all", label: "all" },
  { key: "offense", label: "offense" },
  { key: "defense", label: "defense" },
  { key: "etc", label: "etc" },
];

export function RecentWorkFeed({ writeups }: { writeups: Writeup[] }) {
  const [filter, setFilter] = useState<"all" | Track>("all");
  const rows = writeups.filter((w) => filter === "all" || w.track === filter);

  return (
    <section className="block reveal" id="recent" aria-labelledby="recent-title">
      <div className="wrap">
        <div className="section-label">
          <span className="n">02</span>
          <h2 id="recent-title">recent work</h2>
        </div>

        <div className="feed-filters" role="group" aria-label="filter recent work">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              data-filter={f.key}
              aria-pressed={filter === f.key}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="feed" id="feed" aria-live="polite">
          {rows.map((w) => (
            <a key={w.href} className="writeup" data-track={w.track} href={w.href}>
              <span className="date">
                {w.date.slice(0, 7)} &middot; {w.kind} &middot; {w.track}
              </span>
              <span>
                <h3>{w.title}</h3>
                <p>{w.desc}</p>
                <p className="proof">{w.proof}</p>
              </span>
              <span className="go" aria-hidden="true">&rarr;</span>
            </a>
          ))}
        </div>

        <div className="feed-more">
          <Link id="btn-more" href="/work">
            $ fetch --more <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
