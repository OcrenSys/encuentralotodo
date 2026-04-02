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

function getSerializedPublicRuntimeEnv() {
  return JSON.stringify({
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_AUTH_PROVIDER: process.env.NEXT_PUBLIC_AUTH_PROVIDER,
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID:
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  }).replace(/</g, '\\u003c');
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const publicRuntimeEnv = getSerializedPublicRuntimeEnv();

  return (
    <html lang="es">
      <body
        className={`${displayFont.variable} ${bodyFont.variable} font-body antialiased`}
      >
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__ET_PUBLIC_ENV__ = ${publicRuntimeEnv};`,
          }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
