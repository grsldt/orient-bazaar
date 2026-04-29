import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Brand, Category, Product, SiteSettings, fetchBrands, fetchCategories, fetchProducts, fetchSettings, resolveImageUrl, formatPrice } from "@/lib/catalog";
import { Logo } from "@/components/catalog/Logo";
import { toast } from "sonner";
import { Plus, Trash2, LogOut, Upload, X, ChevronUp, ChevronDown, Settings as SettingsIcon, Mail, Menu } from "lucide-react";
import { useScrollLock } from "@/hooks/useScrollLock";

const slugify = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// =============== Lightweight inline modals (replace native prompt/confirm) ===============
function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  useScrollLock(true);
  return (
    <>
      <div className="fixed inset-0 z-[60] bg-ink/80 backdrop-blur-sm" onClick={onClose}/>
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-card w-full max-w-sm ink-border pointer-events-auto" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="font-black text-base">{title}</h3>
            <button onClick={onClose} className="hover:text-primary"><X size={18}/></button>
          </div>
          <div className="p-5">{children}</div>
        </div>
      </div>
    </>
  );
}

function PromptModal({ title, label, placeholder, defaultValue = "", onSubmit, onClose }: { title: string; label?: string; placeholder?: string; defaultValue?: string; onSubmit: (v: string) => void; onClose: () => void; }) {
  const [v, setV] = useState(defaultValue);
  return (
    <Modal title={title} onClose={onClose}>
      {label && <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">{label}</label>}
      <input
        autoFocus
        value={v}
        placeholder={placeholder}
        onChange={(e) => setV(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && v.trim()) { onSubmit(v.trim()); onClose(); } }}
        className="w-full bg-background px-3 py-2.5 ink-border focus:outline-none focus:border-primary text-sm"
      />
      <div className="flex justify-end gap-2 mt-5">
        <button onClick={onClose} className="px-4 py-2 ink-border text-xs uppercase tracking-widest">Cancel</button>
        <button disabled={!v.trim()} onClick={() => { onSubmit(v.trim()); onClose(); }}
          className="bg-primary text-primary-foreground px-5 py-2 text-xs uppercase tracking-widest font-bold disabled:opacity-50">OK</button>
      </div>
    </Modal>
  );
}

function ConfirmModal({ title, message, danger, onConfirm, onClose }: { title: string; message: string; danger?: boolean; onConfirm: () => void; onClose: () => void; }) {
  return (
    <Modal title={title} onClose={onClose}>
      <p className="text-sm text-foreground/90">{message}</p>
      <div className="flex justify-end gap-2 mt-5">
        <button onClick={onClose} className="px-4 py-2 ink-border text-xs uppercase tracking-widest">Cancel</button>
        <button onClick={() => { onConfirm(); onClose(); }}
          className={`px-5 py-2 text-xs uppercase tracking-widest font-bold ${danger ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground"}`}>Confirm</button>
      </div>
    </Modal>
  );
}

