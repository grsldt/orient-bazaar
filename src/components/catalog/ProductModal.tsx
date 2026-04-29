import { Product, SiteSettings, resolveImageUrl, buildWhatsappUrl, formatPrice } from "@/lib/catalog";
import { useEffect, useState } from "react";
import { X, ChevronLeft, ChevronRight, MessageCircle } from "lucide-react";
import { toast } from "sonner";

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

  useEffect(() => { setIdx(0); setSize(""); setColor(""); }, [product?.id]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!product) return;
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") setIdx((i) => (i - 1 + (product.images?.length || 1)) % (product.images?.length || 1));
      if (e.key === "ArrowRight") setIdx((i) => (i + 1) % (product.images?.length || 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, product]);

  if (!product) return null;
  const imgs = product.images ?? [];
  const sizes = product.sizes ?? [];
  const colors = product.colors ?? [];

  const order = () => {
    if (sizes.length > 0 && !size) { toast.error("Please choose a size first"); return; }
    if (colors.length > 0 && !color) { toast.error("Please choose a color first"); return; }
    const lines = [
      "Hi LÓNG SHÌ 龙市,",
      "",
      "I'd like to order:",
      `• ${brandName ? brandName + " — " : ""}${product.title}`,
    ];
    if (color) lines.push(`• Color: ${color}`);
    if (size) lines.push(`• Size: ${size}`);
    if (!product.whatsapp_only && product.price) lines.push(`• Price: ${formatPrice(product.price, product.currency)}`);
    lines.push("", "Thanks!");
    const url = buildWhatsappUrl(settings.whatsapp_number, lines.join("\n"));
    window.open(url, "_blank", "noopener");
  };

  return (
    <>
      <div className="fixed inset-0 bg-ink/85 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-6 pointer-events-none">
        <div className="bg-card w-full max-w-4xl max-h-[95vh] overflow-hidden ink-border pointer-events-auto flex flex-col md:flex-row rounded-sm shadow-2xl">
          {/* Gallery */}
          <div className="md:w-[55%] bg-muted relative flex items-center justify-center min-h-[280px] md:min-h-[520px]">
            {imgs[idx] && (
              <img
                src={resolveImageUrl(imgs[idx].url, settings.image_base_url)}
                alt={product.title}
                className="max-h-[60vh] md:max-h-[520px] max-w-full object-contain"
              />
            )}
            {imgs.length > 1 && (
              <>
                <button
                  onClick={() => setIdx((idx - 1 + imgs.length) % imgs.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-ink/80 text-background w-9 h-9 rounded-full flex items-center justify-center hover:bg-primary transition"
                  aria-label="Previous"
                ><ChevronLeft size={18} /></button>
                <button
                  onClick={() => setIdx((idx + 1) % imgs.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-ink/80 text-background w-9 h-9 rounded-full flex items-center justify-center hover:bg-primary transition"
                  aria-label="Next"
                ><ChevronRight size={18} /></button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-ink/85 text-background text-xs px-2.5 py-1 rounded-full font-medium">
                  {idx + 1} / {imgs.length}
                </div>
              </>
            )}
            <button onClick={onClose} aria-label="Close" className="md:hidden absolute top-2 right-2 bg-ink/80 text-background w-9 h-9 rounded-full flex items-center justify-center">
              <X size={18}/>
            </button>
          </div>

          {/* Info */}
          <div className="md:w-[45%] flex flex-col min-h-0">
            <div className="hidden md:flex items-center justify-between p-4 border-b border-border">
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground truncate">
                {brandName} {categoryName && `· ${categoryName}`}
              </div>
              <button onClick={onClose} aria-label="Close" className="hover:text-primary shrink-0 ml-2">
                <X size={18}/>
              </button>
            </div>

            <div className="p-4 md:p-5 overflow-y-auto flex-1">
              <div className="md:hidden text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">
                {brandName} {categoryName && `· ${categoryName}`}
              </div>
              <h2 className="text-lg md:text-xl font-bold mb-2 leading-tight">{product.title}</h2>
              {product.description && <p className="text-sm text-muted-foreground mb-3">{product.description}</p>}
              <div className="mb-5">
                {product.whatsapp_only ? (
                  <div className="text-xl font-black text-primary">Price on WhatsApp</div>
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
                      <button
                        key={c.id}
                        onClick={() => setColor(c.name)}
                        title={c.name}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold border-2 transition ${color === c.name ? "border-primary bg-primary/10" : "border-border hover:border-foreground/40"}`}
                      >
                        {c.hex && <span className="w-3.5 h-3.5 rounded-full border border-ink/20" style={{ background: c.hex }} />}
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
                    {sizes.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setSize(s.size)}
                        className={`min-w-[42px] px-3 py-1.5 text-xs font-bold border-2 transition ${size === s.size ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-foreground/40"}`}
                      >{s.size}</button>
                    ))}
                  </div>
                </div>
              )}

              {imgs.length > 1 && (
                <div className="mt-4">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Photos</div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {imgs.map((im, i) => (
                      <button
                        key={im.id}
                        onClick={() => setIdx(i)}
                        className={`aspect-square overflow-hidden border-2 transition ${i === idx ? "border-primary" : "border-transparent hover:border-foreground/30"}`}
                      >
                        <img src={resolveImageUrl(im.url, settings.image_base_url)} alt="" loading="lazy" className="w-full h-full object-cover"/>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={order}
              className="block w-full text-center bg-jade text-white font-bold uppercase tracking-widest py-4 hover:opacity-90 transition shrink-0"
            >
              <MessageCircle className="inline mr-2" size={18}/> Order via WhatsApp
            </button>
          </div>
        </div>
      </div>
    </>
  );
};