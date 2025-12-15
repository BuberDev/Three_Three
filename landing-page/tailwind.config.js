/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
        './pages/**/*.{ts,tsx}',
        './components/**/*.{ts,tsx}',
        './app/**/*.{ts,tsx}',
        './src/**/*.{ts,tsx}',
    ],
    prefix: "",
    theme: {
        container: {
            center: true,
            padding: "2rem",
            screens: {
                "2xl": "1400px",
            },
        },
        extend: {
            colors: {
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                primary: {
                    DEFAULT: "hsl(var(--primary))",
                    foreground: "hsl(var(--primary-foreground))",
                },
                secondary: {
                    DEFAULT: "hsl(var(--secondary))",
                    foreground: "hsl(var(--secondary-foreground))",
                },
                destructive: {
                    DEFAULT: "hsl(var(--destructive))",
                    foreground: "hsl(var(--destructive-foreground))",
                },
                muted: {
                    DEFAULT: "hsl(var(--muted))",
                    foreground: "hsl(var(--muted-foreground))",
                },
                accent: {
                    DEFAULT: "hsl(var(--accent))",
                    foreground: "hsl(var(--accent-foreground))",
                },
                popover: {
                    DEFAULT: "hsl(var(--popover))",
                    foreground: "hsl(var(--popover-foreground))",
                },
                card: {
                    DEFAULT: "hsl(var(--card))",
                    foreground: "hsl(var(--card-foreground))",
                },
                // Royal/Masonic palette
                royal: {
                    50: '#f8f7ff',
                    100: '#f1edff',
                    200: '#e5ddff',
                    300: '#d1c0ff',
                    400: '#b794ff',
                    500: '#9c5cff',
                    600: '#8b3df7',
                    700: '#7c2de3',
                    800: '#6927bf',
                    900: '#57229c',
                    950: '#35146a',
                },
                gold: {
                    50: '#fefdf0',
                    100: '#fefae1',
                    200: '#fcf1b3',
                    300: '#f9e380',
                    400: '#f5ce4d',
                    500: '#f0b824',
                    600: '#e59815',
                    700: '#bf7312',
                    800: '#9b5a16',
                    900: '#7f4917',
                    950: '#472609',
                },
                platinum: {
                    50: '#f9fafb',
                    100: '#f3f4f6',
                    200: '#e5e7eb',
                    300: '#d1d5db',
                    400: '#9ca3af',
                    500: '#6b7280',
                    600: '#4b5563',
                    700: '#374151',
                    800: '#1f2937',
                    900: '#111827',
                    950: '#030712',
                }
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                serif: ['Playfair Display', 'Georgia', 'serif'],
                mono: ['JetBrains Mono', 'monospace'],
            },
            fontSize: {
                'xs': '0.75rem',
                'sm': '0.875rem',
                'base': '1rem',
                'lg': '1.125rem',
                'xl': '1.25rem',
                '2xl': '1.5rem',
                '3xl': '1.875rem',
                '4xl': '2.25rem',
                '5xl': '3rem',
                '6xl': '3.75rem',
                '7xl': '4.5rem',
                '8xl': '6rem',
                '9xl': '8rem',
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
                'royal-gradient': 'linear-gradient(135deg, rgb(139, 61, 247) 0%, rgb(156, 92, 255) 50%, rgb(240, 184, 36) 100%)',
                'premium-gradient': 'linear-gradient(120deg, rgb(87, 34, 156) 0%, rgb(139, 61, 247) 40%, rgb(28, 25, 23) 100%)',
                'luxury-gradient': 'radial-gradient(ellipse at center, rgb(139, 61, 247) 0%, rgb(87, 34, 156) 70%, rgb(17, 24, 39) 100%)',
            },
            animation: {
                'fade-in': 'fadeIn 0.5s ease-in-out',
                'slide-up': 'slideUp 0.5s ease-out',
                'glow': 'glow 2s ease-in-out infinite alternate',
                'float': 'float 6s ease-in-out infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                glow: {
                    '0%': { textShadow: '0 0 5px rgb(139, 61, 247), 0 0 10px rgb(139, 61, 247), 0 0 15px rgb(139, 61, 247)' },
                    '100%': { textShadow: '0 0 10px rgb(240, 184, 36), 0 0 20px rgb(240, 184, 36), 0 0 30px rgb(240, 184, 36)' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-20px)' },
                },
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },
        },
    },
    plugins: [require("@tailwindcss/typography")],
}