export default function Admin() {
  const nav = useNavigate();
  const [authChecked, setAuthChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  const [brandId, setBrandId] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [view, setView] = useState<"products" | "messages" | "settings">("products");
  const [unread, setUnread] = useState(0);
  const [navOpen, setNavOpen] = useState(false);
  const [showAddBrand, setShowAddBrand] = useState(false);

  // Auth gate
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { nav("/auth"); return; }
      setUserEmail(session.user.email ?? "");
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id);
      const admin = (roles ?? []).some((r: any) => r.role === "admin");
      setIsAdmin(admin);
      setAuthChecked(true);
    };
    init();
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) nav("/auth");
    });
    return () => sub.subscription.unsubscribe();
  }, [nav]);

  const reload = useCallback(async () => {
    const [b, c, s] = await Promise.all([fetchBrands(), fetchCategories(), fetchSettings()]);
    setBrands(b); setCategories(c); setSettings(s);
  }, []);

  useEffect(() => { if (isAdmin) reload(); }, [isAdmin, reload]);

  // Live unread message count
  useEffect(() => {
    if (!isAdmin) return;
    const load = () => supabase.from("contact_messages").select("id", { count: "exact", head: true }).eq("read", false).then(({ count }) => setUnread(count ?? 0));
    load();
    const ch = supabase.channel("msgs").on("postgres_changes", { event: "*", schema: "public", table: "contact_messages" }, load).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    fetchProducts({ brandId, categoryId }).then(setProducts);
  }, [brandId, categoryId, isAdmin]);

  if (!authChecked) return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Loading...</div>;

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-ink text-background flex items-center justify-center p-6">
        <div className="bg-card text-foreground p-8 max-w-md ink-border">
          <h1 className="font-black text-2xl mb-2">Access Restricted 禁止</h1>
          <p className="text-sm text-muted-foreground mb-4">
            You're signed in as <span className="font-mono text-foreground">{userEmail}</span> but you don't have admin rights.
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            To grant admin access, the owner must run this SQL once in the backend:
          </p>
          <pre className="text-[11px] bg-muted p-3 overflow-x-auto mb-4">{`INSERT INTO public.user_roles (user_id, role)
VALUES (
  (SELECT id FROM auth.users WHERE email = '${userEmail}'),
  'admin'
);`}</pre>
          <button onClick={async () => { await supabase.auth.signOut(); nav("/auth"); }}
            className="w-full bg-primary text-primary-foreground font-bold uppercase tracking-widest py-2.5">
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  const reloadProducts = () => fetchProducts({ brandId, categoryId }).then(setProducts);

  return (
    <div className="min-h-screen md:flex bg-background">
      {/* Mobile topbar */}
      <div className="md:hidden sticky top-0 z-30 bg-ink text-background flex items-center justify-between px-3 py-2 border-b-2 border-primary">
        <button onClick={() => setNavOpen(true)} aria-label="Menu" className="p-2 -ml-2"><Menu size={20}/></button>
        <div className="text-xs uppercase tracking-widest font-bold">Admin · {view}</div>
        <button onClick={() => nav("/")} className="text-[10px] uppercase tracking-widest p-2">Site →</button>
      </div>

      {/* Mobile overlay */}
      {navOpen && (
        <div className="fixed inset-0 z-40 bg-ink/70 backdrop-blur-sm md:hidden" onClick={() => setNavOpen(false)} aria-hidden/>
      )}

      {/* Sidebar */}
      <aside className={`bg-ink text-sidebar-foreground flex flex-col overflow-hidden
        fixed inset-y-0 left-0 z-50 w-[80vw] max-w-[260px] transform transition-transform duration-300
        ${navOpen ? "translate-x-0" : "-translate-x-full"}
        md:static md:translate-x-0 md:w-56 lg:w-60 md:shrink-0 md:h-screen md:sticky md:top-0`}>
        <div className="p-3 md:p-4 border-b border-sidebar-border flex items-center justify-between">
          <Logo size="sm"/>
          <button onClick={() => setNavOpen(false)} className="md:hidden p-1 hover:text-primary" aria-label="Close"><X size={18}/></button>
        </div>
        <div className="px-3 py-2 text-[10px] uppercase tracking-widest text-muted-foreground border-b border-sidebar-border min-w-0">
          <div className="opacity-70">Admin</div>
          <div className="truncate normal-case tracking-normal text-sidebar-foreground" title={userEmail}>{userEmail}</div>
        </div>

        <nav className="flex-1 overflow-y-auto">
          <button
            onClick={() => { setView("products"); setNavOpen(false); }}
            className={`w-full text-left px-3 py-2 text-xs font-bold uppercase tracking-widest border-b border-sidebar-border ${view === "products" ? "bg-primary text-primary-foreground" : "hover:bg-sidebar-accent"}`}
          >Products</button>
          <button
            onClick={() => { setView("messages"); setNavOpen(false); }}
            className={`w-full text-left px-3 py-2 text-xs font-bold uppercase tracking-widest border-b border-sidebar-border flex items-center justify-between ${view === "messages" ? "bg-primary text-primary-foreground" : "hover:bg-sidebar-accent"}`}
          >
            <span><Mail size={11} className="inline mr-1.5"/>Messages</span>
            {unread > 0 && <span className="bg-accent text-accent-foreground text-[10px] font-black px-1.5 py-0.5 rounded-full">{unread}</span>}
          </button>
          <button
            onClick={() => { setView("settings"); setNavOpen(false); }}
            className={`w-full text-left px-3 py-2 text-xs font-bold uppercase tracking-widest border-b border-sidebar-border ${view === "settings" ? "bg-primary text-primary-foreground" : "hover:bg-sidebar-accent"}`}
          ><SettingsIcon size={11} className="inline mr-1.5"/>Settings</button>

          {view === "products" && (
            <>
              <div className="px-3 pt-3 pb-1.5 text-[10px] uppercase tracking-widest text-muted-foreground flex justify-between items-center">
                <span>Brands ({brands.length})</span>
                <button onClick={() => setShowAddBrand(true)} className="text-primary hover:text-accent" aria-label="Add brand"><Plus size={14}/></button>
              </div>
              <button
                onClick={() => { setBrandId(null); setCategoryId(null); setNavOpen(false); }}
                className={`w-full text-left px-3 py-1.5 text-xs border-b border-sidebar-border/40 ${brandId === null ? "bg-primary text-primary-foreground" : "hover:bg-sidebar-accent"}`}
              >All</button>
              {brands.map((b) => (
                <button key={b.id}
                  onClick={() => { setBrandId(b.id); setCategoryId(null); setNavOpen(false); }}
                  className={`w-full text-left px-3 py-1.5 text-xs border-b border-sidebar-border/40 ${brandId === b.id ? "bg-primary text-primary-foreground" : "hover:bg-sidebar-accent"}`}
                >{b.name}</button>
              ))}
            </>
          )}
        </nav>

        <div className="p-2 border-t border-sidebar-border space-y-1.5">
          <button
            onClick={() => nav("/")}
            className="w-full text-[10px] uppercase tracking-widest bg-sidebar-accent py-1.5 hover:bg-primary hover:text-primary-foreground"
          >View Site →</button>
          <button
            onClick={async () => { await supabase.auth.signOut(); nav("/"); }}
            className="w-full text-[10px] uppercase tracking-widest bg-sidebar-accent py-1.5 hover:bg-destructive flex items-center justify-center gap-1"
          ><LogOut size={11}/> Sign Out</button>
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-6 overflow-x-hidden min-w-0">
        {view === "settings" && settings ? (
          <SettingsPanel settings={settings} onSaved={reload}/>
        ) : view === "messages" ? (
          <MessagesPanel/>
        ) : (
          <ProductsPanel
            brands={brands}
            categories={categories}
            products={products}
            brandId={brandId}
            categoryId={categoryId}
            onCategoryChange={setCategoryId}
            settings={settings}
            onReload={() => { reload(); reloadProducts(); }}
          />
        )}
      </main>
      {showAddBrand && (
        <PromptModal
          title="New brand"
          label="Brand name"
          placeholder="e.g. Arcteryx"
          onSubmit={async (name) => {
            const slug = slugify(name);
            const { error } = await supabase.from("brands").insert({ name, slug });
            if (error) { toast.error(error.message); return; }
            toast.success("Brand added");
            reload();
          }}
          onClose={() => setShowAddBrand(false)}
        />
      )}
    </div>
  );
}


