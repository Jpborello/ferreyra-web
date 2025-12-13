import postgres from 'postgres';

const sql = postgres('postgresql://postgres.yfbhnvihdqwzxujszwic:Ferreyraemb2026@@aws-0-us-west-2.pooler.supabase.com:6543/postgres');

async function checkData() {
    try {
        console.log("Connecting...");
        // 1. Check Restaurant
        const restaurants = await sql`SELECT * FROM restaurants WHERE slug = 'ferreyra-carnes'`;
        console.log("Restaurant:", restaurants);

        if (restaurants.length > 0) {
            const shopId = restaurants[0].id;
            // 2. Check Products
            const products = await sql`SELECT id, name, is_active FROM products WHERE restaurant_id = ${shopId}`;
            console.log(`Found ${products.length} products associated with this restaurant.`);
            if (products.length > 0) {
                console.log("Sample:", products.slice(0, 3));
            } else {
                const allProducts = await sql`SELECT count(*) FROM products`;
                console.log("Total products in table:", allProducts);
            }
        } else {
            console.log("Restaurant 'ferreyra-carnes' NOT found in new DB.");
            const allRests = await sql`SELECT * FROM restaurants`;
            console.log("Available restaurants:", allRests);
        }
    } catch (e) {
        console.error("Error:", e);
    } finally {
        await sql.end();
    }
}

checkData();
