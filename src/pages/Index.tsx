import { useEffect, useMemo, useState } from "react";
import { Brand, Category, Product, SiteSettings, fetchBrands, fetchCategories, fetchProducts, fetchSettings } from "@/lib/catalog";
import { Sidebar } from "@/components/catalog/Sidebar";
import { ProductCard } from "@/components/catalog/ProductCard";
import { ProductModal } from "@/components/catalog/ProductModal";
import { HomePresentation } from "@/components/catalog/HomePresentation";
import { Search } from "lucide-react";

const Index = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<SiteSettings>({ whatsapp_number: "+12532237370", tracking_url: "https://neocartrige.com", image_base_url: "" });
  const [brandId, setBrandId] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("featured");
  const [open, setOpen] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchBrands(), fetchCategories(), fetchSettings()]).then(([b, c, s]) => {
      setBrands(b); setCategories(c); setSettings(s);
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchProducts({ brandId, categoryId, search }).then((p) => {
      setProducts(p); setLoading(false);
    });
  }, [brandId, categoryId, search]);

  useEffect(() => { setCategoryId(null); }, [brandId]);

  const brandCats = useMemo(() => brandId ? categories.filter((c) => c.brand_id === brandId) : [], [brandId, categories]);
  const currentBrand = brands.find((b) => b.id === brandId);

  const sorted = useMemo(() => {
    const arr = [...products];
    if (sort === "priceLow") arr.sort((a, b) => (a.price ?? 999) - (b.price ?? 999));
    else if (sort === "priceHigh") arr.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    else if (sort === "az") arr.sort((a, b) => a.title.localeCompare(b.title));
    else if (sort === "za") arr.sort((a, b) => b.title.localeCompare(a.title));
    return arr;
  }, [products, sort]);

  const brandLookup = useMemo(() => Object.fromEntries(brands.map((b) => [b.id, b.name])), [brands]);
  const catLookup = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c.name])), [categories]);

  const showHome = !brandId && !search.trim();

  return (
    <div className="flex min-h-screen">
      <Sidebar
        brands={brands}
        selectedBrandId={brandId}
        onSelectBrand={setBrandId}
        settings={settings}
      />

      <main className="flex-1 flex flex-col min-w-0">
        {showHome ? (
          <HomePresentation brands={brands} settings={settings} onSelectBrand={(id) => setBrandId(id)} />
        ) : (
          <>
        {/* Decorative banner */}
        <div className="relative bg-ink text-background overflow-hidden border-b-4 border-primary">
          <div className="absolute inset-0 flex items-center justify-end pr-8 pointer-events-none opacity-10">
            <span className="han text-[180px] leading-none text-primary">龙市</span>
          </div>
          <div className="relative px-6 py-6">
            <div className="text-[10px] uppercase tracking-[0.3em] text-accent mb-1">东方批发市场 · Eastern Wholesale</div>
            <h1 className="text-2xl md:text-3xl font-black">
              {currentBrand ? currentBrand.name : "All Products"}
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              {sorted.length} items · Click any product to order via WhatsApp
            </p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="sticky top-0 z-30 bg-background border-b border-ink/20 px-4 py-3 flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground"/>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search product..."
              className="w-full bg-card text-sm pl-8 pr-2 py-2 ink-border focus:outline-none focus:border-primary"
            />
          </div>
          {brandId && brandCats.length > 0 && (
            <select
              value={categoryId ?? ""}
              onChange={(e) => setCategoryId(e.target.value || null)}
              className="bg-card text-sm px-3 py-2 ink-border focus:outline-none focus:border-primary"
            >
              <option value="">All categories</option>
              {brandCats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="bg-card text-sm px-3 py-2 ink-border focus:outline-none focus:border-primary"
          >
            <option value="featured">Featured</option>
            <option value="priceLow">Price ↑</option>
            <option value="priceHigh">Price ↓</option>
            <option value="az">A → Z</option>
            <option value="za">Z → A</option>
          </select>
        </div>

        {/* Grid */}
        <section className="flex-1 p-3 md:p-5">
          {loading ? (
            <div className="grid-product">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="aspect-square bg-muted animate-pulse" />
              ))}
            </div>
          ) : sorted.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <div className="han text-6xl mb-2">无</div>
              <p>No products found.</p>
            </div>
          ) : (
            <div className="grid-product">
              {sorted.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  settings={settings}
                  brandName={brandLookup[p.brand_id]}
                  onClick={() => setOpen(p)}
                />
              ))}
            </div>
          )}
        </section>

        <footer className="bg-ink text-background text-xs uppercase tracking-widest p-4 flex justify-between items-center">
          <span>© LÓNG SHÌ 龙市 · Dragon Market</span>
          <span className="text-muted-foreground">All orders via WhatsApp</span>
        </footer>
          </>
        )}
      </main>

      <ProductModal
        product={open}
        brandName={open ? brandLookup[open.brand_id] : undefined}
        categoryName={open ? catLookup[open.category_id] : undefined}
        settings={settings}
        onClose={() => setOpen(null)}
      />
    </div>
  );
};

export default Index;
