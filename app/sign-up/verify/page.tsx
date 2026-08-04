import Link from "next/link";
import { redirect } from "next/navigation";
import { verifySignupOtp, resendSignupOtp } from "@/app/auth/actions";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; error?: string; sent?: string }>;
}) {
  const { email, error, sent } = await searchParams;
  if (!email) redirect("/sign-up");

  return (
    <main className="auth-page">
      <div className="auth-card">
        <span className="guide-icon" style={{ margin: "0 auto" }}>✦</span>
        <h1>Check your email</h1>
        <p>We sent a 6-digit code to {email}. Enter it below to finish creating your account.</p>
        <form className="auth-form" action={verifySignupOtp}>
          <input type="hidden" name="email" value={email} />
          <label>
            Verification code
            <input
              type="text"
              name="token"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              placeholder="123456"
              required
              autoFocus
            />
          </label>
          <button className="button primary full-button" type="submit">
            Verify <span>→</span>
          </button>
        </form>
        {error && <p className="auth-error">{error}</p>}
        {sent && <p className="auth-notice">A new code is on its way.</p>}
        <form action={resendSignupOtp}>
          <input type="hidden" name="email" value={email} />
          <button className="text-button" type="submit">Resend code</button>
        </form>
        <p className="auth-switch">
          Wrong email? <Link href="/sign-up">Start over</Link>
        </p>
      </div>
    </main>
  );
}
