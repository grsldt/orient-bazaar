
-- Colors table (only colors actually available for that product)
CREATE TABLE IF NOT EXISTS public.product_colors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name text NOT NULL,
  hex text,
  sort_order integer NOT NULL DEFAULT 0
);

ALTER TABLE public.product_colors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Colors are public"
ON public.product_colors FOR SELECT
USING (true);

CREATE POLICY "Admins manage colors"
ON public.product_colors FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_product_colors_product ON public.product_colors(product_id);

-- Switch default currency to USD
ALTER TABLE public.products ALTER COLUMN currency SET DEFAULT 'USD';
UPDATE public.products SET currency = 'USD' WHERE currency = 'EUR';
