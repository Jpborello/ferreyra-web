import postgres from 'postgres';

const sql = postgres('postgresql://postgres.yfbhnvihdqwzxujszwic:Ferreyraemb2026@@aws-0-us-west-2.pooler.supabase.com:6543/postgres');

async function checkColumns() {
    try {
        const columns = await sql`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'products'
        `;
        console.log("Columns in products:", columns);
    } catch (e) {
        console.error("Error:", e);
    } finally {
        await sql.end();
    }
}

checkColumns();
