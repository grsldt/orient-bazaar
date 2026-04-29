import { Brand, SiteSettings, buildWhatsappUrl } from "@/lib/catalog";
import { MessageCircle, Ship, ShieldCheck, Factory, Truck, Star, Globe2 } from "lucide-react";

interface Props {
  brands: Brand[];
  settings: SiteSettings;
  onSelectBrand: (id: string) => void;
}

export const HomePresentation = ({ brands, settings, onSelectBrand }: Props) => {
  const wa = buildWhatsappUrl(settings.whatsapp_number, "Hi LÓNG SHÌ — I'd like to ask about your catalog.");
  const featured = brands.slice(0, 12);

  return (
    <div className="bg-background">
      {/* Hero */}
      <section className="relative bg-ink text-background overflow-hidden border-b-4 border-primary">
        <div className="absolute inset-0 flex items-center justify-end pointer-events-none opacity-[0.07] select-none">
          <span className="han text-[clamp(220px,40vw,520px)] leading-none text-primary -mr-10">龙市</span>
        </div>
        <div className="relative px-6 md:px-12 py-14 md:py-24 max-w-5xl">
          <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-accent mb-4 border border-accent/40 px-2.5 py-1">
            <span className="han text-sm">自</span> Established 2007 · Guangzhou 广州
          </div>
          <h1 className="text-4xl md:text-6xl font-black leading-[1.05] mb-5">
            Direct from the<br/>factory floor.
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-xl mb-8">
            For nearly two decades, <span className="text-background font-bold">LÓNG SHÌ 龙市</span> has supplied resellers across Europe, North America and the Middle East with premium 1:1 replicas straight from our network of manufacturing partners in Guangdong and Fujian.
          </p>
          <div className="flex flex-wrap gap-3">
            <a href={wa} target="_blank" rel="noopener"
               className="inline-flex items-center gap-2 bg-jade text-white font-bold uppercase tracking-widest text-sm px-6 py-3 hover:opacity-90 transition">
              <MessageCircle size={16}/> Chat on WhatsApp
            </a>
            <button onClick={() => onSelectBrand(brands[0]?.id)} disabled={!brands[0]}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-bold uppercase tracking-widest text-sm px-6 py-3 hover:opacity-90 transition disabled:opacity-50">
              Browse the catalog →
            </button>
          </div>
        </div>
      </section>

      {/* Stat strip */}
      <section className="bg-card border-b border-ink/15">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-ink/15">
          {[
            { k: "18+", v: "Years sourcing" },
            { k: "45+", v: "Brand lines" },
            { k: "32", v: "Countries shipped" },
            { k: "99.4%", v: "On-time delivery" },
          ].map((s) => (
            <div key={s.v} className="px-4 py-6 text-center">
              <div className="text-3xl md:text-4xl font-black text-primary">{s.k}</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">{s.v}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Story */}
      <section className="px-6 md:px-12 py-14 max-w-5xl mx-auto grid md:grid-cols-2 gap-10">
        <div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-primary mb-2"><span className="han mr-1">故事</span>Our story</div>
          <h2 className="text-2xl md:text-3xl font-black mb-4 leading-tight">A family workshop turned global trading house.</h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-3">
            Founded in 2007 by the Lóng family in the Baiyun district of Guangzhou, what started as a small workshop selling to street markets in Hong Kong now operates four warehouses across Guangdong, with quality-control teams in Putian and Yiwu.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Every parcel is inspected three times — at the factory, at our own QC bay and just before shipment — so what lands at your door is exactly what you saw on the photo. No surprise. No re-pack.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { i: Factory, t: "Direct factory", s: "No middleman, no markup" },
            { i: ShieldCheck, t: "Triple QC", s: "Inspected before shipping" },
            { i: Ship, t: "Worldwide shipping", s: "DHL · UPS · EMS" },
            { i: Globe2, t: "EN · FR · 中文", s: "Fluent multilingual support" },
          ].map(({ i: Icon, t, s }) => (
            <div key={t} className="ink-border bg-card p-4">
              <Icon size={22} className="text-primary mb-2"/>
              <div className="font-bold text-sm">{t}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{s}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Brands grid */}
      {featured.length > 0 && (
        <section className="px-6 md:px-12 py-12 bg-muted/40 border-y border-ink/10">
          <div className="flex items-end justify-between mb-6">
            <div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-primary mb-1"><span className="han mr-1">品牌</span>Featured houses</div>
              <h2 className="text-2xl md:text-3xl font-black">Brands we supply</h2>
            </div>
            <span className="text-xs text-muted-foreground">{brands.length} total</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {featured.map((b) => (
              <button key={b.id} onClick={() => onSelectBrand(b.id)}
                className="group bg-card ink-border aspect-[4/3] flex items-center justify-center text-center px-2 hover:bg-primary hover:text-primary-foreground transition">
                <span className="font-bold text-sm tracking-tight group-hover:scale-105 transition">{b.name}</span>
              </button>
            ))}
          </div>
          {brands.length > featured.length && (
            <div className="text-center mt-4 text-xs uppercase tracking-widest text-muted-foreground">
              + {brands.length - featured.length} more in the sidebar
            </div>
          )}
        </section>
      )}

      {/* How to order */}
      <section className="px-6 md:px-12 py-14 max-w-5xl mx-auto">
        <div className="text-[10px] uppercase tracking-[0.3em] text-primary mb-1 text-center"><span className="han mr-1">下单</span>How it works</div>
        <h2 className="text-2xl md:text-3xl font-black text-center mb-10">Order in three steps</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { n: "01", t: "Pick from the catalog", s: "Browse by brand in the sidebar. Open any product to see all photos and pick your size and color." },
            { n: "02", t: "Send via WhatsApp", s: "One click on \"Order via WhatsApp\" sends us your selection. We reply with shipping cost and payment options." },
            { n: "03", t: "Track to your door", s: "Once paid, we ship within 48h with tracking. Average delivery 7–14 days door-to-door." },
          ].map((s) => (
            <div key={s.n} className="ink-border bg-card p-5 relative">
              <div className="absolute -top-3 left-4 bg-primary text-primary-foreground text-xs font-black px-2 py-1 tracking-widest">{s.n}</div>
              <div className="font-bold mt-2 mb-1.5">{s.t}</div>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.s}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-ink text-background px-6 md:px-12 py-14">
        <div className="max-w-5xl mx-auto">
          <div className="text-[10px] uppercase tracking-[0.3em] text-accent mb-1 text-center"><span className="han mr-1">评价</span>Reseller reviews</div>
          <h2 className="text-2xl md:text-3xl font-black text-center mb-10">Trusted by 2,400+ resellers</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { n: "Marco R.", c: "🇮🇹 Milan", q: "Quality is genuinely 1:1. My customers can't tell the difference. Been ordering for 3 years now — never a missed parcel." },
              { n: "Yasmine K.", c: "🇫🇷 Paris", q: "Their WhatsApp team replies in French within minutes. Honest pricing, real photos, fast shipping. The reference for me." },
              { n: "James O.", c: "🇬🇧 London", q: "I tested five suppliers before LÓNG SHÌ. Stayed because of the QC — every piece arrives exactly as shown." },
            ].map((t) => (
              <div key={t.n} className="bg-card text-foreground p-5 ink-border">
                <div className="flex gap-0.5 mb-2 text-accent">{Array.from({length:5}).map((_,i)=><Star key={i} size={14} fill="currentColor"/>)}</div>
                <p className="text-sm leading-relaxed mb-3">"{t.q}"</p>
                <div className="text-xs font-bold">{t.n}</div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{t.c}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 md:px-12 py-16 text-center">
        <Truck size={32} className="text-primary mx-auto mb-3"/>
        <h2 className="text-2xl md:text-3xl font-black mb-2">Ready to order?</h2>
        <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">Pick a brand on the left, or message us directly — we ship anywhere in the world.</p>
        <a href={wa} target="_blank" rel="noopener"
           className="inline-flex items-center gap-2 bg-jade text-white font-bold uppercase tracking-widest text-sm px-6 py-3 hover:opacity-90 transition">
          <MessageCircle size={16}/> Open WhatsApp
        </a>
      </section>

      <footer className="bg-ink text-background text-xs uppercase tracking-widest p-4 flex flex-wrap justify-between items-center gap-2">
        <span>© LÓNG SHÌ 龙市 · Dragon Market · Est. 2007</span>
        <span className="text-muted-foreground">Guangzhou · Putian · Yiwu</span>
      </footer>
    </div>
  );
};