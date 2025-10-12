import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { WalletProvider } from '@/context/WalletProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '🎰 Sloto-caster - Win ETH By playing!',
  description: 'Farcaster slot machine game on Base network. Hit 7️⃣7️⃣7️⃣ to win $1.00 ETH!',
  keywords: ['farcaster', 'base', 'slot machine', 'crypto', 'web3', 'game', 'ethereum', 'casino', 'miniapp'],
  authors: [{ name: 'Sloto-caster Team' }],
  openGraph: {
    title: '🎰 Sloto-caster - Win ETH By playing!',
    description: 'Hit 7️⃣7️⃣7️⃣ to win $1.00 ETH! Farcaster slot machine game on Base network.',
    siteName: 'Sloto-caster',
    type: 'website',
    images: [
      {
        url: 'https://sloto-caster.vercel.app/previews.png',
        width: 1200,
        height: 630,
        alt: 'Sloto-caster - Farcaster Slot Machine Game',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '🎰 Sloto-caster - Win ETH By playing!',
    description: 'Hit 7️⃣7️⃣7️⃣ to win $1.00 ETH! Farcaster slot machine game on Base network.',
    images: ['https://sloto-caster.vercel.app/previews.png'],
  },
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#7c3aed',
  other: {
    'fc:frame': 'vNext',
    'fc:frame:image': 'https://sloto-caster.vercel.app/previews.png',
    'fc:frame:button:1': 'Play Sloto-caster',
    'fc:frame:button:1:action': 'link',
    'fc:frame:button:1:target': 'https://sloto-caster.vercel.app',
  },
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
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={inter.className}>
        <WalletProvider>
          {children}
        </WalletProvider>
      </body>
    </html>
  );
}
