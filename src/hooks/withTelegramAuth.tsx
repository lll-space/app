'use client';

import type { ComponentType } from 'react';
import { useTelegramAuth, AuthenticationState } from './useTelegramAuth';

export function withTelegramAuth<P>(WrappedComponent: ComponentType<P>, allowPublic = false) {
  const botId = process.env.NEXT_PUBLIC_TELEGRAM_BOT_ID ?? 'LLL_Space_Bot';
  const botUrl = `https://t.me/${botId}`;

  function TelegramAuthWrapper(props: P) {
    const authState = useTelegramAuth();

    if (!allowPublic && authState === AuthenticationState.Checking) return null;

    if (!allowPublic && authState === AuthenticationState.Loading) {
      return <div style={{ padding: 16 }}>Connecting to Telegram…</div>;
    }

    if (!allowPublic && authState === AuthenticationState.NotAvailable) {
      return (
        <div style={{ padding: 16 }}>
          <h1>Open LLL in Telegram</h1>
          <p>This experience is Telegram-only. Launch the mini app to continue.</p>
          <a href={botUrl} target="_blank" rel="noreferrer">Open in Telegram</a>
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  }

  return TelegramAuthWrapper;
}
