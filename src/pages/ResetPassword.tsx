import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/catalog/Logo";
import { toast } from "sonner";

export default function ResetPassword() {
  const nav = useNavigate();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase places the recovery token in the URL hash and signs in a temporary session.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => { if (data.session) setReady(true); });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (pw !== pw2) { toast.error("Passwords do not match"); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Password updated. Please sign in.");
    await supabase.auth.signOut();
    nav("/auth");
  };

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute han text-primary opacity-5 text-[400px] leading-none select-none pointer-events-none">龙</div>
      <div className="bg-card w-full max-w-md p-8 ink-border relative">
        <div className="mb-6"><Logo size="lg"/></div>
        <h1 className="text-2xl font-black mb-1">Set New Password</h1>
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-6">重置密码</p>

        {!ready ? (
          <p className="text-sm text-muted-foreground">Verifying reset link...</p>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <input
              type="password" required value={pw} onChange={(e) => setPw(e.target.value)}
              placeholder="New password (min 6)" minLength={6}
              className="w-full bg-background px-3 py-2.5 ink-border focus:outline-none focus:border-primary"
            />
            <input
              type="password" required value={pw2} onChange={(e) => setPw2(e.target.value)}
              placeholder="Confirm password" minLength={6}
              className="w-full bg-background px-3 py-2.5 ink-border focus:outline-none focus:border-primary"
            />
            <button
              type="submit" disabled={busy}
              className="w-full bg-primary text-primary-foreground font-bold uppercase tracking-widest py-3 hover:opacity-90 disabled:opacity-50"
            >{busy ? "..." : "Update Password"}</button>
          </form>
        )}
      </div>
    </div>
  );
}