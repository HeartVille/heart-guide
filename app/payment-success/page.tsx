import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { hasFounderAccess } from "@/lib/membership";
import SiteHeader from "@/components/site-header";

export const dynamic = "force-dynamic";

export default async function PaymentSuccessPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const active = user?.email ? await hasFounderAccess(supabase, user.email) : false;

  return (
    <>
    <SiteHeader />
    <main className="payment-success-page">
      <section className="payment-success-card">
        <span className="result-mark" aria-hidden="true">✦</span>
        <p className="eyebrow">Welcome, founding member</p>
        <h1>Thank you for joining Heart Guide.</h1>
        <p>{active
          ? "Your Founder Access is active. You can now use every member guide and save your reflections."
          : "Your payment has been received. Your Founder Access is being connected to the email address used at checkout."
        }</p>
        <p className="payment-help">
          {user
            ? "If access is not visible immediately, allow a moment for your membership to update, then refresh this page."
            : "Please sign in using the same email address you used at checkout to see your access."
          }
        </p>
        <Link className="button primary" href={user ? "/" : "/sign-in?next=/payment-success"}>
          {user ? "Return to Heart Guide" : "Sign in to Heart Guide"} <span>→</span>
        </Link>
      </section>
    </main>
    </>
  );
}
