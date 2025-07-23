/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
  safelist: [
    'bg-blue-100',
    'bg-blue-500',
    'bg-green-100',
    'bg-green-500',
    'bg-purple-100',
    'bg-purple-500',
    'bg-orange-100',
    'bg-orange-500',
    'bg-pink-100',
    'bg-pink-500',
  ],
}