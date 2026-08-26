import { supabase } from './supabase';

// Comprime/redimensiona una imagen en el navegador (canvas) antes de
// subirla, para no acumular fotos de varios MB por cada producto o slide
// que se carga desde el admin (el mismo problema que resolvimos con las
// imagenes fijas de public/, pero este pasa cada vez que se sube algo
// nuevo). Si por algun motivo la compresion no ayuda o el navegador no
// puede codificar el resultado, se usa el archivo original.
export async function compressImage(file, { maxDimension = 1600, quality = 0.82, mimeType = 'image/webp' } = {}) {
    if (!file || !file.type || !file.type.startsWith('image/')) return file;

    try {
        const dataUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });

        const imgEl = await new Promise((resolve, reject) => {
            const el = new window.Image();
            el.onload = () => resolve(el);
            el.onerror = reject;
            el.src = dataUrl;
        });

        let { width, height } = imgEl;
        if (width > maxDimension || height > maxDimension) {
            if (width >= height) {
                height = Math.round(height * (maxDimension / width));
                width = maxDimension;
            } else {
                width = Math.round(width * (maxDimension / height));
                height = maxDimension;
            }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(imgEl, 0, 0, width, height);

        const blob = await new Promise(resolve => canvas.toBlob(resolve, mimeType, quality));
        if (!blob || blob.size >= file.size) return file;

        const newName = file.name.replace(/\.[^.]+$/, '') + '.webp';
        return new File([blob], newName, { type: mimeType });
    } catch (e) {
        console.error('No se pudo comprimir la imagen, se sube el original:', e);
        return file;
    }
}

// Convierte una Public URL de Supabase Storage de vuelta al path relativo
// dentro del bucket, para poder pasarsela a storage.remove(). Si la URL no
// pertenece a este bucket (por ejemplo una imagen puesta a mano desde otro
// origen), devuelve null y no se intenta borrar nada.
export function extractStoragePath(url, bucket) {
    if (typeof url !== 'string') return null;
    const marker = `/storage/v1/object/public/${bucket}/`;
    const idx = url.indexOf(marker);
    if (idx === -1) return null;
    return decodeURIComponent(url.slice(idx + marker.length));
}

// Borra una imagen de Storage a partir de su Public URL. Best-effort: si
// falla (o la URL no es de este bucket) no tira excepcion, solo lo deja en
// consola. Se usa tanto al reemplazar una foto como al borrar el registro
// que la usaba.
export function deleteStorageImage(bucket, url) {
    const path = extractStoragePath(url, bucket);
    if (!path) return;
    supabase.storage.from(bucket).remove([path]).then(({ error }) => {
        if (error) console.error(`No se pudo borrar la imagen anterior de "${bucket}":`, error);
    });
}

// Comprime y sube un archivo con nombre unico, devuelve la Public URL, y si
// habia una imagen anterior alojada en el mismo bucket la borra en segundo
// plano (no bloquea el guardado ni lo hace fallar si el borrado falla).
export async function uploadImageAndReplace({ bucket = 'products', folder = '', file, previousUrl }) {
    const compressed = await compressImage(file);
    const fileExt = compressed.name.split('.').pop();
    const fileName = `${Math.random().toString(36).slice(2)}_${Date.now()}.${fileExt}`;
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, compressed);
    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(filePath);

    if (previousUrl) deleteStorageImage(bucket, previousUrl);

    return publicUrl;
}
