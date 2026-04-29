import { Product, SiteSettings, resolveImageUrl } from "@/lib/catalog";
import { useState } from "react";

interface Props {
  product: Product;
  settings: SiteSettings;
  brandName?: string;
  onClick: () => void;
}

export const ProductCard = ({ product, settings, brandName, onClick }: Props) => {
  const [imgIdx, setImgIdx] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const imgs = product.images ?? [];
  const main = imgs[imgIdx] ?? imgs[0];

  return (
    <button
      onClick={onClick}
      className="group relative bg-card text-left overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary"
      onMouseEnter={() => imgs.length > 1 && setImgIdx(1)}
      onMouseLeave={() => setImgIdx(0)}
    >
      <div className="aspect-square bg-muted relative overflow-hidden">
        {main && (
          <img
            src={resolveImageUrl(main.url, settings.image_base_url)}
            alt={product.title}
            loading="lazy"
            onLoad={() => setLoaded(true)}
            className={`w-full h-full object-cover transition-all duration-300 group-hover:scale-105 ${loaded ? "opacity-100" : "opacity-0"}`}
          />
        )}
        {!loaded && <div className="absolute inset-0 bg-muted animate-pulse" />}
        {imgs.length > 1 && (
          <div className="absolute top-1.5 right-1.5 bg-ink/80 text-background text-[10px] font-bold px-1.5 py-0.5">
            {imgs.length} 图
          </div>
        )}
        {product.whatsapp_only ? (
          <div className="absolute bottom-0 left-0 stamp">WhatsApp</div>
        ) : product.price ? (
          <div className="absolute bottom-0 left-0 stamp">{product.price}€</div>
        ) : null}
      </div>
    </button>
  );
};
