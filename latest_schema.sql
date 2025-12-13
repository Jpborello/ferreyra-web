-- 1. Tabla CUSTOMERS
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT NOT NULL,         -- Razón Social
    phone TEXT,                 -- WhatsApp
    address TEXT,               -- Dirección
    city TEXT,                  -- Localidad
    cuit TEXT,                  -- CUIT
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 2. Tabla ORDERS (Sin restaurant_id)
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    customer_id UUID REFERENCES public.customers(id),
    customer_name TEXT,
    customer_phone TEXT,
    delivery_address TEXT,
    status TEXT DEFAULT 'pending', -- pending, confirmed, sent, delivered
    total NUMERIC DEFAULT 0,
    items JSONB DEFAULT '[]'::jsonb, -- Array de objetos del carrito
    notes TEXT
);

-- 3. Habilitar Seguridad (RLS) - Permisos básicos
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Políticas permisivas (ajustar luego si se agrega login real)
CREATE POLICY "Enable all access for customers" ON public.customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);
