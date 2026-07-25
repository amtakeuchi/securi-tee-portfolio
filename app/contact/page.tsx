"use client";

import React, { useState, useRef } from "react";

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [showError, setShowError] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    try {
      const res = await fetch("https://formspree.io/f/xqabvkpr", {
        method: "POST",
        body: formData,
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error("Submission failed");
      setShowThankYou(true);
      formRef.current?.reset();
    } catch (_err) {
      setShowError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page">
      <div className="wrap prose-wrap">
        <header className="page-head">
          <p className="page-cmd">
            <span className="ps1">adam@securi-tee:~$</span> mail adam
          </p>
          <h1>contact</h1>
          <p className="page-lead">
            i&apos;m curious what you&apos;ve got. send it over. i read everything,
            usually reply within a day or two.
          </p>
          <p className="page-quiet">
            dealing with something active right now? say so in your message and
            i&apos;ll get to it first.
          </p>
        </header>

        {showThankYou && (
          <p className="form-ok">
            <span className="ps1">$</span> sent. thanks for reaching out, i&apos;ll get
            back to you soon.
          </p>
        )}

        {showError && (
          <p className="form-ok" role="alert">
            <span className="ps1">$</span> something broke sending that. try again, or
            email me directly.
          </p>
        )}

        <form ref={formRef} onSubmit={handleSubmit} className="contact-form">
          <div className="form-group">
            <label htmlFor="name">name</label>
            <input
              type="text"
              id="name"
              name="name"
              required
              className="form-input"
              placeholder="your name"
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">email</label>
            <input
              type="email"
              id="email"
              name="email"
              required
              className="form-input"
              placeholder="you@example.com"
            />
          </div>
          <div className="form-group">
            <label htmlFor="message">message</label>
            <textarea
              id="message"
              name="message"
              required
              rows={6}
              className="form-textarea"
              placeholder="what's on your mind"
            />
          </div>
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "sending..." : "send"}
          </button>
        </form>

        <div className="article-links">
          <a
            className="text-link"
            href="https://www.linkedin.com/in/adam-takeuchi/"
            target="_blank"
            rel="noopener noreferrer"
          >
            linkedin <span className="arrow" aria-hidden="true">&rarr;</span>
          </a>
          <a
            className="text-link"
            href="https://github.com/amtakeuchi"
            target="_blank"
            rel="noopener noreferrer"
          >
            github <span className="arrow" aria-hidden="true">&rarr;</span>
          </a>
        </div>
      </div>
    </div>
  );
}
