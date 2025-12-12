/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
    },
  },
  plugins: [],
  safelist: [
    'min-h-[200px]',
    'min-h-[250px]',
    'min-h-[300px]',
    'w-full',
    'w-5/12',
    'w-7/12',
    'bg-neutral-50',
    'bg-neutral-900',
    'text-gray-800',
    'text-gray-100',
    'border-gray-200',
    'border-gray-700',
  ],
}

