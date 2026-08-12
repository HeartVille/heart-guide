"use client";

import { useState } from "react";

export default function ShareGuideLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt("Copy this guide link:", url);
    }
  }

  return (
    <div className="share-guide-link">
      <span>Live guide URL</span>
      <code title={url}>{url}</code>
      <div>
        <a href={url} target="_blank" rel="noreferrer">Open</a>
        <button type="button" onClick={copyLink}>{copied ? "Copied" : "Copy link"}</button>
      </div>
    </div>
  );
}
