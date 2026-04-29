import { Product, SiteSettings, resolveImageUrl, thumbUrl, buildWhatsappUrl, formatPrice, defaultSizesFor } from "@/lib/catalog";
import { useEffect, useRef, useState } from "react";
import { X, ChevronLeft, ChevronRight, MessageCircle, Share2, ShoppingBag, Check } from "lucide-react";
import { toast } from "sonner";
import { useScrollLock } from "@/hooks/useScrollLock";
import { useCart } from "@/hooks/useCart";

interface Props {
  product: Product | null;
  brandName?: string;
  categoryName?: string;
  settings: SiteSettings;
  onClose: () => void;
}

export const ProductModal = ({ product, brandName, categoryName, settings, onClose }: Props) => {
  const [idx, setIdx] = useState(0);
  const [size, setSize] = useState<string>("");
  const [color, setColor] = useState<string>("");
  const touchStart = useRef<number | null>(null);

  const cart = useCart();

  useScrollLock(!!product);
  useEffect(() => { setIdx(0); setSize(""); setColor(""); }, [product?.id]);

  useEffect(() => {
    if (!product) return;
    const onKey = (e: KeyboardEvent) => {
      const len = product.images?.length || 1;
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") setIdx((i) => (i - 1 + len) % len);
      if (e.key === "ArrowRight") setIdx((i) => (i + 1) % len);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, product]);

  if (!product) return null;
  const imgs = product.images ?? [];
  // Use saved sizes if any, otherwise auto-generate from category type
  const savedSizes = product.sizes ?? [];
  const sizes = savedSizes.length > 0
    ? savedSizes.map((s) => s.size)
    : defaultSizesFor(categoryName);
  const colors = product.colors ?? [];
  const len = imgs.length || 1;

  const next = () => setIdx((idx + 1) % len);
  const prev = () => setIdx((idx - 1 + len) % len);

  const onTouchStart = (e: React.TouchEvent) => { touchStart.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStart.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStart.current;
    if (Math.abs(dx) > 40) { dx < 0 ? next() : prev(); }
    touchStart.current = null;
  };

  const order = () => {
    if (sizes.length > 0 && !size) { toast.error("Please choose a size first"); return; }
    if (colors.length > 0 && !color) { toast.error("Please choose a color first"); return; }
    const lines = [
      "Hi LÓNG SHÌ 龙市,", "", "I'd like to order:",
      `• ${brandName ? brandName + " — " : ""}${product.title}`,
    ];
    if (color) lines.push(`• Color: ${color}`);
    if (size) lines.push(`• Size: ${size}`);
    if (!product.whatsapp_only && product.price) lines.push(`• Price: ${formatPrice(product.price, product.currency)}`);
    lines.push("", "Thanks!");
    window.open(buildWhatsappUrl(settings.whatsapp_number, lines.join("\n")), "_blank", "noopener");
  };

  const share = async () => {
    const url = `${window.location.origin}/?p=${product.id}`;
    try {
      if (navigator.share) await navigator.share({ title: product.title, url });
      else { await navigator.clipboard.writeText(url); toast.success("Link copied"); }
    } catch {}
  };

  const addToCart = () => {
    if (sizes.length > 0 && !size) { toast.error("Please choose a size first"); return; }
    if (colors.length > 0 && !color) { toast.error("Please choose a color first"); return; }
    cart.add({ id: product.id, size: size || undefined, color: color || undefined });
    toast.success("Added to cart");
  };
  const inCart = cart.hasProduct(product.id);

  return (
    <div
      className="fixed inset-0 z-50 bg-ink/90 backdrop-blur-sm overflow-hidden flex items-stretch md:items-center justify-center md:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-card w-full md:max-w-5xl md:max-h-[92vh] flex flex-col md:flex-row overflow-hidden shadow-2xl md:rounded-sm md:ink-border h-[100dvh] md:h-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar (mobile only) */}
        <div className="md:hidden flex items-center justify-between px-3 py-2 border-b border-border shrink-0">
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground truncate">
            {brandName} {categoryName && `· ${categoryName}`}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={share} aria-label="Share" className="p-2 hover:text-primary"><Share2 size={18}/></button>
            <button onClick={onClose} aria-label="Close" className="p-2 hover:text-primary"><X size={20}/></button>
          </div>
        </div>

        {/* Gallery */}
        <div
          className="md:w-3/5 bg-muted relative flex items-center justify-center select-none shrink-0 md:shrink"
          style={{ minHeight: 0 }}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <div className="w-full h-[42vh] md:h-[78vh] flex items-center justify-center overflow-hidden">
            {imgs[idx] && (
              <img
                src={resolveImageUrl(imgs[idx].url, settings.image_base_url)}
                alt={product.title}
                className="max-h-full max-w-full object-contain"
                draggable={false}
              />
            )}
          </div>
          {imgs.length > 1 && (
            <>
              <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 bg-ink/70 text-background w-9 h-9 rounded-full flex items-center justify-center hover:bg-primary transition" aria-label="Previous"><ChevronLeft size={18}/></button>
              <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 bg-ink/70 text-background w-9 h-9 rounded-full flex items-center justify-center hover:bg-primary transition" aria-label="Next"><ChevronRight size={18}/></button>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-ink/85 text-background text-[11px] px-2 py-0.5 rounded-full font-medium">{idx + 1} / {imgs.length}</div>
            </>
          )}
        </div>

        {/* Info pane */}
        <div className="md:w-2/5 flex flex-col min-h-0 flex-1">
          {/* Top bar (desktop) */}
          <div className="hidden md:flex items-center justify-between p-4 border-b border-border shrink-0">
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground truncate">
              {brandName} {categoryName && `· ${categoryName}`}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={share} aria-label="Share" className="p-1.5 hover:text-primary"><Share2 size={16}/></button>
              <button onClick={onClose} aria-label="Close" className="p-1.5 hover:text-primary"><X size={18}/></button>
            </div>
          </div>

          <div className="p-4 md:p-5 overflow-y-auto flex-1 min-h-0 no-scrollbar">
            <h2 className="text-lg md:text-xl font-bold mb-1 leading-tight">{product.title}</h2>
            {product.description && <p className="text-sm text-muted-foreground mb-3">{product.description}</p>}
            <div className="mb-4">
              {product.whatsapp_only ? (
                <div className="text-lg font-black text-primary">Price on WhatsApp</div>
              ) : product.price ? (
                <div className="text-2xl md:text-3xl font-black">{formatPrice(product.price, product.currency)}</div>
              ) : null}
            </div>

            {colors.length > 0 && (
              <div className="mb-4">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
                  Color {color && <span className="text-foreground normal-case tracking-normal">· {color}</span>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {colors.map((c) => (
                    <button key={c.id} onClick={() => setColor(c.name)} title={c.name}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold border-2 transition ${color === c.name ? "border-primary bg-primary/10" : "border-border hover:border-foreground/40"}`}>
                      {c.hex && <span className="w-3.5 h-3.5 rounded-full border border-ink/20" style={{ background: c.hex }}/>}
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {sizes.length > 0 && (
              <div className="mb-4">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
                  Size {size && <span className="text-foreground normal-case tracking-normal">· {size}</span>}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {sizes.map((sv) => (
                    <button key={sv} onClick={() => setSize(sv)}
                      className={`min-w-[42px] px-3 py-1.5 text-xs font-bold border-2 transition ${size === sv ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-foreground/40"}`}>
                      {sv}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {imgs.length > 1 && (
              <div className="mt-4">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Photos</div>
                <div className="grid grid-cols-5 sm:grid-cols-6 gap-1.5">
                  {imgs.map((im, i) => (
                    <button key={im.id} onClick={() => setIdx(i)}
                      className={`aspect-square overflow-hidden border-2 transition ${i === idx ? "border-primary" : "border-transparent hover:border-foreground/30"}`}>
                      <img src={thumbUrl(im.url, settings.image_base_url, 160)} alt="" loading="lazy" className="w-full h-full object-cover"/>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-[1fr_auto] gap-0 shrink-0 border-t border-border">
            <button onClick={order}
              className="bg-jade text-white font-bold uppercase tracking-widest py-4 text-sm hover:opacity-90 transition flex items-center justify-center gap-2">
              <MessageCircle size={18}/> Order via WhatsApp
            </button>
            <button onClick={addToCart} title="Add to cart"
              className={`px-5 font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-1.5 transition ${inCart ? "bg-accent text-accent-foreground hover:bg-primary" : "bg-ink text-background hover:bg-primary"}`}>
              {inCart ? <><Check size={16}/> Add more</> : <><ShoppingBag size={16}/> Add</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
