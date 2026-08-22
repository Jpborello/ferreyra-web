import postgres from 'postgres';
import 'dotenv/config';

if (!process.env.DATABASE_URL) {
    console.error('Falta DATABASE_URL en tu .env.local');
    process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL);

async function checkCategories() {
    try {
        const counts = await sql`
            SELECT category, COUNT(*) 
            FROM products 
            WHERE is_active = true
            GROUP BY category
        `;
        console.log("Category Counts:", counts);
    } catch (e) {
        console.error("Error:", e);
    } finally {
        await sql.end();
    }
}

checkCategories();
