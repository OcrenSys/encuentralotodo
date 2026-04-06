import type { Config } from 'tailwindcss';
import shared from './tailwind.shared.cjs';

const config: Config = shared.createConfig([
  './apps/web/src/**/*.{ts,tsx}',
  './packages/ui/src/**/*.{ts,tsx}',
]);

export default config;