// ============== Messages panel ==============
function MessagesPanel() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("contact_messages").select("*").order("created_at", { ascending: false }).limit(500);
    setItems(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const markRead = async (id: string, read: boolean) => {
    await supabase.from("contact_messages").update({ read }).eq("id", id);
    setItems((cur) => cur.map((m) => m.id === id ? { ...m, read } : m));
  };
  const remove = async (id: string) => {
    if (!confirm("Delete this message?")) return;
    await supabase.from("contact_messages").delete().eq("id", id);
    setItems((cur) => cur.filter((m) => m.id !== id));
  };

  const list = filter === "unread" ? items.filter((m) => !m.read) : items;

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-3xl font-black">Messages</h1>
        <div className="flex gap-2 text-xs uppercase tracking-widest">
          <button onClick={() => setFilter("all")} className={`px-3 py-1.5 ink-border ${filter === "all" ? "bg-primary text-primary-foreground" : "bg-card"}`}>All ({items.length})</button>
          <button onClick={() => setFilter("unread")} className={`px-3 py-1.5 ink-border ${filter === "unread" ? "bg-primary text-primary-foreground" : "bg-card"}`}>Unread ({items.filter((m) => !m.read).length})</button>
        </div>
      </div>
      <p className="text-xs uppercase tracking-widest text-muted-foreground mb-6">客户消息 · Customer enquiries</p>

      {loading ? <p className="text-muted-foreground">Loading...</p> : list.length === 0 ? (
        <p className="text-muted-foreground">No messages.</p>
      ) : (
        <div className="space-y-2">
          {list.map((m) => (
            <div key={m.id} className={`bg-card ink-border p-4 ${!m.read ? "border-l-4 border-l-primary" : ""}`}>
              <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <div className="font-bold flex items-center gap-2 flex-wrap">
                    {m.name}
                    {!m.read && <span className="text-[9px] bg-primary text-primary-foreground px-1.5 py-0.5 uppercase tracking-widest">New</span>}
                  </div>
                  <div className="text-xs text-muted-foreground break-all">
                    <a href={`mailto:${m.email}`} className="hover:text-primary">{m.email}</a>
                    {m.phone && <> · <a href={`tel:${m.phone}`} className="hover:text-primary">{m.phone}</a></>}
                  </div>
                </div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  {new Date(m.created_at).toLocaleString()}
                </div>
              </div>
              {m.subject && <div className="text-sm font-semibold mb-1">{m.subject}</div>}
              <p className="text-sm whitespace-pre-wrap text-foreground/90 mb-3">{m.message}</p>
              <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-widest">
                <a href={`mailto:${m.email}?subject=Re:%20${encodeURIComponent(m.subject || "Your enquiry")}`} className="px-3 py-1.5 bg-primary text-primary-foreground hover:opacity-90">Reply by email</a>
                <button onClick={() => markRead(m.id, !m.read)} className="px-3 py-1.5 ink-border bg-card hover:bg-muted">Mark as {m.read ? "unread" : "read"}</button>
                <button onClick={() => remove(m.id)} className="px-3 py-1.5 text-destructive hover:underline">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============== Settings panel ==============
function SettingsPanel({ settings, onSaved }: { settings: SiteSettings; onSaved: () => void }) {
  const [s, setS] = useState(settings);
  const save = async () => {
    const { error } = await supabase.from("site_settings").update(s).eq("id", 1);
    if (error) toast.error(error.message); else { toast.success("Saved"); onSaved(); }
  };
  return (
    <div className="max-w-xl">
      <h1 className="text-3xl font-black mb-1">Site Settings</h1>
      <p className="text-xs uppercase tracking-widest text-muted-foreground mb-6">网站设置</p>
      <div className="space-y-4 bg-card p-6 ink-border">
        <Field label="WhatsApp number (with +)" value={s.whatsapp_number} onChange={(v) => setS({ ...s, whatsapp_number: v })}/>
        <Field label="Tracking URL" value={s.tracking_url} onChange={(v) => setS({ ...s, tracking_url: v })}/>
        <Field label="Image base URL (where your local /catalog/ images live)" value={s.image_base_url} onChange={(v) => setS({ ...s, image_base_url: v })} placeholder="/catalog/  or  https://your-host.com/"/>
        <p className="text-xs text-muted-foreground">
          Leave the image base URL empty to use <code className="bg-muted px-1">/catalog/</code> at your site root. Place your existing image folder (Acne Studio/, Ami/, etc.) inside <code className="bg-muted px-1">public/catalog/</code> on your local machine.
        </p>
        <button onClick={save} className="bg-primary text-primary-foreground font-bold uppercase tracking-widest px-6 py-2.5">Save</button>
      </div>
    </div>
  );
}
function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">{label}</label>
      <input value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className="w-full bg-background px-3 py-2 ink-border focus:outline-none focus:border-primary"/>
    </div>
  );
}

// ============== Products panel ==============
function ProductsPanel({ brands, categories, products, brandId, categoryId, onCategoryChange, settings, onReload }: any) {
  const [editing, setEditing] = useState<Product | null>(null);
  const brand = brands.find((b: Brand) => b.id === brandId);
  const brandCats = brandId ? categories.filter((c: Category) => c.brand_id === brandId) : [];

  const addCategory = async () => {
    if (!brandId) return;
    const name = prompt("Category name (e.g. shoes, t-shirt)?")?.trim();
    if (!name) return;
    const { error } = await supabase.from("categories").insert({ brand_id: brandId, name, slug: slugify(name) });
    if (error) { toast.error(error.message); return; }
    onReload();
  };

  const newProduct = async () => {
    if (!brandId) { toast.error("Pick a brand from the sidebar first"); return; }
    let catId = categoryId;
    if (!catId) {
      if (brandCats.length === 0) {
        toast.error("Create a category first (button \"+ Category\")");
        return;
      }
      // Ask user to pick one
      const choice = prompt(
        `Which category?\n\n${brandCats.map((c: Category, i: number) => `${i + 1}. ${c.name}`).join("\n")}\n\nType the number:`
      );
      const idx = parseInt((choice || "").trim(), 10) - 1;
      if (isNaN(idx) || idx < 0 || idx >= brandCats.length) { toast.error("Cancelled"); return; }
      catId = brandCats[idx].id;
    }
    const title = prompt("Product title?")?.trim();
    if (!title) return;
    const { data, error } = await supabase.from("products").insert({
      brand_id: brandId, category_id: catId, title, price: 15, currency: "USD"
    }).select().single();
    if (error) { toast.error(error.message); return; }
    onReload();
    setEditing(data as any);
  };

  const deleteBrand = async () => {
    if (!brand) return;
    if (!confirm(`Delete brand "${brand.name}" and ALL its products?`)) return;
    await supabase.from("brands").delete().eq("id", brand.id);
    toast.success("Deleted");
    onReload();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-3xl font-black">{brand ? brand.name : "All Products"}</h1>
        {brand && <button onClick={deleteBrand} className="text-destructive text-xs uppercase tracking-widest hover:underline">Delete brand</button>}
      </div>
      <p className="text-xs uppercase tracking-widest text-muted-foreground mb-6">{products.length} items</p>

      <div className="flex flex-wrap gap-2 mb-6">
        {brandId && (
          <>
            <select value={categoryId ?? ""} onChange={(e) => onCategoryChange(e.target.value || null)} className="bg-card px-3 py-2 ink-border text-sm">
              <option value="">All categories</option>
              {brandCats.map((c: Category) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button onClick={addCategory} className="text-xs uppercase tracking-widest bg-card ink-border px-3 py-2 hover:bg-primary hover:text-primary-foreground"><Plus size={12} className="inline mr-1"/>Category</button>
            <button onClick={newProduct} className="text-xs uppercase tracking-widest bg-primary text-primary-foreground px-4 py-2 hover:opacity-90"><Plus size={12} className="inline mr-1"/>New Product</button>
          </>
        )}
        {!brandId && <p className="text-sm text-muted-foreground">Pick a brand from the sidebar to add or edit products.</p>}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {products.map((p: Product) => (
          <button key={p.id} onClick={() => setEditing(p)} className="text-left bg-card ink-border hover:border-primary transition group">
            <div className="aspect-square bg-muted overflow-hidden">
              {p.images?.[0] && <img src={resolveImageUrl(p.images[0].url, settings?.image_base_url ?? "")} alt="" className="w-full h-full object-cover group-hover:scale-105 transition"/>}
            </div>
            <div className="p-2">
              <div className="font-bold text-sm truncate">{p.title}</div>
              <div className="text-xs text-muted-foreground flex justify-between">
                <span>{p.whatsapp_only ? "WhatsApp" : p.price ? formatPrice(p.price, p.currency) : "—"}</span>
                <span>{p.images?.length ?? 0} 图</span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {editing && <ProductEditor product={editing} settings={settings} onClose={() => { setEditing(null); onReload(); }}/>}
    </div>
  );
}

// ============== Product editor ==============
function ProductEditor({ product, settings, onClose }: { product: Product; settings: SiteSettings | null; onClose: () => void }) {
  const [p, setP] = useState<Product>(product);
  const [imgs, setImgs] = useState(product.images ?? []);
  const [sizes, setSizes] = useState(product.sizes ?? []);
  const [colors, setColors] = useState(product.colors ?? []);
  const [busy, setBusy] = useState(false);
  useScrollLock(true);

  const save = async () => {
    setBusy(true);
    const { error } = await supabase.from("products").update({
      title: p.title, description: p.description, price: p.price, price_label: p.price_label,
      whatsapp_only: p.whatsapp_only, currency: p.currency,
    }).eq("id", p.id);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Saved");
    onClose();
  };

  const del = async () => {
    if (!confirm(`Delete "${p.title}"?`)) return;
    await supabase.from("products").delete().eq("id", p.id);
    toast.success("Deleted");
    onClose();
  };

  const upload = async (files: FileList | null) => {
    if (!files) return;
    setBusy(true);
    for (const file of Array.from(files)) {
      const path = `${p.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      const { error } = await supabase.storage.from("product-images").upload(path, file);
      if (error) { toast.error(error.message); continue; }
      const next = imgs.length;
      const { data } = await supabase.from("product_images").insert({ product_id: p.id, url: `storage://${path}`, sort_order: next }).select().single();
      if (data) setImgs((cur) => [...cur, data as any]);
    }
    setBusy(false);
  };

  const addUrlImage = async () => {
    const url = prompt("Image URL or relative path (e.g. brand/category/file.jpg)?")?.trim();
    if (!url) return;
    const next = imgs.length;
    const { data, error } = await supabase.from("product_images").insert({ product_id: p.id, url, sort_order: next }).select().single();
    if (error) { toast.error(error.message); return; }
    setImgs((cur) => [...cur, data as any]);
  };

  const removeImg = async (id: string) => {
    await supabase.from("product_images").delete().eq("id", id);
    setImgs((cur) => cur.filter((i) => i.id !== id));
  };

  const moveImg = async (id: string, dir: -1 | 1) => {
    const i = imgs.findIndex((x) => x.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= imgs.length) return;
    const next = [...imgs]; [next[i], next[j]] = [next[j], next[i]];
    setImgs(next);
    await Promise.all(next.map((im, idx) => supabase.from("product_images").update({ sort_order: idx }).eq("id", im.id)));
  };

  const addSize = async () => {
    const s = prompt("Size (e.g. M, 42, XL)?")?.trim();
    if (!s) return;
    const { data, error } = await supabase.from("product_sizes").insert({ product_id: p.id, size: s, sort_order: sizes.length }).select().single();
    if (error) { toast.error(error.message); return; }
    setSizes((cur) => [...cur, data as any]);
  };
  const removeSize = async (id: string) => {
    await supabase.from("product_sizes").delete().eq("id", id);
    setSizes((cur) => cur.filter((s) => s.id !== id));
  };

  const addColor = async () => {
    const name = prompt("Color name (e.g. Black, Red)?")?.trim();
    if (!name) return;
    const hex = prompt("Color hex code (optional, e.g. #000000)?")?.trim() || null;
    const { data, error } = await supabase.from("product_colors").insert({ product_id: p.id, name, hex, sort_order: colors.length }).select().single();
    if (error) { toast.error(error.message); return; }
    setColors((cur) => [...cur, data as any]);
  };
  const removeColor = async (id: string) => {
    await supabase.from("product_colors").delete().eq("id", id);
    setColors((cur) => cur.filter((c) => c.id !== id));
  };

  return (
    <>
      <div className="fixed inset-0 bg-ink/80 backdrop-blur-sm z-40" onClick={onClose}/>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none overflow-y-auto">
        <div className="bg-card w-full max-w-3xl ink-border pointer-events-auto my-8">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="font-black text-xl">Edit Product</h2>
            <button onClick={onClose} className="hover:text-primary"><X size={20}/></button>
          </div>

          <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
            <Field label="Title" value={p.title} onChange={(v) => setP({ ...p, title: v })}/>
            <div>
              <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">Description</label>
              <textarea value={p.description ?? ""} onChange={(e) => setP({ ...p, description: e.target.value })} rows={3} className="w-full bg-background px-3 py-2 ink-border focus:outline-none focus:border-primary"/>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">Price</label>
                <input type="number" step="0.01" value={p.price ?? ""} onChange={(e) => setP({ ...p, price: e.target.value === "" ? null : parseFloat(e.target.value) })} className="w-full bg-background px-3 py-2 ink-border focus:outline-none focus:border-primary"/>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">Currency</label>
                <select value={p.currency} onChange={(e) => setP({ ...p, currency: e.target.value })} className="w-full bg-background px-3 py-2 ink-border focus:outline-none focus:border-primary">
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={p.whatsapp_only} onChange={(e) => setP({ ...p, whatsapp_only: e.target.checked })}/>
              Hide price — show "WhatsApp" instead
            </label>

            {/* Images */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs uppercase tracking-widest text-muted-foreground">Photos ({imgs.length})</label>
                <div className="flex gap-2">
                  <button onClick={addUrlImage} className="text-[10px] uppercase tracking-widest bg-card ink-border px-2 py-1 hover:bg-primary hover:text-primary-foreground">Add URL</button>
                  <label className="text-[10px] uppercase tracking-widest bg-primary text-primary-foreground px-2 py-1 cursor-pointer flex items-center gap-1"><Upload size={10}/> Upload
                    <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => upload(e.target.files)}/>
                  </label>
                </div>
              </div>
              <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                {imgs.map((im) => (
                  <div key={im.id} className="relative group ink-border bg-muted aspect-square">
                    <img src={resolveImageUrl(im.url, settings?.image_base_url ?? "")} alt="" className="w-full h-full object-cover"/>
                    <div className="absolute inset-0 bg-ink/70 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-1">
                      <div className="flex gap-1">
                        <button onClick={() => moveImg(im.id, -1)} className="bg-card text-foreground p-1"><ChevronUp size={12}/></button>
                        <button onClick={() => moveImg(im.id, 1)} className="bg-card text-foreground p-1"><ChevronDown size={12}/></button>
                      </div>
                      <button onClick={() => removeImg(im.id)} className="bg-destructive text-destructive-foreground p-1"><Trash2 size={12}/></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sizes */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs uppercase tracking-widest text-muted-foreground">Sizes — leave empty if N/A ({sizes.length})</label>
                <button onClick={addSize} className="text-[10px] uppercase tracking-widest bg-primary text-primary-foreground px-2 py-1">+ Add</button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {sizes.map((s) => (
                  <div key={s.id} className="flex items-center gap-1 ink-border px-2 py-1 text-xs">
                    {s.size}
                    <button onClick={() => removeSize(s.id)} className="text-destructive hover:opacity-70"><X size={10}/></button>
                  </div>
                ))}
              </div>
            </div>

            {/* Colors */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs uppercase tracking-widest text-muted-foreground">Colors — only those visible on photos ({colors.length})</label>
                <button onClick={addColor} className="text-[10px] uppercase tracking-widest bg-primary text-primary-foreground px-2 py-1">+ Add</button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {colors.map((c) => (
                  <div key={c.id} className="flex items-center gap-1.5 ink-border px-2 py-1 text-xs">
                    {c.hex && <span className="w-3 h-3 rounded-full border border-ink/20" style={{ background: c.hex }} />}
                    {c.name}
                    <button onClick={() => removeColor(c.id)} className="text-destructive hover:opacity-70"><X size={10}/></button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 border-t border-border bg-muted">
            <button onClick={del} className="text-destructive text-xs uppercase tracking-widest hover:underline flex items-center gap-1"><Trash2 size={12}/> Delete product</button>
            <div className="flex gap-2">
              <button onClick={onClose} className="px-4 py-2 ink-border text-xs uppercase tracking-widest">Cancel</button>
              <button onClick={save} disabled={busy} className="bg-primary text-primary-foreground px-6 py-2 text-xs uppercase tracking-widest font-bold disabled:opacity-50">{busy ? "..." : "Save"}</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
