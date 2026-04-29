import { useEffect, useMemo, useState } from "react";
import { Brand, Category, Product, SiteSettings, fetchBrands, fetchCategories, fetchProducts, fetchSettings } from "@/lib/catalog";
import { Sidebar } from "@/components/catalog/Sidebar";
import { ProductCard } from "@/components/catalog/ProductCard";
import { ProductModal } from "@/components/catalog/ProductModal";
import { HomePresentation } from "@/components/catalog/HomePresentation";
import { CartDrawer } from "@/components/catalog/CartDrawer";
import { Search, ShoppingBag, Heart, Menu } from "lucide-react";
import { useLocalList } from "@/hooks/useLocalList";

const PAGE_SIZE = 48;

const Index = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<SiteSettings>({ whatsapp_number: "+12532237370", tracking_url: "https://neocartrige.com", image_base_url: "" });
  const [brandId, setBrandId] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [sort, setSort] = useState("featured");
  const [open, setOpen] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [cartOpen, setCartOpen] = useState(false);
  const [favOnly, setFavOnly] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const cart = useLocalList("ls_cart");
  const favorites = useLocalList("ls_favorites");

  useEffect(() => {
    Promise.all([fetchBrands(), fetchCategories(), fetchSettings()]).then(([b, c, s]) => {
      setBrands(b); setCategories(c); setSettings(s);
    });
  }, []);

  // Debounce search → fewer DB hits
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 250);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setLoading(true);
    setVisible(PAGE_SIZE);
    fetchProducts({ brandId, categoryId, search: debounced }).then((p) => {
      setProducts(p); setLoading(false);
    });
  }, [brandId, categoryId, debounced]);

  useEffect(() => { setCategoryId(null); }, [brandId]);

  // Deep link: /?p=<id> opens that product on first load
  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get("p");
    if (p) fetchProducts({}).then((arr) => {
      const found = arr.find((x) => x.id === p);
      if (found) setOpen(found);
    });
  }, []);

  const brandCats = useMemo(() => brandId ? categories.filter((c) => c.brand_id === brandId) : [], [brandId, categories]);
  const currentBrand = brands.find((b) => b.id === brandId);

  const filteredFav = useMemo(() => favOnly ? products.filter((p) => favorites.has(p.id)) : products, [products, favOnly, favorites]);

  const sorted = useMemo(() => {
    const arr = [...filteredFav];
    if (sort === "priceLow") arr.sort((a, b) => (a.price ?? 999) - (b.price ?? 999));
    else if (sort === "priceHigh") arr.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    else if (sort === "az") arr.sort((a, b) => a.title.localeCompare(b.title));
    else if (sort === "za") arr.sort((a, b) => b.title.localeCompare(a.title));
    return arr;
  }, [filteredFav, sort]);

  const brandLookup = useMemo(() => Object.fromEntries(brands.map((b) => [b.id, b.name])), [brands]);
  const catLookup = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c.name])), [categories]);

  const showHome = !brandId && !debounced && !favOnly;
  const shown = sorted.slice(0, visible);

  return (
    <div className="flex min-h-screen">
      <Sidebar
        brands={brands}
        selectedBrandId={brandId}
        onSelectBrand={setBrandId}
        settings={settings}
        mobileOpen={navOpen}
        onCloseMobile={() => setNavOpen(false)}
      />

      <main className="flex-1 flex flex-col min-w-0">
        {/* Mobile topbar */}
        <div className="md:hidden sticky top-0 z-30 bg-ink text-background flex items-center justify-between px-3 py-2 border-b-2 border-primary">
          <button onClick={() => setNavOpen(true)} aria-label="Open menu" className="p-2 -ml-2">
            <Menu size={22}/>
          </button>
          <div className="flex items-center gap-2">
            <span className="han text-primary text-xl leading-none">龙市</span>
            <span className="text-[10px] uppercase tracking-[0.25em]">LÓNG SHÌ</span>
          </div>
          <button
            onClick={() => { setBrandId(null); setSearch(""); setFavOnly(false); }}
            className="text-[10px] uppercase tracking-widest px-2 py-1 hover:text-primary"
          >
            Home
          </button>
        </div>

        {showHome ? (
          <HomePresentation brands={brands} settings={settings} onSelectBrand={(id) => setBrandId(id)} />
        ) : (
          <>
            <div className="relative bg-ink text-background overflow-hidden border-b-4 border-primary">
              <div className="absolute inset-0 flex items-center justify-end pr-8 pointer-events-none opacity-10">
                <span className="han text-[180px] leading-none text-primary">龙市</span>
              </div>
              <div className="relative px-6 py-6">
                <div className="text-[10px] uppercase tracking-[0.3em] text-accent mb-1">东方批发市场 · Eastern Wholesale</div>
                <h1 className="text-2xl md:text-3xl font-black">
                  {favOnly ? "Your favorites" : currentBrand ? currentBrand.name : `Search: "${debounced}"`}
                </h1>
                <p className="text-xs text-muted-foreground mt-1">
                  {sorted.length} item(s) · Click any product to order via WhatsApp
                </p>
              </div>
            </div>

            <div className="sticky top-[44px] md:top-0 z-20 bg-background border-b border-ink/20 px-3 md:px-4 py-2 md:py-3 flex flex-wrap gap-2 items-center">
              <div className="relative flex-1 min-w-[160px]">
                <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground"/>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search product..."
                  className="w-full bg-card text-sm pl-8 pr-2 py-2 ink-border focus:outline-none focus:border-primary"
                />
              </div>
              {brandId && brandCats.length > 0 && (
                <select value={categoryId ?? ""} onChange={(e) => setCategoryId(e.target.value || null)}
                  className="bg-card text-sm px-3 py-2 ink-border focus:outline-none focus:border-primary">
                  <option value="">All categories</option>
                  {brandCats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              )}
              <select value={sort} onChange={(e) => setSort(e.target.value)} className="bg-card text-sm px-3 py-2 ink-border focus:outline-none focus:border-primary">
                <option value="featured">Featured</option>
                <option value="priceLow">Price ↑</option>
                <option value="priceHigh">Price ↓</option>
                <option value="az">A → Z</option>
                <option value="za">Z → A</option>
              </select>
              <button onClick={() => setFavOnly((x) => !x)} title="Show favorites only"
                className={`px-3 py-2 ink-border text-sm flex items-center gap-1.5 ${favOnly ? "bg-primary text-primary-foreground" : "bg-card hover:bg-muted"}`}>
                <Heart size={14} className={favOnly ? "fill-current" : ""}/> {favorites.items.length}
              </button>
            </div>

            <section className="flex-1 p-3 md:p-5">
              {loading ? (
                <div className="grid-product">
                  {Array.from({ length: 12 }).map((_, i) => <div key={i} className="aspect-square bg-muted animate-pulse"/>)}
                </div>
              ) : shown.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground">
                  <div className="han text-6xl mb-2">无</div>
                  <p>No products found.</p>
                </div>
              ) : (
                <>
                  <div className="grid-product">
                    {shown.map((p) => (
                      <ProductCard key={p.id} product={p} settings={settings} brandName={brandLookup[p.brand_id]} onClick={() => setOpen(p)}/>
                    ))}
                  </div>
                  {visible < sorted.length && (
                    <div className="flex justify-center mt-6">
                      <button onClick={() => setVisible((v) => v + PAGE_SIZE)}
                        className="bg-ink text-background px-8 py-3 text-xs uppercase tracking-widest font-bold hover:bg-primary transition">
                        Load more ({sorted.length - visible} left)
                      </button>
                    </div>
                  )}
                </>
              )}
            </section>

            <footer className="bg-ink text-background text-xs uppercase tracking-widest p-4 flex justify-between items-center">
              <span>© LÓNG SHÌ 龙市 · Dragon Market</span>
              <span className="text-muted-foreground">All orders via WhatsApp</span>
            </footer>
          </>
        )}
      </main>

      {/* Floating cart button */}
      {cart.items.length > 0 && (
        <button
          onClick={() => setCartOpen(true)}
          className="fixed bottom-4 right-4 z-40 bg-jade text-white shadow-2xl rounded-full w-14 h-14 flex items-center justify-center hover:scale-105 transition"
          aria-label="Open selection"
        >
          <ShoppingBag size={22}/>
          <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-black rounded-full min-w-5 h-5 px-1 flex items-center justify-center">
            {cart.items.length}
          </span>
        </button>
      )}

      <ProductModal
        product={open}
        brandName={open ? brandLookup[open.brand_id] : undefined}
        categoryName={open ? catLookup[open.category_id] : undefined}
        settings={settings}
        onClose={() => setOpen(null)}
      />

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} settings={settings} brandLookup={brandLookup}/>
    </div>
  );
};

export default Index;
