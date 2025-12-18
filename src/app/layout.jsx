import './globals.css';
import { Montserrat, Cormorant_Garamond, Mrs_Saint_Delafield } from 'next/font/google';

const bodyFont = Montserrat({
    subsets: ['latin'],
    variable: '--font-body',
    weight: ['300', '400', '500', '600', '700'],
    display: 'swap',
    preload: false,
});

const titleFont = Cormorant_Garamond({
    subsets: ['latin'],
    variable: '--font-title',
    weight: ['400', '700'],
    style: ['normal', 'italic'],
    display: 'swap',
    preload: false,
});

const signatureFont = Mrs_Saint_Delafield({
    weight: '400',
    subsets: ['latin'],
    variable: '--font-signature',
    display: 'swap',
    preload: false,
});

export const metadata = {
    metadataBase: new URL('https://www.ferreyraembutidos.com'),
    title: {
        default: 'Embutidos Ferreyra | Calidad de Campo',
        template: '%s | Embutidos Ferreyra'
    },
    description: 'Distribuidor mayorista de carne, cerdo, pollo y embutidos en Rosario y zona. Tradición familiar y calidad de campo para gastronomía y comercios.',
    alternates: {
        canonical: '/',
    },
    openGraph: {
        title: 'Embutidos Ferreyra | Calidad de Campo',
        description: 'Distribuidor mayorista de carne, cerdo, pollo y embutidos en Rosario y zona. Tradición familiar y calidad de campo para gastronomía y comercios.',
        url: 'https://www.ferreyraembutidos.com',
        siteName: 'Embutidos Ferreyra',
        images: [
            {
                url: '/opengraph-image.jpg',
                width: 1200,
                height: 630,
                alt: 'Embutidos Ferreyra',
            }
        ],
        locale: 'es_AR',
        type: 'website',
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
    icons: {
        icon: '/favicon.ico',
        apple: '/apple-touch-icon.png',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Embutidos Ferreyra',
        description: 'Calidad de campo y tradición en Rosario.',
        images: ['/opengraph-image.jpg'],
    },
};

export default function RootLayout({ children }) {
    return (
        <html lang="es" className={`${bodyFont.variable} ${titleFont.variable} ${signatureFont.variable}`} suppressHydrationWarning>
            <body>
                {children}
            </body>
        </html>
    );
}
