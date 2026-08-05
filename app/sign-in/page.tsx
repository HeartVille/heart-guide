import Link from "next/link";
import { signIn } from "@/app/auth/actions";
import SiteHeader from "@/components/site-header";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;

  return (
    <>
    <SiteHeader />
    <main className="auth-page">
      <div className="auth-card">
        <span className="guide-icon" style={{ margin: "0 auto" }}>✦</span>
        <h1>Welcome back</h1>
        <p>Sign in to continue your Heart Guide journey.</p>
        <form className="auth-form" action={signIn}>
          <input type="hidden" name="next" value={next ?? "/"} />
          <label>
            Email address
            <input type="email" name="email" placeholder="you@example.com" required autoFocus />
          </label>
          <label>
            Password
            <input type="password" name="password" placeholder="••••••••" required minLength={6} />
          </label>
          <button className="button primary full-button" type="submit">
            Sign in <span>→</span>
          </button>
        </form>
        {error && <p className="auth-error">{error}</p>}
        <p className="auth-switch">
          New here? <Link href="/sign-up">Create an account</Link>
        </p>
      </div>
    </main>
    </>
  );
}
