-- Ejecutar esto en el SQL Editor de Supabase (Dashboard > SQL Editor > New query)
-- Endurece los permisos que quedaron abiertos: reactiva RLS en 'products',
-- cierra la subida pública del bucket de storage, y restringe UPDATE/DELETE
-- en 'orders' y 'customers' a usuarios autenticados (panel admin).
-- La lectura pública de productos y la creación de pedidos/clientes desde
-- la tienda (sin login) se mantienen intactas para no romper el checkout.

-- 1. Productos: reactivar RLS + políticas correctas
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all access for products" ON public.products;
DROP POLICY IF EXISTS "products_public_select" ON public.products;
DROP POLICY IF EXISTS "products_admin_write" ON public.products;

CREATE POLICY "products_public_select" ON public.products
    FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "products_admin_write" ON public.products
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 2. Storage bucket 'products': lectura pública, subida solo admin
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Allow Public Uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow Public Access" ON storage.objects;
DROP POLICY IF EXISTS "products_storage_public_read" ON storage.objects;
DROP POLICY IF EXISTS "products_storage_admin_write" ON storage.objects;
DROP POLICY IF EXISTS "products_storage_admin_update" ON storage.objects;

CREATE POLICY "products_storage_public_read"
    ON storage.objects FOR SELECT TO anon, authenticated
    USING (bucket_id = 'products');

CREATE POLICY "products_storage_admin_write"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'products');

CREATE POLICY "products_storage_admin_update"
    ON storage.objects FOR UPDATE TO authenticated
    USING (bucket_id = 'products');

-- 3. Orders: solo admin autenticado puede modificar o borrar pedidos
DROP POLICY IF EXISTS "orders_admin_update" ON public.orders;
DROP POLICY IF EXISTS "orders_admin_delete" ON public.orders;

CREATE POLICY "orders_admin_update" ON public.orders
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "orders_admin_delete" ON public.orders
    FOR DELETE TO authenticated USING (true);

-- 4. Customers: solo admin autenticado puede borrar clientes
DROP POLICY IF EXISTS "customers_admin_delete" ON public.customers;

CREATE POLICY "customers_admin_delete" ON public.customers
    FOR DELETE TO authenticated USING (true);

-- PENDIENTE (no incluido acá porque requiere cambiar el código del checkout):
-- 'orders' y 'customers' siguen permitiendo SELECT/INSERT público, porque
-- el checkout de la web (sin login de cliente) los necesita para funcionar.
-- Eso significa que, en teoría, alguien con la anon key podría listar todos
-- los pedidos/clientes vía la API de Supabase. La forma correcta de cerrar
-- esto del todo es mover la creación de pedidos a una Supabase Edge Function
-- (con service_role key, nunca expuesta al navegador) y sacarle al cliente
-- el permiso de SELECT directo sobre estas tablas.
