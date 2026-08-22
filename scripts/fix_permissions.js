import postgres from 'postgres';
import 'dotenv/config';

// NOTA HISTORICA: esta versión reemplaza a la anterior, que DESHABILITABA
// RLS (Row Level Security) en 'products' y dejaba el bucket de storage con
// subida pública para cualquiera. Esta versión hace lo contrario: deja todo
// cerrado por defecto y solo abre lo mínimo necesario para que la tienda
// pública siga funcionando (lectura de catálogo) y para que el panel admin
// (usuarios autenticados vía Supabase Auth) pueda gestionar todo.

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
    console.error("❌ Error: falta DATABASE_URL en tu .env.local");
    process.exit(1);
}

const sql = postgres(dbUrl);

async function securePermissions() {
    try {
        console.log("🔒 Re-habilitando RLS en 'products'...");
        await sql`ALTER TABLE products ENABLE ROW LEVEL SECURITY`;

        console.log("📜 Aplicando políticas de 'products' (lectura pública, escritura solo admin)...");
        await sql`DROP POLICY IF EXISTS "Enable all access for products" ON public.products`;
        await sql`DROP POLICY IF EXISTS "products_public_select" ON public.products`;
        await sql`DROP POLICY IF EXISTS "products_admin_write" ON public.products`;
        await sql`
            CREATE POLICY "products_public_select" ON public.products
            FOR SELECT TO anon, authenticated USING (true)
        `;
        await sql`
            CREATE POLICY "products_admin_write" ON public.products
            FOR ALL TO authenticated USING (true) WITH CHECK (true)
        `;

        console.log("📦 Ajustando bucket de storage 'products' (lectura pública, subida solo admin)...");
        await sql`
            insert into storage.buckets (id, name, public)
            values ('products', 'products', true)
            on conflict (id) do nothing;
        `;
        await sql`DROP POLICY IF EXISTS "Allow Public Uploads" ON storage.objects`;
        await sql`DROP POLICY IF EXISTS "Allow Public Access" ON storage.objects`;
        await sql`DROP POLICY IF EXISTS "products_storage_public_read" ON storage.objects`;
        await sql`DROP POLICY IF EXISTS "products_storage_admin_write" ON storage.objects`;
        await sql`
            CREATE POLICY "products_storage_public_read"
            ON storage.objects FOR SELECT
            TO anon, authenticated
            USING (bucket_id = 'products')
        `;
        await sql`
            CREATE POLICY "products_storage_admin_write"
            ON storage.objects FOR INSERT
            TO authenticated
            WITH CHECK (bucket_id = 'products')
        `;
        await sql`
            CREATE POLICY "products_storage_admin_update"
            ON storage.objects FOR UPDATE
            TO authenticated
            USING (bucket_id = 'products')
        `;

        console.log("🔒 Restringiendo escritura en 'orders' y 'customers' a usuarios autenticados...");
        // Las lecturas/inserciones públicas se mantienen porque el checkout
        // del sitio (sin login de cliente) las necesita. Pero solo el panel
        // admin autenticado puede modificar o borrar. Ver recomendación de
        // Claude sobre mover esta lógica a una Edge Function si en algún
        // momento se quiere cerrar también la lectura pública.
        await sql`DROP POLICY IF EXISTS "orders_admin_update" ON public.orders`;
        await sql`DROP POLICY IF EXISTS "orders_admin_delete" ON public.orders`;
        await sql`
            CREATE POLICY "orders_admin_update" ON public.orders
            FOR UPDATE TO authenticated USING (true) WITH CHECK (true)
        `;
        await sql`
            CREATE POLICY "orders_admin_delete" ON public.orders
            FOR DELETE TO authenticated USING (true)
        `;

        await sql`DROP POLICY IF EXISTS "customers_admin_delete" ON public.customers`;
        await sql`
            CREATE POLICY "customers_admin_delete" ON public.customers
            FOR DELETE TO authenticated USING (true)
        `;

        console.log("✅ Permisos endurecidos correctamente.");

    } catch (error) {
        console.error("❌ Error aplicando permisos:", error);
        process.exitCode = 1;
    } finally {
        await sql.end();
    }
}

securePermissions();
