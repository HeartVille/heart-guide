import Link from "next/link";

/** Minimal header used on pages outside the main single-page app (auth,
 * Creator Studio) so there's always a way back to Heart Guide. */
export default function SiteHeader() {
  return (
    <header className="header">
      <Link className="brand" href="/">
        <span className="mark" aria-hidden="true">
          <span>✦</span>
        </span>
        <span>Heart Guide</span>
      </Link>
    </header>
  );
}
