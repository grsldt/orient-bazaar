import { supabase } from "@/integrations/supabase/client";

export type Brand = { id: string; name: string; slug: string; sort_order: number };
export type Category = { id: string; brand_id: string; name: string; slug: string; sort_order: number };
export type ProductImage = { id: string; product_id: string; url: string; sort_order: number };
export type Product = {
  id: string;
  brand_id: string;
  category_id: string;
  title: string;
  description: string | null;
  price: number | null;
  price_label: string | null;
  currency: string;
  whatsapp_only: boolean;
  sort_order: number;
  images?: ProductImage[];
  sizes?: { id: string; size: string }[];
};

export type SiteSettings = {
  whatsapp_number: string;
  tracking_url: string;
  image_base_url: string;
};

export async function fetchSettings(): Promise<SiteSettings> {
  const { data } = await supabase.from("site_settings").select("*").eq("id", 1).maybeSingle();
  return data ?? { whatsapp_number: "+12532237370", tracking_url: "https://neocartrige.com", image_base_url: "" };
}

export async function fetchBrands(): Promise<Brand[]> {
  const { data, error } = await supabase.from("brands").select("*").order("sort_order").order("name");
  if (error) throw error;
  return data ?? [];
}

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase.from("categories").select("*").order("sort_order").order("name");
  if (error) throw error;
  return data ?? [];
}

export async function fetchProducts(filters: { brandId?: string | null; categoryId?: string | null; search?: string }): Promise<Product[]> {
  let q = supabase.from("products").select("*, images:product_images(id, product_id, url, sort_order), sizes:product_sizes(id, size)").order("sort_order").limit(1000);
  if (filters.brandId) q = q.eq("brand_id", filters.brandId);
  if (filters.categoryId) q = q.eq("category_id", filters.categoryId);
  if (filters.search) q = q.ilike("title", `%${filters.search}%`);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map((p: any) => ({
    ...p,
    images: (p.images ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order),
  }));
}

export function resolveImageUrl(url: string, base: string): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) return url;
  // Storage bucket path? (uploaded via admin)
  if (url.startsWith("storage://")) {
    const path = url.replace("storage://", "");
    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    return data.publicUrl;
  }
  // Relative path → use image_base_url (or local /catalog/)
  const b = (base || "/catalog/").replace(/\/+$/, "/");
  return b + url.split("/").map(encodeURIComponent).join("/");
}

export function buildWhatsappUrl(phone: string, message: string): string {
  const num = phone.replace(/[^\d]/g, "");
  return `https://wa.me/${num}?text=${encodeURIComponent(message)}`;
}
