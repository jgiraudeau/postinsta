import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PostInsta',
  description: 'Outil de création de contenu Instagram',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" translate="no">
      <head>
        <meta name="google" content="notranslate" />
      </head>
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased notranslate">
        {children}
      </body>
    </html>
  );
}
