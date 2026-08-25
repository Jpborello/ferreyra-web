import { supabase } from './supabase';

// Normaliza los productos crudos que vienen de Supabase (precio a Number,
// categoria con fallback). Se usa tanto en el fetch inicial del servidor
// (page.jsx) como en el refetch de respaldo del cliente (HomeClient.jsx),
// para no duplicar esta logica en dos lugares que se puedan desincronizar.
export function normalizeProducts(data) {
    return (data || []).map(d => ({
        ...d,
        price: Number(d.price),
        category: d.category || 'Varios',
    }));
}

export async function getProducts() {
    const { data, error } = await supabase
        .from('products')
        .select('id, name, price, category, image_url, is_active, unit')
        .eq('is_active', true);

    if (error) {
        console.error('Supabase error (getProducts):', error);
        return [];
    }
    return normalizeProducts(data);
}

export async function getSlidesRaw() {
    const { data, error } = await supabase
        .from('slides')
        .select('*')
        .eq('active', true)
        .order('display_order', { ascending: true });

    if (error) {
        console.error('Supabase error (getSlidesRaw):', error);
        return [];
    }
    return data || [];
}
