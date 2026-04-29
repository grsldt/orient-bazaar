import { useEffect, useMemo, useState } from "react";
import { Product, SiteSettings, buildWhatsappUrl, formatPrice, resolveImageUrl } from "@/lib/catalog";
import { supabase } from "@/integrations/supabase/client";
import { X, Trash2, MessageCircle, ShoppingBag, Minus, Plus } from "lucide-react";
import { useScrollLock } from "@/hooks/useScrollLock";
import { useCart } from "@/hooks/useCart";

interface Props {
  open: boolean;
  onClose: () => void;
  settings: SiteSettings;
  brandLookup: Record<string, string>;
}

export const CartDrawer = ({ open, onClose, settings, brandLookup }: Props) => {
  const cart = useCart();
  const [products, setProducts] = useState<Record<string, Product>>({});
  useScrollLock(open);

  const ids = useMemo(() => Array.from(new Set(cart.items.map((i) => i.id))), [cart.items]);

  useEffect(() => {
    if (!open || ids.length === 0) { setProducts({}); return; }
    supabase
      .from("products")
      .select("*, images:product_images(id, product_id, url, sort_order)")
      .in("id", ids)
      .then(({ data }) => {
        const map: Record<string, Product> = {};
        (data ?? []).forEach((p: any) => { map[p.id] = p; });
        setProducts(map);
      });
  }, [open, ids.join(",")]);

  const total = cart.items.reduce((s, line) => {
    const p = products[line.id];
    return s + ((p?.price ?? 0) * line.qty);
  }, 0);

  const orderAll = () => {
    if (cart.items.length === 0) return;
    const lines = ["Hi LÓNG SHÌ 龙市,", "", `I'd like to order ${cart.totalQty} item(s):`];
    cart.items.forEach((line, i) => {
      const p = products[line.id];
      const brand = p ? brandLookup[p.brand_id] ?? "" : "";
      const title = p?.title ?? line.id;
      const variantBits: string[] = [];
      if (line.color) variantBits.push(`Color: ${line.color}`);
      if (line.size) variantBits.push(`Size: ${line.size}`);
      variantBits.push(`Qty: ${line.qty}`);
      const priceStr = p?.price ? ` — ${formatPrice(p.price, p.currency)}` : "";
      lines.push(`${i + 1}. ${brand ? brand + " — " : ""}${title}${priceStr}`);
      lines.push(`   ${variantBits.join(" · ")}`);
    });
    if (total > 0) lines.push("", `Estimated total: ${formatPrice(total, "USD")}`);
    lines.push("", "Thanks!");
    window.open(buildWhatsappUrl(settings.whatsapp_number, lines.join("\n")), "_blank", "noopener");
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-ink/80 backdrop-blur-sm"/>
      <aside className="relative w-full max-w-md bg-card text-foreground h-full flex flex-col shadow-2xl ink-border" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h2 className="font-black text-xl flex items-center gap-2"><ShoppingBag size={18}/> Cart</h2>
            <p className="text-xs text-muted-foreground">{cart.totalQty} item(s)</p>
          </div>
          <div className="flex gap-2 items-center">
            {cart.items.length > 0 && <button onClick={cart.clear} className="text-xs uppercase tracking-widest text-destructive hover:underline">Clear</button>}
            <button onClick={onClose}><X size={20}/></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {cart.items.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              <ShoppingBag size={32} className="mx-auto mb-3 opacity-40"/>
              No items yet. Open a product, choose a size, then add it here.
            </div>
          ) : cart.items.map((line, idx) => {
            const p = products[line.id];
            const main = p?.images?.[0];
            return (
              <div key={`${line.id}-${line.size ?? ""}-${line.color ?? ""}-${idx}`} className="flex gap-3 ink-border bg-background p-2">
                <div className="w-16 h-16 bg-muted shrink-0">
                  {main && <img src={resolveImageUrl(main.url, settings.image_base_url)} alt="" className="w-full h-full object-cover"/>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] uppercase text-muted-foreground tracking-widest truncate">{p ? brandLookup[p.brand_id] : ""}</div>
                  <div className="text-sm font-bold truncate">{p?.title ?? "…"}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {line.color && <>Color: <span className="text-foreground font-semibold">{line.color}</span> · </>}
                    {line.size && <>Size: <span className="text-foreground font-semibold">{line.size}</span></>}
                    {!line.size && !line.color && <span className="italic">No variant</span>}
                  </div>
                  <div className="flex items-center justify-between mt-1.5">
                    <div className="flex items-center ink-border">
                      <button onClick={() => cart.setQty(idx, line.qty - 1)} className="w-7 h-7 flex items-center justify-center hover:bg-muted" aria-label="Decrease"><Minus size={12}/></button>
                      <span className="w-7 text-center text-xs font-bold">{line.qty}</span>
                      <button onClick={() => cart.setQty(idx, line.qty + 1)} className="w-7 h-7 flex items-center justify-center hover:bg-muted" aria-label="Increase"><Plus size={12}/></button>
                    </div>
                    {p?.price && <div className="text-sm font-black">{formatPrice(p.price * line.qty, p.currency)}</div>}
                  </div>
                </div>
                <button onClick={() => cart.removeAt(idx)} className="text-destructive p-1 self-start" aria-label="Remove"><Trash2 size={14}/></button>
              </div>
            );
          })}
        </div>

        {cart.items.length > 0 && (
          <div className="border-t border-border p-3 space-y-2">
            {total > 0 && (
              <div className="flex justify-between text-sm">
                <span className="uppercase tracking-widest text-muted-foreground">Estimated total</span>
                <span className="font-black">{formatPrice(total, "USD")}</span>
              </div>
            )}
            <button onClick={orderAll} className="w-full bg-jade text-white font-bold uppercase tracking-widest py-3.5 flex items-center justify-center gap-2 hover:opacity-90">
              <MessageCircle size={18}/> Order all via WhatsApp
            </button>
          </div>
        )}
      </aside>
    </div>
  );
};
