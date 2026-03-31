import type { Metadata } from 'next';
import { Manrope, Space_Grotesk } from 'next/font/google';

import './global.css';

import { Providers } from './providers';

const displayFont = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
});

const bodyFont = Manrope({
  subsets: ['latin'],
  variable: '--font-body',
});

export const metadata: Metadata = {
  title: 'EncuentraloTodo Console',
  description:
    'Consola web para administrar negocios, operaciones, promociones y workflows de EncuentraloTodo.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body
        className={`${displayFont.variable} ${bodyFont.variable} font-body antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
