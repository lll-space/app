import type { ReactNode } from 'react';

export const metadata = {
  title: 'LLL Mini App',
  description: 'Lossless Lottery on TON'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif' }}>{children}</body>
    </html>
  );
}
