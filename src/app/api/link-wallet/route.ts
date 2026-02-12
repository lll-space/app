import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/utils/session';

const BodySchema = z.object({
  walletAddress: z.string().min(10).max(120)
});

export async function POST(req: NextRequest) {
  try {
    const { session, response } = await getSession(req);

    if (!session.userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401, headers: response.headers });
    }

    const json = await req.json().catch(() => null);
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400, headers: response.headers });
    }

    const walletAddress = parsed.data.walletAddress.trim();

    const user = await prisma.user.update({
      where: { id: session.userId },
      data: { walletAddress }
    });

    return NextResponse.json(
      { ok: true, user: { id: user.id, telegramId: user.telegramId, walletAddress: user.walletAddress } },
      { status: 200, headers: response.headers }
    );
  } catch (error) {
    console.error('link-wallet error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
