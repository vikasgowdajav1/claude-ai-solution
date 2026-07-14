const colors = ['blue', 'green', 'red', 'purple', 'orange', 'yellow'];

const safelist = colors.flatMap((color) => [
  `border-${color}-200`,
  `hover:bg-${color}-50`,
]);

module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {},
  },
  safelist,
  plugins: [require('@tailwindcss/typography')],
};