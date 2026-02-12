'use client';

import { useEffect, useState } from 'react';
import { initDataRaw as _initDataRaw, useLaunchParams, useSignal } from '@telegram-apps/sdk-react';
import { useRouter } from 'next/navigation';

export enum AuthenticationState {
  Checking,
  Loading,
  NotAvailable,
  Authenticated
}

export function useTelegramAuth() {
  const [authState, setAuthState] = useState<AuthenticationState>(AuthenticationState.Checking);
  const initDataRaw = useSignal(_initDataRaw);

  let startParam: string | null = null;
  try {
    const lp = useLaunchParams(true);
    startParam = lp?.tgWebAppData?.startParam ?? null;
  } catch {
    startParam = null;
  }

  const { push } = useRouter();
  useEffect(() => {
    if (!startParam) return;
    // optional: handle deep links later
    // push(`/${startParam.replace('_', '/')}`);
  }, [startParam]);

  useEffect(() => {
    if (!initDataRaw) {
      setAuthState((prev) =>
        prev === AuthenticationState.Authenticated ? AuthenticationState.Authenticated : AuthenticationState.NotAvailable
      );
      return;
    }

    setAuthState(AuthenticationState.Loading);

    fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ initData: initDataRaw })
    })
      .then(async (r) => {
        if (!r.ok) throw new Error('auth failed');
        setAuthState(AuthenticationState.Authenticated);
      })
      .catch(() => {
        setAuthState(AuthenticationState.NotAvailable);
      });
  }, [initDataRaw]);

  return authState;
}
