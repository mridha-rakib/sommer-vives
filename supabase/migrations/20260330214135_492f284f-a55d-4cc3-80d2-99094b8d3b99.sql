
-- Orders table: unified order entity for both guests and owners
CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_type text NOT NULL DEFAULT 'guest' CHECK (user_type IN ('guest', 'owner')),
  user_id uuid NULL,
  guest_id uuid NULL REFERENCES public.guests(id),
  booking_id uuid NULL REFERENCES public.bookings(id),
  property_id uuid NULL REFERENCES public.properties(id),
  subtotal integer NOT NULL DEFAULT 0,
  tax integer NOT NULL DEFAULT 0,
  total integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'DKK',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'refunded')),
  payment_status text NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'pending', 'paid', 'partially_paid', 'refunded', 'failed')),
  stripe_session_id text NULL,
  stripe_payment_intent_id text NULL,
  notes text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Order line items
CREATE TABLE public.order_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  item_type text NOT NULL DEFAULT 'addon' CHECK (item_type IN ('addon', 'service_package', 'fee', 'custom')),
  reference_id uuid NULL,
  label text NOT NULL,
  description text NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_price integer NOT NULL DEFAULT 0,
  total integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Invoices / receipts
CREATE TABLE public.invoices (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES public.orders(id),
  invoice_number text NOT NULL,
  issued_at timestamptz NOT NULL DEFAULT now(),
  due_at timestamptz NULL,
  paid_at timestamptz NULL,
  subtotal integer NOT NULL DEFAULT 0,
  tax integer NOT NULL DEFAULT 0,
  total integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'DKK',
  status text NOT NULL DEFAULT 'issued' CHECK (status IN ('draft', 'issued', 'paid', 'overdue', 'cancelled', 'refunded')),
  pdf_url text NULL,
  recipient_name text NULL,
  recipient_email text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Orders RLS
CREATE POLICY "Admins manage all orders" ON public.orders FOR ALL USING (has_role(auth.uid(), 'admin'::user_role));
CREATE POLICY "Owners view own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id AND user_type = 'owner');
CREATE POLICY "Owners create own orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Anyone can create guest orders" ON public.orders FOR INSERT WITH CHECK (user_type = 'guest');
CREATE POLICY "Guest view own orders by booking" ON public.orders FOR SELECT USING (
  booking_id IN (SELECT b.id FROM bookings b WHERE b.guest_email = (SELECT p.email FROM profiles p WHERE p.id = auth.uid() LIMIT 1))
);

-- Order items RLS
CREATE POLICY "Admins manage all order_items" ON public.order_items FOR ALL USING (has_role(auth.uid(), 'admin'::user_role));
CREATE POLICY "Users view own order items" ON public.order_items FOR SELECT USING (
  order_id IN (SELECT o.id FROM orders o WHERE o.user_id = auth.uid())
);
CREATE POLICY "Anyone can insert order items" ON public.order_items FOR INSERT WITH CHECK (true);

-- Invoices RLS
CREATE POLICY "Admins manage all invoices" ON public.invoices FOR ALL USING (has_role(auth.uid(), 'admin'::user_role));
CREATE POLICY "Users view own invoices" ON public.invoices FOR SELECT USING (
  order_id IN (SELECT o.id FROM orders o WHERE o.user_id = auth.uid())
);

-- Invoice number sequence
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1001;

CREATE OR REPLACE FUNCTION public.set_invoice_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number := 'SV-' || to_char(now(), 'YYYY') || '-' || LPAD(nextval('invoice_number_seq')::text, 5, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_invoice_number_trigger
BEFORE INSERT ON public.invoices
FOR EACH ROW EXECUTE FUNCTION public.set_invoice_number();

-- Updated_at triggers
CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
