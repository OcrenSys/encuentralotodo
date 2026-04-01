const { createConfig } = require('../../tailwind.shared.cjs');

/** @type {import('tailwindcss').Config} */
module.exports = createConfig([
  './src/**/*.{ts,tsx}',
  '../../packages/ui/src/**/*.{ts,tsx}',
]);
