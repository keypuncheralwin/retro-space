import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import AuthListener from '@/components/AuthListener';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Passwordless Auth App',
  description: 'Secure authentication with email verification',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthListener />
        {children}
      </body>
    </html>
  );
}