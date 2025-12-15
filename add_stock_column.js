import postgres from 'postgres';

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
    console.error("No DATABASE_URL found");
    process.exit(1);
}

const sql = postgres(dbUrl);

async function addStockColumn() {
    try {
        console.log("Checking for 'stock' column...");

        // Check if column exists
        const columns = await sql`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'products' AND column_name = 'stock';
        `;

        if (columns.length === 0) {
            console.log("Adding 'stock' column...");
            await sql`
                ALTER TABLE products 
                ADD COLUMN stock INTEGER DEFAULT 0;
            `;
            console.log("✅ 'stock' column added successfully.");
        } else {
            console.log("ℹ️ 'stock' column already exists.");
        }

    } catch (error) {
        console.error("❌ Error adding column:", error);
    } finally {
        await sql.end();
    }
}

addStockColumn();
