import postgres from 'postgres';
import dotenv from 'dotenv';
// dotenv por default solo carga '.env'. Este proyecto usa '.env.local'
// (la convención de Next.js), así que hay que apuntarlo explícitamente
// o process.env.DATABASE_URL queda undefined y estos scripts fallan
// con "No DATABASE_URL found" aunque el archivo exista y esté bien.
dotenv.config({ path: '.env.local' });

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
    console.error("No DATABASE_URL found");
    process.exit(1);
}

const sql = postgres(dbUrl);

async function checkSchema() {
    try {
        const columns = await sql`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'products';
        `;
        console.log("Columns in 'products' table:");
        console.table(columns);
    } catch (error) {
        console.error("Error:", error);
    } finally {
        await sql.end();
    }
}

checkSchema();
