import HomeClient from './HomeClient';

export const metadata = {
    title: 'Embutidos Ferreyra | Mayorista de Carnes y Embutidos en Rosario',
    alternates: {
        canonical: '/',
    },
};

export default function Home() {
    return <HomeClient />;
}
