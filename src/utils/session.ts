import { getIronSession, type IronSession } from 'iron-session';
import { NextRequest, NextResponse } from 'next/server';

export interface TelegramProfile {
  username?: string;
  first_name?: string;
  last_name?: string;
  photo_url?: string;
  language_code?: string;
}

export interface TelegramSession {
  userId?: string; // internal User.id (uuid)
  telegramId?: string; // telegram user id (stringified)
  tg?: { user: unknown; chat?: unknown; auth_date?: number };
  profile?: TelegramProfile;
}

const baseSessionOptions = {
  cookieName: 'tg_session',
  password: process.env.IRON_SESSION_PASSWORD ?? '',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 30
  }
};

export async function getSession(
  req: NextRequest,
  res: NextResponse = NextResponse.next()
): Promise<{ session: IronSession<TelegramSession>; response: NextResponse }> {
  if (!baseSessionOptions.password || baseSessionOptions.password.length < 32) {
    throw new Error('IRON_SESSION_PASSWORD must be set and at least 32 characters long.');
  }
  const session = await getIronSession<TelegramSession>(req, res, baseSessionOptions);
  return { session, response: res };
}
