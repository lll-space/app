import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/utils/session';

export async function GET(req: NextRequest) {
  const { session, response } = await getSession(req);

  if (!session.userId) {
    return NextResponse.json({ user: null }, { status: 200, headers: response.headers });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      telegramId: true,
      username: true,
      firstName: true,
      lastName: true,
      photoUrl: true,
      languageCode: true,
      botChatId: true,
      walletAddress: true,
      referralCode: true,
      referredBy: true,
      referralCount: true,
      isAdmin: true,
      createdAt: true,
      updatedAt: true
    }
  });

  return NextResponse.json({ user }, { status: 200, headers: response.headers });
}
