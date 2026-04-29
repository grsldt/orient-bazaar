import { Product, SiteSettings, resolveImageUrl, buildWhatsappUrl } from "@/lib/catalog";
import { useEffect, useState } from "react";
import { X, ChevronLeft, ChevronRight, MessageCircle } from "lucide-react";

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

  useEffect(() => { setIdx(0); setSize(""); }, [product?.id]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!product) return null;
  const imgs = product.images ?? [];
  const sizes = product.sizes ?? [];

  const orderMsg = `Hi LÓNG SHÌ 龙市,\n\nI'd like to order:\n• ${brandName ?? ""} — ${product.title}${size ? `\n• Size: ${size}` : ""}${product.price ? `\n• Price: ${product.price}€` : ""}\n\nThanks!`;
  const waUrl = buildWhatsappUrl(settings.whatsapp_number, orderMsg);

  return (
    <>
      <div className="fixed inset-0 bg-ink/80 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-card w-full max-w-5xl max-h-[92vh] overflow-hidden ink-border pointer-events-auto flex flex-col md:flex-row">
          {/* Gallery */}
          <div className="md:w-3/5 bg-muted relative flex items-center justify-center min-h-[300px] md:min-h-[500px]">
            {imgs[idx] && (
              <img
                src={resolveImageUrl(imgs[idx].url, settings.image_base_url)}
                alt={product.title}
                className="max-h-full max-w-full object-contain"
              />
            )}
            {imgs.length > 1 && (
              <>
                <button
                  onClick={() => setIdx((idx - 1 + imgs.length) % imgs.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-ink/70 text-background p-2 hover:bg-primary"
                  aria-label="Previous"
                ><ChevronLeft size={20} /></button>
                <button
                  onClick={() => setIdx((idx + 1) % imgs.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-ink/70 text-background p-2 hover:bg-primary"
                  aria-label="Next"
                ><ChevronRight size={20} /></button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-ink/80 text-background text-xs px-2 py-0.5">
                  {idx + 1} / {imgs.length}
                </div>
              </>
            )}
          </div>

          {/* Info */}
          <div className="md:w-2/5 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                {brandName} {categoryName && `· ${categoryName}`}
              </div>
              <button onClick={onClose} aria-label="Close" className="hover:text-primary">
                <X size={20}/>
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1">
              <h2 className="text-xl font-bold mb-2">{product.title}</h2>
              {product.description && <p className="text-sm text-muted-foreground mb-4">{product.description}</p>}
              <div className="mb-4">
                {product.whatsapp_only ? (
                  <div className="text-2xl font-black text-primary">Price on WhatsApp</div>
                ) : product.price ? (
                  <div className="text-3xl font-black">{product.price}€</div>
                ) : null}
              </div>

              {sizes.length > 0 && (
                <div className="mb-4">
                  <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Size 尺码</div>
                  <div className="flex flex-wrap gap-1.5">
                    {sizes.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setSize(s.size)}
                        className={`px-3 py-1.5 text-xs font-bold border ${size === s.size ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary"}`}
                      >{s.size}</button>
                    ))}
                  </div>
                </div>
              )}

              {imgs.length > 1 && (
                <div className="mt-4">
                  <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Photos</div>
                  <div className="grid grid-cols-5 gap-1">
                    {imgs.map((im, i) => (
                      <button
                        key={im.id}
                        onClick={() => setIdx(i)}
                        className={`aspect-square overflow-hidden border-2 ${i === idx ? "border-primary" : "border-transparent"}`}
                      >
                        <img src={resolveImageUrl(im.url, settings.image_base_url)} alt="" loading="lazy" className="w-full h-full object-cover"/>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <a
              href={waUrl}
              target="_blank" rel="noopener"
              className="block text-center bg-jade text-white font-bold uppercase tracking-widest py-4 hover:opacity-90 transition"
            >
              <MessageCircle className="inline mr-2" size={18}/> Order via WhatsApp
            </a>
          </div>
        </div>
      </div>
    </>
  );
};
