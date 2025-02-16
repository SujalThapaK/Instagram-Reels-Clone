/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
    },
  },
  plugins: [],
  theme: {
    extend: {
      animation: {
        gradientBorder: 'gradientBorder 3s ease 1', // Runs once for 3 seconds
      },
      keyframes: {
        gradientBorder: {
          '0%': {
            'border-image': 'linear-gradient(90deg, rgba(255, 0, 150, 1) 0%, rgba(0, 204, 255, 1) 100%)',
            'border-image-slice': 1,
          },
          '100%': {
            'border-image': 'linear-gradient(90deg, rgba(0, 204, 255, 1) 0%, rgba(255, 0, 150, 1) 100%)',
            'border-image-slice': 1,
          },
        },
      },
    },
  },
};
