/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./src/app/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['var(--font-body)', 'sans-serif'],
                body: ['var(--font-body)', 'sans-serif'],
                title: ['var(--font-title)', 'serif'],
                serif: ['var(--font-title)', 'serif'],
                signature: ['var(--font-signature)', 'cursive'],
            },
            animation: {
                'spin-slow': 'spin 12s linear infinite',
            }
        },
    },
    plugins: [],
}
