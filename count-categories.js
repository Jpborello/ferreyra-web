import postgres from 'postgres';

const sql = postgres('postgresql://postgres.yfbhnvihdqwzxujszwic:Ferreyraemb2026@@aws-0-us-west-2.pooler.supabase.com:6543/postgres');

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
