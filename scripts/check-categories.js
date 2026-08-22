import postgres from 'postgres';
import 'dotenv/config';

if (!process.env.DATABASE_URL) {
    console.error('Falta DATABASE_URL en tu .env.local');
    process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL);

async function getCategories() {
    try {
        const categories = await sql`
            SELECT DISTINCT category 
            FROM products 
            WHERE is_active = true
        `;
        console.log("Distinct Categories:", categories);
    } catch (e) {
        console.error("Error:", e);
    } finally {
        await sql.end();
    }
}

getCategories();
