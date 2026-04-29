import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Brand, Category, Product, SiteSettings, fetchBrands, fetchCategories, fetchProducts, fetchSettings, resolveImageUrl, formatPrice } from "@/lib/catalog";
import { Logo } from "@/components/catalog/Logo";
import { toast } from "sonner";
import { Plus, Trash2, LogOut, Upload, X, ChevronUp, ChevronDown, Settings as SettingsIcon } from "lucide-react";

const slugify = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

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
  const [view, setView] = useState<"products" | "settings">("products");

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
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-72 bg-ink text-sidebar-foreground flex flex-col h-screen sticky top-0">
        <div className="p-5 border-b border-sidebar-border"><Logo size="md"/></div>
        <div className="p-3 text-[10px] uppercase tracking-widest text-muted-foreground border-b border-sidebar-border">
          Admin · {userEmail}
        </div>

        <nav className="flex-1 overflow-y-auto">
          <button
            onClick={() => setView("products")}
            className={`w-full text-left px-4 py-2.5 text-sm font-bold uppercase tracking-widest border-b border-sidebar-border ${view === "products" ? "bg-primary text-primary-foreground" : "hover:bg-sidebar-accent"}`}
          >Products</button>
          <button
            onClick={() => setView("settings")}
            className={`w-full text-left px-4 py-2.5 text-sm font-bold uppercase tracking-widest border-b border-sidebar-border ${view === "settings" ? "bg-primary text-primary-foreground" : "hover:bg-sidebar-accent"}`}
          ><SettingsIcon size={12} className="inline mr-1.5"/>Settings</button>

          {view === "products" && (
            <>
              <div className="px-3 pt-4 pb-2 text-[10px] uppercase tracking-widest text-muted-foreground flex justify-between items-center">
                <span>Brands ({brands.length})</span>
                <button onClick={() => addBrand(reload)} className="text-primary hover:text-accent"><Plus size={14}/></button>
              </div>
              <button
                onClick={() => { setBrandId(null); setCategoryId(null); }}
                className={`w-full text-left px-4 py-2 text-sm border-b border-sidebar-border/40 ${brandId === null ? "bg-primary text-primary-foreground" : "hover:bg-sidebar-accent"}`}
              >All</button>
              {brands.map((b) => (
                <button key={b.id}
                  onClick={() => { setBrandId(b.id); setCategoryId(null); }}
                  className={`w-full text-left px-4 py-2 text-sm border-b border-sidebar-border/40 ${brandId === b.id ? "bg-primary text-primary-foreground" : "hover:bg-sidebar-accent"}`}
                >{b.name}</button>
              ))}
            </>
          )}
        </nav>

        <div className="p-3 border-t border-sidebar-border space-y-2">
          <button
            onClick={() => nav("/")}
            className="w-full text-xs uppercase tracking-widest bg-sidebar-accent py-2 hover:bg-primary hover:text-primary-foreground"
          >View Site →</button>
          <button
            onClick={async () => { await supabase.auth.signOut(); nav("/"); }}
            className="w-full text-xs uppercase tracking-widest bg-sidebar-accent py-2 hover:bg-destructive flex items-center justify-center gap-1"
          ><LogOut size={12}/> Sign Out</button>
        </div>
      </aside>

      <main className="flex-1 p-6 overflow-x-hidden">
        {view === "settings" && settings ? (
          <SettingsPanel settings={settings} onSaved={reload}/>
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
    </div>
  );
}

// ============== Brand quick add ==============
async function addBrand(onDone: () => void) {
  const name = prompt("Brand name?")?.trim();
  if (!name) return;
  const slug = slugify(name);
  const { error } = await supabase.from("brands").insert({ name, slug });
  if (error) { toast.error(error.message); return; }
  toast.success("Brand added");
  onDone();
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
    if (!brandId || !categoryId) { toast.error("Pick a brand and category first"); return; }
    const title = prompt("Product title?")?.trim();
    if (!title) return;
    const { data, error } = await supabase.from("products").insert({
      brand_id: brandId, category_id: categoryId, title, price: 15, currency: "USD"
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
            <button onClick={newProduct} disabled={!categoryId} className="text-xs uppercase tracking-widest bg-primary text-primary-foreground px-4 py-2 disabled:opacity-50"><Plus size={12} className="inline mr-1"/>New Product</button>
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
  const [busy, setBusy] = useState(false);

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
                <input value={p.currency} onChange={(e) => setP({ ...p, currency: e.target.value })} className="w-full bg-background px-3 py-2 ink-border focus:outline-none focus:border-primary"/>
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
                <label className="text-xs uppercase tracking-widest text-muted-foreground">Sizes ({sizes.length})</label>
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
