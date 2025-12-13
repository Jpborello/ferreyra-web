import postgres from 'postgres';

const sql = postgres('postgresql://postgres.yfbhnvihdqwzxujszwic:Ferreyraemb2026@@aws-0-us-west-2.pooler.supabase.com:6543/postgres');

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
