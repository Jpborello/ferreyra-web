import postgres from 'postgres';
import dotenv from 'dotenv';
// dotenv por default solo carga '.env'. Este proyecto usa '.env.local'
// (la convención de Next.js), así que hay que apuntarlo explícitamente
// o process.env.DATABASE_URL queda undefined y estos scripts fallan
// con "No DATABASE_URL found" aunque el archivo exista y esté bien.
dotenv.config({ path: '.env.local' });

if (!process.env.DATABASE_URL) {
    console.error('Falta DATABASE_URL en tu .env.local');
    process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL);

async function verifyProducts() {
    try {
        console.log("Checking products...");
        const products = await sql`
            SELECT id, name, price, category, is_active, image_url 
            FROM products 
            WHERE is_active = true 
            LIMIT 5
        `;
        console.log(`Found ${products.length} active products.`);
        console.log(products);
    } catch (e) {
        console.error("Error:", e);
    } finally {
        await sql.end();
    }
}

verifyProducts();
