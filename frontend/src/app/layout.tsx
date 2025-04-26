// src/app/layout.tsx
import './globals.css'; // Make sure this is correct

import { ReactNode } from 'react';

export const metadata = {
  title: 'ShelterSignal',
  description: 'Search for property insights',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-100 min-h-screen">{children}</body>
    </html>
  );
}
