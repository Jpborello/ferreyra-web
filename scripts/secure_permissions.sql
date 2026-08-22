-- Ejecutar esto en el SQL Editor de Supabase (Dashboard > SQL Editor > New query)
-- Endurece los permisos que quedaron abiertos: reactiva RLS en 'products',
-- cierra la subida pública del bucket de storage, y restringe UPDATE/DELETE
-- en 'orders' y 'customers' a usuarios autenticados (panel admin).
-- La lectura pública de productos y la creación/edición de pedidos y
-- clientes desde la tienda (checkout sin login) se mantienen intactas.
--
-- CORRECCION vs. la version anterior de este archivo: esa version dejaba
-- sin tocar las políticas originales "Enable all access for orders" y
-- "Enable all access for customers" (creadas en latest_schema.sql, con
-- USING (true) para TODO: SELECT/INSERT/UPDATE/DELETE). En Postgres las
-- políticas RLS son PERMISIVAS por defecto y se combinan con OR, así que
-- esa política vieja seguía permitiendo a cualquiera (anon) actualizar o
-- borrar pedidos/clientes sin importar qué política nueva se agregara al
-- lado. Si ya habías corrido la versión vieja de este script, no hizo
-- nada: hay que correr esta versión para que el cierre sea real.

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

-- 3. Orders: reemplazar la política "permitir todo" por políticas separadas.
--    anon puede seguir creando pedidos y leyendo (el checkout lo necesita
--    para el .select().single() despues del insert), pero YA NO puede
--    actualizar ni borrar pedidos ajenos.
DROP POLICY IF EXISTS "Enable all access for orders" ON public.orders;
DROP POLICY IF EXISTS "orders_admin_update" ON public.orders;
DROP POLICY IF EXISTS "orders_admin_delete" ON public.orders;
DROP POLICY IF EXISTS "orders_public_insert" ON public.orders;
DROP POLICY IF EXISTS "orders_public_select" ON public.orders;

CREATE POLICY "orders_public_insert" ON public.orders
    FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "orders_public_select" ON public.orders
    FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "orders_admin_update" ON public.orders
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "orders_admin_delete" ON public.orders
    FOR DELETE TO authenticated USING (true);

-- 4. Customers: mismo criterio. El checkout busca por telefono (SELECT),
--    crea (INSERT) y actualiza datos del cliente existente (UPDATE) sin
--    login, asi que esos tres se mantienen abiertos a anon. Pero ya NO
--    se puede borrar un cliente sin estar autenticado.
DROP POLICY IF EXISTS "Enable all access for customers" ON public.customers;
DROP POLICY IF EXISTS "customers_admin_delete" ON public.customers;
DROP POLICY IF EXISTS "customers_public_select" ON public.customers;
DROP POLICY IF EXISTS "customers_public_insert" ON public.customers;
DROP POLICY IF EXISTS "customers_public_update" ON public.customers;

CREATE POLICY "customers_public_select" ON public.customers
    FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "customers_public_insert" ON public.customers
    FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "customers_public_update" ON public.customers
    FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "customers_admin_delete" ON public.customers
    FOR DELETE TO authenticated USING (true);

-- PENDIENTE (no incluido acá porque requiere cambiar el código del checkout):
-- 'orders' y 'customers' siguen permitiendo SELECT/INSERT/UPDATE público,
-- porque el checkout de la web (sin login de cliente) los necesita para
-- funcionar. Eso significa que, en teoría, alguien con la anon key podría
-- listar todos los pedidos/clientes vía la API de Supabase. Lo que SÍ
-- queda cerrado con este script es que nadie sin login pueda modificar el
-- estado de un pedido ajeno o borrar pedidos/clientes. La forma correcta
-- de cerrar también la lectura es mover la creación de pedidos a una
-- Supabase Edge Function (con service_role key, nunca expuesta al
-- navegador) y sacarle al cliente el permiso de SELECT directo.
