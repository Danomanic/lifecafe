module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    // include other paths as necessary
  ],
  safelist: [
    "bg-yellow-800",
    "bg-red-800",
    "bg-slate-800",
    "bg-stone-800",
    "bg-purple-800",
    'bg-indigo-800',
    'bg-green-800',
    'bg-teal-800',
    'bg-blue-800',
    'bg-amber-800',
    'bg-orange-800',
    'bg-gray-800',
  ],
  theme: {
    extend: {
      colors: {
        'brand-teal': '#00bfb2',      // Primary button color
        'brand-navy': '#003b49',      // Dark backgrounds
        'brand-yellow': '#ffc845',    // Accents
        'brand-pink': '#e56db1',      // Secondary accents
      }
    },
  },
  plugins: [],
};