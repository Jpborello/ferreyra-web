import postgres from 'postgres';
import dotenv from 'dotenv';
// dotenv por default solo carga '.env'. Este proyecto usa '.env.local'
// (la convención de Next.js), así que hay que apuntarlo explícitamente
// o process.env.DATABASE_URL queda undefined y estos scripts fallan
// con "No DATABASE_URL found" aunque el archivo exista y esté bien.
dotenv.config({ path: '.env.local' });

// Agrega la columna 'unit' a products (si no existe) y completa un valor
// razonable para los productos que ya están cargados, en base al nombre.
// Sin esto, el catálogo muestra "PRECIO X KG" para TODO, incluidos productos
// que se venden por docena/unidad (ej. Huevos).
//
// Uso: node scripts/add_unit_column.js   (con DATABASE_URL en .env.local)

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
    console.error("No DATABASE_URL found");
    process.exit(1);
}

const sql = postgres(dbUrl);

async function addUnitColumn() {
    try {
        console.log("Verificando columna 'unit'...");

        const columns = await sql`
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'products' AND column_name = 'unit';
        `;

        if (columns.length === 0) {
            console.log("Agregando columna 'unit'...");
            await sql`
                ALTER TABLE products
                ADD COLUMN unit TEXT DEFAULT 'kg';
            `;
            console.log("✅ Columna 'unit' agregada.");
        } else {
            console.log("ℹ️ La columna 'unit' ya existe.");
        }

        // Completa productos existentes que todavía no tengan unit seteado.
        // Por defecto todo queda en 'kg' (el default de la columna ya cubre
        // esto), y corregimos los casos conocidos que NO se venden por kilo
        // según el nombre del producto.
        const updatedDocena = await sql`
            UPDATE products
            SET unit = 'docena'
            WHERE (unit IS NULL OR unit = 'kg')
              AND name ILIKE '%docena%'
              AND name NOT ILIKE '%media%'
            RETURNING id, name;
        `;
        const updatedMediaDocena = await sql`
            UPDATE products
            SET unit = 'media docena'
            WHERE (unit IS NULL OR unit = 'kg')
              AND name ILIKE '%media%docena%'
            RETURNING id, name;
        `;
        const updatedRestNull = await sql`
            UPDATE products
            SET unit = 'kg'
            WHERE unit IS NULL
            RETURNING id, name;
        `;

        console.log(`✅ ${updatedDocena.length} producto(s) marcados como 'docena':`, updatedDocena.map(p => p.name));
        console.log(`✅ ${updatedMediaDocena.length} producto(s) marcados como 'media docena':`, updatedMediaDocena.map(p => p.name));
        if (updatedRestNull.length) {
            console.log(`ℹ️ ${updatedRestNull.length} producto(s) sin unit definido, se dejaron en 'kg' por defecto.`);
        }

        console.log("\nListo. Revisá en /admin > Productos que cada producto tenga la unidad correcta");
        console.log("(por ejemplo, si hay Huevos que no se llaman 'Docena de Huevos' textualmente,");
        console.log("van a haber quedado en 'kg' y hay que corregirlos a mano desde el panel).");

    } catch (error) {
        console.error("❌ Error:", error);
    } finally {
        await sql.end();
    }
}

addUnitColumn();
