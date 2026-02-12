import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/utils/session';

const BodySchema = z.object({
  // Optional: allow client to explicitly provide chatId (if available)
  botChatId: z.string().min(1).optional()
});

/**
 * Client check-in endpoint.
 *
 * Purpose:
 * - keep last_seen
 * - ensure we have a usable botChatId for notifications
 */
export async function POST(req: NextRequest) {
  const { session, response } = await getSession(req);

  if (!session.userId || !session.telegramId) {
    return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401, headers: response.headers });
  }

  const json = await req.json().catch(() => ({}));
  const parsed = BodySchema.safeParse(json);

  const botChatId = parsed.success
    ? (parsed.data.botChatId ?? session.telegramId)
    : session.telegramId;

  await prisma.user.update({
    where: { id: session.userId },
    data: {
      botChatId,
      updatedAt: new Date()
    }
  });

  return NextResponse.json({ ok: true, botChatId }, { status: 200, headers: response.headers });
}
