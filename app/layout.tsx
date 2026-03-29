import type { Metadata } from 'next';
import { Playfair_Display, DM_Sans } from 'next/font/google';
import './globals.css';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "AI Travel Companion — India's Smartest Trip Planner",
  description: "Quiz-first AI itinerary planner for independent Indian travellers. Discover hidden gems, plan smart budgets, and travel with purpose.",
  keywords: ['india travel', 'trip planner', 'ai itinerary', 'hidden gems india', 'budget travel india'],
  openGraph: {
    title: 'AI Travel Companion',
    description: 'Plan the perfect India trip with AI — quiz first, itinerary second.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${dmSans.variable}`}>
      <body className="bg-cream font-body text-ink antialiased">
        {children}
      </body>
    </html>
  );
}