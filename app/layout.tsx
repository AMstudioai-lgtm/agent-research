import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Research Agent',
  description: 'Interface pédagogique d\'un agent de recherche préparant et structurant des plans de recherche avant exécution.',
  openGraph: {
    title: 'Research Agent',
    description: 'Interface pédagogique d\'un agent de recherche préparant et structurant des plans de recherche avant exécution.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Research Agent',
    description: 'Interface pédagogique d\'un agent de recherche préparant et structurant des plans de recherche avant exécution.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
