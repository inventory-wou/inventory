import type { Config } from "tailwindcss";

export default {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                // Light blue and gray theme
                primary: {
                    50: '#e8f4f8',
                    100: '#d1e9f1',
                    200: '#a3d3e3',
                    300: '#75bdd5',
                    400: '#47a7c7',
                    500: '#1991b9', // Main light blue
                    600: '#147494',
                    700: '#0f576f',
                    800: '#0a3a4a',
                    900: '#051d25',
                },
                secondary: {
                    50: '#f8f9fa',
                    100: '#f1f3f5',
                    200: '#e9ecef',
                    300: '#dee2e6',
                    400: '#ced4da',
                    500: '#adb5bd', // Light gray
                    600: '#868e96',
                    700: '#495057',
                    800: '#343a40',
                    900: '#212529',
                },
                accent: {
                    50: '#e3f2fd',
                    100: '#bbdefb',
                    200: '#90caf9',
                    300: '#64b5f6',
                    400: '#42a5f5',
                    500: '#2196f3',
                    600: '#1e88e5',
                    700: '#1976d2',
                    800: '#1565c0',
                    900: '#0d47a1',
                },
            },
            backgroundImage: {
                'gradient-primary': 'linear-gradient(135deg, #1991b9 0%, #42a5f5 100%)',
                'gradient-light': 'linear-gradient(135deg, #e8f4f8 0%, #f8f9fa 100%)',
            },
        },
    },
    plugins: [],
} satisfies Config;
