/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: 'class',
    content: ['./web/index.html', './web/src/**/*.{js,ts,jsx,tsx}'],
    theme: {
        extend: {
            colors: {
                plum: '#8d0e57',
                'plum-dark': '#7f0d4f',
                sky: '#2ea3f2',
                sand: '#f8df8d',
                forest: '#5f9d4d',
                ink: '#2d3940',
                slate: '#32373c'
            },
            fontFamily: {
                display: ['"Nunito"', '"Segoe UI"', 'system-ui', 'sans-serif'],
                body: ['"Nunito"', '"Segoe UI"', 'system-ui', 'sans-serif']
            },
            boxShadow: {
                glow: '0 10px 40px rgba(141, 14, 87, 0.35)',
                subtle: '0 12px 30px rgba(0, 0, 0, 0.12)'
            },
            borderRadius: {
                xl: '1rem'
            },
            backdropBlur: {
                xs: '2px'
            }
        }
    },
    plugins: [require('@tailwindcss/forms')]
};
