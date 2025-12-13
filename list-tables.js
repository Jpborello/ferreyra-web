import postgres from 'postgres';

const sql = postgres('postgresql://postgres.yfbhnvihdqwzxujszwic:Ferreyraemb2026@@aws-0-us-west-2.pooler.supabase.com:6543/postgres');

async function listTables() {
    try {
        const tables = await sql`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `;
        console.log("Tables in public schema:", tables);
    } catch (e) {
        console.error("Error:", e);
    } finally {
        await sql.end();
    }
}

listTables();
