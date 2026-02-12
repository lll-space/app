'use client';

import { withTelegramAuth } from '@/hooks/withTelegramAuth';

function Home() {
  return (
    <main style={{ padding: 16 }}>
      <h1>LLL (Lossless Lottery)</h1>
      <p>Auth skeleton initialized (Telegram initData + Prisma + iron-session).</p>
      <p>Next: wallet linking + notifications + TonConnect UI.</p>
    </main>
  );
}

export default withTelegramAuth(Home);
