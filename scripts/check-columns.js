import postgres from 'postgres';
import 'dotenv/config';

if (!process.env.DATABASE_URL) {
    console.error('Falta DATABASE_URL en tu .env.local');
    process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL);

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
