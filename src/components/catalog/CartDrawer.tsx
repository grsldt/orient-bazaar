import { useEffect, useState } from "react";
import { Product, SiteSettings, buildWhatsappUrl, formatPrice, resolveImageUrl } from "@/lib/catalog";
import { supabase } from "@/integrations/supabase/client";
import { X, Trash2, MessageCircle, ShoppingBag } from "lucide-react";
import { useScrollLock } from "@/hooks/useScrollLock";
import { useLocalList } from "@/hooks/useLocalList";

interface Props {
  open: boolean;
  onClose: () => void;
  settings: SiteSettings;
  brandLookup: Record<string, string>;
}

export const CartDrawer = ({ open, onClose, settings, brandLookup }: Props) => {
  const cart = useLocalList("ls_cart");
  const [items, setItems] = useState<Product[]>([]);
  useScrollLock(open);

  useEffect(() => {
    if (!open || cart.items.length === 0) { setItems([]); return; }
    supabase
      .from("products")
      .select("*, images:product_images(id, product_id, url, sort_order)")
      .in("id", cart.items)
      .then(({ data }) => setItems((data ?? []) as any));
  }, [open, cart.items]);

  const total = items.reduce((s, p) => s + (p.price ?? 0), 0);

  const orderAll = () => {
    if (items.length === 0) return;
    const lines = ["Hi LÓNG SHÌ 龙市,", "", `I'd like to order ${items.length} item(s):`];
    items.forEach((p, i) => {
      lines.push(`${i + 1}. ${brandLookup[p.brand_id] ?? ""} — ${p.title}${p.price ? ` (${formatPrice(p.price, p.currency)})` : ""}`);
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
            <h2 className="font-black text-xl flex items-center gap-2"><ShoppingBag size={18}/> Selection</h2>
            <p className="text-xs text-muted-foreground">{items.length} item(s)</p>
          </div>
          <div className="flex gap-2 items-center">
            {items.length > 0 && <button onClick={cart.clear} className="text-xs uppercase tracking-widest text-destructive hover:underline">Clear</button>}
            <button onClick={onClose}><X size={20}/></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {items.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              <ShoppingBag size={32} className="mx-auto mb-3 opacity-40"/>
              No items yet. Tap the bag icon on any product to add it here.
            </div>
          ) : items.map((p) => {
            const main = (p.images ?? [])[0];
            return (
              <div key={p.id} className="flex gap-3 ink-border bg-background p-2">
                <div className="w-16 h-16 bg-muted shrink-0">
                  {main && <img src={resolveImageUrl(main.url, settings.image_base_url)} alt="" className="w-full h-full object-cover"/>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] uppercase text-muted-foreground tracking-widest truncate">{brandLookup[p.brand_id]}</div>
                  <div className="text-sm font-bold truncate">{p.title}</div>
                  {p.price && <div className="text-sm font-black">{formatPrice(p.price, p.currency)}</div>}
                </div>
                <button onClick={() => cart.remove(p.id)} className="text-destructive p-1 self-start"><Trash2 size={14}/></button>
              </div>
            );
          })}
        </div>

        {items.length > 0 && (
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
