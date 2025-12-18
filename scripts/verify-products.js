import postgres from 'postgres';

const sql = postgres('postgresql://postgres.yfbhnvihdqwzxujszwic:Ferreyraemb2026@@aws-0-us-west-2.pooler.supabase.com:6543/postgres');

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
