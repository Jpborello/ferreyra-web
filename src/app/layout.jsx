import './globals.css';
import { Montserrat, Cormorant_Garamond, Mrs_Saint_Delafield } from 'next/font/google';

const bodyFont = Montserrat({
    subsets: ['latin'],
    variable: '--font-body',
    weight: ['300', '400', '500', '600', '700']
});

const titleFont = Cormorant_Garamond({
    subsets: ['latin'],
    variable: '--font-title',
    weight: ['400', '700'],
    style: ['normal', 'italic']
});

const signatureFont = Mrs_Saint_Delafield({
    weight: '400',
    subsets: ['latin'],
    variable: '--font-signature'
});

export const metadata = {
    title: 'Embutidos Ferreyra | Calidad de Campo',
    description: 'Tradición familiar al servicio de la gastronomía en Rosario. Calidad constante, sabor auténtico.',
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
