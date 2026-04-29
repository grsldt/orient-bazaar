import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/catalog/Logo";
import { toast } from "sonner";
import { ArrowLeft, Lock, MessageCircle, Send } from "lucide-react";

type Mode = "contact" | "signin" | "forgot";

export default function Auth() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  // Default = public contact form; ?admin=1 jumps straight to admin login
  const [mode, setMode] = useState<Mode>(params.get("admin") ? "signin" : "contact");

  // Auth fields
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");

  // Contact fields
  const [c, setC] = useState({ name: "", email: "", phone: "", subject: "", message: "" });

  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { if (data.session && mode !== "contact") nav("/admin"); });
  }, [nav, mode]);

  const submitAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
        if (error) throw error;
        toast.success("Welcome back 欢迎");
        nav("/admin");
      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("Reset link sent. Check your inbox.");
        setMode("signin");
      }
    } catch (e: any) {
      toast.error(e.message || "Error");
    } finally { setBusy(false); }
  };

  const submitContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!c.name.trim() || !c.email.trim() || !c.message.trim()) {
      toast.error("Name, email and message are required");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("contact_messages").insert({
      name: c.name.trim(),
      email: c.email.trim(),
      phone: c.phone.trim() || null,
      subject: c.subject.trim() || null,
      message: c.message.trim(),
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Message sent — we'll reply within 24h 谢谢");
    setC({ name: "", email: "", phone: "", subject: "", message: "" });
  };

  return (
    <div className="min-h-screen bg-ink text-background flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute han text-primary opacity-[0.06] text-[clamp(280px,55vw,640px)] leading-none select-none pointer-events-none">龙</div>

      <div className="relative w-full max-w-lg">
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-muted-foreground hover:text-primary mb-3">
          <ArrowLeft size={12}/> Back to catalog
        </Link>

        <div className="bg-card text-foreground p-6 md:p-8 ink-border">
          <div className="mb-5"><Logo size="lg"/></div>

          {mode === "contact" ? (
            <>
              <h1 className="text-2xl font-black mb-1">Contact us 联系我们</h1>
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-5">
                Wholesale enquiries · partnerships · custom orders
              </p>
              <form onSubmit={submitContact} className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <input required value={c.name} onChange={(e) => setC({ ...c, name: e.target.value })} placeholder="Your name *" className="bg-background px-3 py-2.5 ink-border focus:outline-none focus:border-primary text-sm"/>
                  <input required type="email" value={c.email} onChange={(e) => setC({ ...c, email: e.target.value })} placeholder="Email *" className="bg-background px-3 py-2.5 ink-border focus:outline-none focus:border-primary text-sm"/>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input value={c.phone} onChange={(e) => setC({ ...c, phone: e.target.value })} placeholder="Phone (optional)" className="bg-background px-3 py-2.5 ink-border focus:outline-none focus:border-primary text-sm"/>
                  <input value={c.subject} onChange={(e) => setC({ ...c, subject: e.target.value })} placeholder="Subject" className="bg-background px-3 py-2.5 ink-border focus:outline-none focus:border-primary text-sm"/>
                </div>
                <textarea required rows={5} value={c.message} onChange={(e) => setC({ ...c, message: e.target.value })} placeholder="Your message *" className="w-full bg-background px-3 py-2.5 ink-border focus:outline-none focus:border-primary text-sm resize-y"/>
                <button type="submit" disabled={busy}
                  className="w-full bg-primary text-primary-foreground font-bold uppercase tracking-widest py-3 hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
                  <Send size={16}/> {busy ? "Sending..." : "Send message"}
                </button>
              </form>

              <div className="mt-5 pt-4 border-t border-border flex items-center justify-between text-xs">
                <a href="https://wa.me/12532237370" target="_blank" rel="noopener" className="text-jade font-bold uppercase tracking-widest flex items-center gap-1.5 hover:opacity-80">
                  <MessageCircle size={14}/> Or chat on WhatsApp
                </a>
                <button onClick={() => setMode("signin")} className="text-muted-foreground hover:text-primary uppercase tracking-widest flex items-center gap-1">
                  <Lock size={11}/> Admin
                </button>
              </div>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-black mb-1">
                {mode === "signin" ? "Admin Sign In" : "Reset Password"}
              </h1>
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-5">管理员入口 · Admin only</p>

              <form onSubmit={submitAuth} className="space-y-3">
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email"
                  className="w-full bg-background px-3 py-2.5 ink-border focus:outline-none focus:border-primary"/>
                {mode !== "forgot" && (
                  <input type="password" required value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Password (min 6)" minLength={6}
                    className="w-full bg-background px-3 py-2.5 ink-border focus:outline-none focus:border-primary"/>
                )}
                <button type="submit" disabled={busy}
                  className="w-full bg-primary text-primary-foreground font-bold uppercase tracking-widest py-3 hover:opacity-90 disabled:opacity-50">
                  {busy ? "..." : (mode === "signin" ? "Sign In" : "Send Reset Link")}
                </button>
              </form>

              <div className="mt-4 flex flex-col gap-2 text-xs text-center uppercase tracking-widest">
                {mode === "signin" && (
                  <button onClick={() => setMode("forgot")} className="text-muted-foreground hover:text-primary">Forgot password?</button>
                )}
                {mode === "forgot" && (
                  <button onClick={() => setMode("signin")} className="text-muted-foreground hover:text-primary">Back to sign in</button>
                )}
                <button onClick={() => setMode("contact")} className="text-muted-foreground hover:text-primary mt-2">← Back to contact form</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
