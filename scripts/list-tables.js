import postgres from 'postgres';
import dotenv from 'dotenv';
// dotenv por default solo carga '.env'. Este proyecto usa '.env.local'
// (la convención de Next.js), así que hay que apuntarlo explícitamente
// o process.env.DATABASE_URL queda undefined y estos scripts fallan
// con "No DATABASE_URL found" aunque el archivo exista y esté bien.
dotenv.config({ path: '.env.local' });

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
