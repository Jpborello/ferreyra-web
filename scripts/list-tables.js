import postgres from 'postgres';
import 'dotenv/config';

if (!process.env.DATABASE_URL) {
    console.error('Falta DATABASE_URL en tu .env.local');
    process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL);

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
