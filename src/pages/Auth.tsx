import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/catalog/Logo";
import { toast } from "sonner";

export default function Auth() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { if (data.session) nav("/admin"); });
  }, [nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
        if (error) throw error;
        toast.success("Welcome back 欢迎");
        nav("/admin");
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password: pw,
          options: { emailRedirectTo: `${window.location.origin}/admin` },
        });
        if (error) throw error;
        toast.success("Account created. Ask the owner to grant admin access.");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("Reset email sent. Check your inbox.");
        setMode("signin");
      }
    } catch (e: any) {
      toast.error(e.message || "Error");
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute han text-primary opacity-5 text-[400px] leading-none select-none pointer-events-none">龙</div>
      <div className="bg-card w-full max-w-md p-8 ink-border relative">
        <div className="mb-6"><Logo size="lg"/></div>
        <h1 className="text-2xl font-black mb-1">
          {mode === "signin" ? "Admin Sign In" : mode === "signup" ? "Create Account" : "Reset Password"}
        </h1>
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-6">管理员入口 · Admin only</p>

        <form onSubmit={submit} className="space-y-3">
          <input
            type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full bg-background px-3 py-2.5 ink-border focus:outline-none focus:border-primary"
          />
          {mode !== "forgot" && (
            <input
              type="password" required value={pw} onChange={(e) => setPw(e.target.value)}
              placeholder="Password (min 6)" minLength={6}
              className="w-full bg-background px-3 py-2.5 ink-border focus:outline-none focus:border-primary"
            />
          )}
          <button
            type="submit" disabled={busy}
            className="w-full bg-primary text-primary-foreground font-bold uppercase tracking-widest py-3 hover:opacity-90 disabled:opacity-50"
          >{busy ? "..." : (mode === "signin" ? "Sign In" : mode === "signup" ? "Sign Up" : "Send Reset Link")}</button>
        </form>

        <div className="mt-4 flex flex-col gap-2 text-xs text-center uppercase tracking-widest">
          {mode === "signin" && (
            <>
              <button onClick={() => setMode("forgot")} className="text-muted-foreground hover:text-primary">Forgot password?</button>
              <button onClick={() => setMode("signup")} className="text-muted-foreground hover:text-primary">Need an account? Sign up</button>
            </>
          )}
          {mode === "signup" && (
            <button onClick={() => setMode("signin")} className="text-muted-foreground hover:text-primary">Already have an account? Sign in</button>
          )}
          {mode === "forgot" && (
            <button onClick={() => setMode("signin")} className="text-muted-foreground hover:text-primary">Back to sign in</button>
          )}
        </div>
      </div>
    </div>
  );
}
