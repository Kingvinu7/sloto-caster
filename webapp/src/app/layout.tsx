import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '🎰 Sloto-caster - Win ETH By playing!',
  description: 'Farcaster slot machine game on Base network.',
  keywords: ['farcaster', 'base', 'slot machine', 'crypto', 'web3', 'game', 'ethereum', 'casino'],
  authors: [{ name: 'Sloto-caster Team' }],
  openGraph: {
    title: '🎰 Sloto-caster - Win ETH By playing!',
    description: 'Farcaster slot machine game on Base network.',
    siteName: 'Sloto-caster',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '🎰 Sloto-caster - Win ETH By playing!',
    description: 'Farcaster slot machine game on Base network.',
  },
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#7c3aed',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script src="https://cdn.jsdelivr.net/npm/ethers@6.8.0/dist/ethers.umd.min.js" defer></script>
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🎰</text></svg>"
        />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
