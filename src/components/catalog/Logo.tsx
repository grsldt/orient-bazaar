export const Logo = ({ size = "md" }: { size?: "sm" | "md" | "lg" }) => {
  const big = size === "lg" ? "text-3xl" : size === "sm" ? "text-lg" : "text-2xl";
  const sub = size === "lg" ? "text-[10px]" : "text-[9px]";
  return (
    <div className="flex items-center gap-2 select-none">
      <div className="bg-primary text-primary-foreground han px-2 py-1 leading-none ink-border">
        <span className={big}>龙</span>
      </div>
      <div className="leading-tight">
        <div className="font-black tracking-tight text-foreground">LÓNG SHÌ</div>
        <div className={`${sub} uppercase tracking-[0.25em] text-muted-foreground`}>Dragon Market · 龙市</div>
      </div>
    </div>
  );
};
