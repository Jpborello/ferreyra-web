import postgres from 'postgres';
import { createClient } from '@supabase/supabase-js';

const dbUrl = process.env.DATABASE_URL;
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
// We need SERVICE_ROLE_KEY to manage storage policies if using supabase-js, 
// OR we use SQL via postgres connection to manipulate storage.policies.
// Since we likely only have DATABASE_URL (transaction pooler or direct), let's try SQL first.

if (!dbUrl) {
    console.error("❌ Error: DATABASE_URL is missing in .env");
    process.exit(1);
}

const sql = postgres(dbUrl);

async function fixPermissions() {
    try {
        console.log("🔓 Disabling RLS on 'products' table...");
        await sql`ALTER TABLE products DISABLE ROW LEVEL SECURITY`;
        console.log("✅ RLS disabled on 'products'.");

        console.log("📦 Checking 'products' storage bucket...");

        // 1. Create Bucket if not exists (via SQL for robustness)
        await sql`
            insert into storage.buckets (id, name, public)
            values ('products', 'products', true)
            on conflict (id) do nothing;
        `;

        // 2. Allow Public Uploads (Policy)
        // We drop existing policy to avoid conflicts and recreate a permissive one
        await sql`
            DROP POLICY IF EXISTS "Allow Public Uploads" ON storage.objects;
        `;

        await sql`
            CREATE POLICY "Allow Public Uploads"
            ON storage.objects FOR INSERT
            TO public
            WITH CHECK (bucket_id = 'products');
        `;

        // 3. Allow Public Updates/Selects on objects
        await sql`
            DROP POLICY IF EXISTS "Allow Public Access" ON storage.objects;
        `;
        await sql`
            CREATE POLICY "Allow Public Access"
            ON storage.objects FOR SELECT
            TO public
            USING (bucket_id = 'products');
        `;

        console.log("✅ Storage permissions patched for 'products' bucket.");
        console.log("🚀 You can now insert products and upload images!");

    } catch (error) {
        console.error("❌ Error fixing permissions:", error);
    } finally {
        await sql.end();
    }
}

fixPermissions();
