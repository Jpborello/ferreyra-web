import postgres from 'postgres';

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
