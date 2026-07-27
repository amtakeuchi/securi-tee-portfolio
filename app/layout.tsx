import React from "react";
import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "./components/SiteHeader";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.securi-tee.com"),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>securi-tee</title>
        <meta name="description" content="adam takeuchi. cybersecurity analyst. security as a profession, security as a way of being." />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600&family=IBM+Plex+Mono:wght@400;500&family=Noto+Serif+JP:wght@200&display=swap"
          rel="stylesheet"
        />
        <noscript>
          <style>{`
            html:not(.gsap) .reveal { opacity: 1 !important; transform: none !important; }
            .rise { animation: none !important; opacity: 1 !important; transform: none !important; }
          `}</style>
        </noscript>
      </head>
      <body>
        <a className="skip-link" href="#main">skip to content</a>

        <SiteHeader />

        <main id="main">{children}</main>

        <footer className="site-footer">
          <div className="wrap">
            <span>&copy; 2026 adam takeuchi &middot; securi-tee</span>
            <span className="duality" aria-hidden="true">
              <span className="o">offense</span> / <span className="d">defense</span>
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}
