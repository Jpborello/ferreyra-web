import HomeClient from './HomeClient';
import { getProducts, getSlidesRaw } from '../lib/products';

export const metadata = {
    title: 'Embutidos Ferreyra | Mayorista de Carnes y Embutidos en Rosario',
    alternates: {
        canonical: '/',
    },
};

// El catalogo se puede editar desde /admin en cualquier momento, asi que
// no queda estatico para siempre: Next vuelve a generar esta pagina en el
// servidor como maximo cada 60s (ISR), sin volver a pagar el costo de un
// fetch client-side en cada visita.
export const revalidate = 60;

export default async function Home() {
    const [initialProducts, initialSlidesRaw] = await Promise.all([
        getProducts(),
        getSlidesRaw(),
    ]);

    return <HomeClient initialProducts={initialProducts} initialSlidesRaw={initialSlidesRaw} />;
}
