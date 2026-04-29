import { Brand, SiteSettings, buildWhatsappUrl } from "@/lib/catalog";
import { Logo } from "./Logo";
import { Link } from "react-router-dom";
import { useState } from "react";
import { Search, MessageCircle, Truck, Lock } from "lucide-react";

interface Props {
  brands: Brand[];
  selectedBrandId: string | null;
  onSelectBrand: (id: string | null) => void;
  settings: SiteSettings;
}

export const Sidebar = ({ brands, selectedBrandId, onSelectBrand, settings }: Props) => {
  const [q, setQ] = useState("");
  const filtered = brands.filter((b) => b.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <aside className="w-72 shrink-0 bg-ink text-sidebar-foreground flex flex-col h-screen sticky top-0 border-r border-sidebar-border">
      <div className="p-5 border-b border-sidebar-border">
        <Logo size="md" />
      </div>

      <div className="p-3 grid grid-cols-2 gap-2 border-b border-sidebar-border">
        <a
          href={buildWhatsappUrl(settings.whatsapp_number, "Hi LÓNG SHÌ — I'd like to order.")}
          target="_blank" rel="noopener"
          className="flex items-center justify-center gap-1.5 bg-jade text-white text-xs font-bold uppercase tracking-wider py-2 hover:opacity-90 transition"
        >
          <MessageCircle size={14}/> WhatsApp
        </a>
        <a
          href={settings.tracking_url} target="_blank" rel="noopener"
          className="flex items-center justify-center gap-1.5 bg-sidebar-accent text-sidebar-foreground text-xs font-bold uppercase tracking-wider py-2 hover:bg-primary hover:text-primary-foreground transition"
        >
          <Truck size={14}/> Tracking
        </a>
      </div>

      <div className="p-3 border-b border-sidebar-border">
        <div className="relative">
          <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground"/>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search brand..."
            className="w-full bg-sidebar-accent text-sidebar-foreground text-sm pl-8 pr-2 py-2 border border-sidebar-border focus:outline-none focus:border-primary placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto">
        <button
          onClick={() => onSelectBrand(null)}
          className={`w-full text-left px-4 py-2.5 text-sm font-medium border-b border-sidebar-border transition ${
            selectedBrandId === null ? "bg-primary text-primary-foreground" : "hover:bg-sidebar-accent"
          }`}
        >
          <span className="han mr-2 text-base">全</span> All Brands
          <span className="float-right text-xs opacity-60">{brands.length}</span>
        </button>
        {filtered.map((b) => (
          <button
            key={b.id}
            onClick={() => onSelectBrand(b.id)}
            className={`w-full text-left px-4 py-2 text-sm border-b border-sidebar-border/40 transition ${
              selectedBrandId === b.id ? "bg-primary text-primary-foreground" : "hover:bg-sidebar-accent"
            }`}
          >
            {b.name}
          </button>
        ))}
      </nav>

      <div className="p-3 border-t border-sidebar-border text-[10px] uppercase tracking-widest text-muted-foreground flex justify-between items-center">
        <span>© LÓNG SHÌ 龙市</span>
        <Link to="/admin" className="hover:text-primary transition flex items-center gap-1"><Lock size={10}/>Admin</Link>
      </div>
    </aside>
  );
};
