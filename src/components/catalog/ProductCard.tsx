import { Product, SiteSettings, thumbUrl, formatPrice } from "@/lib/catalog";
import { useState } from "react";
import { ShoppingBag, Check } from "lucide-react";
import { useLocalList } from "@/hooks/useLocalList";

interface Props {
  product: Product;
  settings: SiteSettings;
  brandName?: string;
  onClick: () => void;
}

export const ProductCard = ({ product, settings, brandName, onClick }: Props) => {
  const [imgIdx, setImgIdx] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const cart = useLocalList("ls_cart");
  const imgs = product.images ?? [];
  const main = imgs[imgIdx] ?? imgs[0];
  const inCart = cart.has(product.id);

  return (
    <div
      className="group relative bg-card text-left overflow-hidden focus-within:ring-2 focus-within:ring-primary"
      onMouseEnter={() => imgs.length > 1 && setImgIdx(1)}
      onMouseLeave={() => setImgIdx(0)}
    >
      <button
        onClick={onClick}
        className="block w-full text-left focus:outline-none"
        aria-label={product.title}
      >
        <div className="aspect-square bg-muted relative overflow-hidden">
          {main && (
            <img
              src={thumbUrl(main.url, settings.image_base_url, 480)}
              alt={product.title}
              loading="lazy"
              decoding="async"
              width={480}
              height={480}
              onLoad={() => setLoaded(true)}
              className={`w-full h-full object-cover transition-all duration-300 group-hover:scale-105 ${loaded ? "opacity-100" : "opacity-0"}`}
            />
          )}
          {!loaded && <div className="absolute inset-0 bg-muted animate-pulse"/>}
          {imgs.length > 1 && (
            <div className="absolute top-1.5 right-1.5 bg-ink/80 text-background text-[10px] font-bold px-1.5 py-0.5">
              {imgs.length} 图
            </div>
          )}
          {product.whatsapp_only ? (
            <div className="absolute bottom-0 left-0 stamp">WhatsApp</div>
          ) : product.price ? (
            <div className="absolute bottom-0 left-0 stamp">{formatPrice(product.price, product.currency)}</div>
          ) : null}
        </div>
        <div className="px-2 py-1.5">
          <div className="text-xs font-semibold truncate">{product.title}</div>
          {brandName && <div className="text-[10px] text-muted-foreground uppercase tracking-wider truncate">{brandName}</div>}
        </div>
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (inCart) cart.remove(product.id);
          else cart.add(product.id);
        }}
        className={`absolute bottom-1 right-1 px-2.5 h-9 ink-border flex items-center justify-center gap-1.5 text-[11px] font-bold uppercase tracking-widest transition shadow-md ${
          inCart
            ? "bg-jade text-white"
            : "bg-card text-foreground hover:bg-primary hover:text-primary-foreground"
        }`}
        aria-label={inCart ? "Remove from cart" : "Add to cart"}
      >
        {inCart ? <><Check size={13}/> Added</> : <><ShoppingBag size={13}/> Add</>}
      </button>
    </div>
  );
};
