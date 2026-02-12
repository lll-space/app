import { NextRequest, NextResponse } from 'next/server';
import { isValid, parse } from '@tma.js/init-data-node';
import { randomBytes } from 'crypto';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/utils/session';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

function generateReferralCode() {
  return `REF-${randomBytes(4).toString('hex').toUpperCase()}`;
}

async function extractReferralFromInitData(initData: string) {
  try {
    const params = new URLSearchParams(initData);
    const startParam = params.get('start_param');
    if (startParam && startParam.startsWith('ref_')) {
      const referralCode = startParam.replace('ref_', '');
      const referrer = await prisma.user.findUnique({ where: { referralCode } });
      return referrer?.id ?? null;
    }
    return null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { initData } = await req.json().catch(() => ({}));
    if (!initData) return NextResponse.json({ error: 'Missing initData' }, { status: 400 });

    if (!BOT_TOKEN) return NextResponse.json({ error: 'Missing TELEGRAM_BOT_TOKEN' }, { status: 500 });

    if (!isValid(initData, BOT_TOKEN)) {
      return NextResponse.json({ error: 'Invalid Telegram payload signature' }, { status: 401 });
    }

    const data = parse(initData);
    if (!data?.user?.id) return NextResponse.json({ error: 'Missing Telegram user payload' }, { status: 400 });

    const telegramId = String(data.user.id);

    let user = await prisma.user.findUnique({ where: { telegramId } });

    if (!user) {
      const referredById = await extractReferralFromInitData(initData);

      user = await prisma.user.create({
        data: {
          telegramId,
          username: data.user.username,
          firstName: data.user.first_name,
          lastName: data.user.last_name,
          photoUrl: data.user.photo_url,
          referralCode: generateReferralCode(),
          referredBy: referredById || undefined,
          languageCode: data.user.language_code || 'en',
          botChatId: data.chat?.id ? String(data.chat.id) : undefined
        }
      });

      if (referredById) {
        await prisma.user.update({
          where: { id: referredById },
          data: { referralCount: { increment: 1 } }
        });
      }
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          username: data.user.username,
          firstName: data.user.first_name,
          lastName: data.user.last_name,
          photoUrl: data.user.photo_url,
          botChatId: data.chat?.id ? String(data.chat.id) : undefined,
          referralCode: user.referralCode || generateReferralCode()
        }
      });
    }

    const res = NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        telegramId: user.telegramId,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        photoUrl: user.photoUrl,
        referralCode: user.referralCode,
        walletAddress: user.walletAddress
      }
    });

    const { session } = await getSession(req, res);
    session.userId = user.id;
    session.telegramId = telegramId;
    session.tg = { user: data.user, chat: data.chat, auth_date: data.auth_date };
    session.profile = {
      username: data.user.username,
      first_name: data.user.first_name,
      last_name: data.user.last_name,
      photo_url: data.user.photo_url,
      language_code: data.user.language_code
    };
    await session.save();

    return res;
  } catch (error) {
    console.error('Authentication error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { session, response } = await getSession(req);
  return NextResponse.json(
    {
      profile: session.profile ?? null,
      telegramId: session.telegramId ?? null,
      userId: session.userId ?? null
    },
    { status: 200, headers: response.headers }
  );
}
