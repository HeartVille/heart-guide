import Link from "next/link";
import { signUp } from "@/app/auth/actions";
import SiteHeader from "@/components/site-header";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <>
    <SiteHeader />
    <main className="auth-page">
      <div className="auth-card">
        <span className="guide-icon" style={{ margin: "0 auto" }}>✦</span>
        <h1>Begin your journey</h1>
        <p>Create an account to save your reflections privately in My Journey.</p>
        <form className="auth-form" action={signUp}>
          <label>
            First name
            <input type="text" name="name" placeholder="Your first name" required autoFocus />
          </label>
          <label>
            Email address
            <input type="email" name="email" placeholder="you@example.com" required />
          </label>
          <label>
            Password
            <input type="password" name="password" placeholder="At least 6 characters" required minLength={6} />
          </label>
          <button className="button primary full-button" type="submit">
            Create account <span>→</span>
          </button>
        </form>
        {error && <p className="auth-error">{error}</p>}
        <p className="auth-switch">
          Already have an account? <Link href="/sign-in">Sign in</Link>
        </p>
      </div>
    </main>
    </>
  );
}
