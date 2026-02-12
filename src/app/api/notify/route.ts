import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { prisma } from '@/lib/prisma';
import { sendTelegramMessage } from '@/lib/telegram';

const BodySchema = z.object({
  secret: z.string().min(1),
  kind: z.enum(['generic', 'winner', 'deposit', 'withdrawal']),
  telegramId: z.string().min(1).optional(),
  chatId: z.string().min(1).optional(),
  message: z.string().min(1).optional(),
  payload: z.any().optional()
});

function requireSecret(provided: string) {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!expected) throw new Error('TELEGRAM_WEBHOOK_SECRET not configured');
  if (provided !== expected) throw new Error('Invalid secret');
}

export async function POST(req: NextRequest) {
  try {
    const json = await req.json().catch(() => null);
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 });
    }

    requireSecret(parsed.data.secret);

    // Resolve chat id
    let chatId = parsed.data.chatId ?? null;

    if (!chatId && parsed.data.telegramId) {
      const tgId = parsed.data.telegramId;
      const user = await prisma.user.findUnique({ where: { telegramId: tgId } });
      // Fallback: telegram user id is a valid chat_id for 1:1 bot chats (after user starts the bot).
      chatId = user?.botChatId ?? tgId;
    }

    if (!chatId) {
      return NextResponse.json({ error: 'Missing chatId (or user.botChatId not set yet)' }, { status: 400 });
    }

    let message = parsed.data.message ?? '';
    const p = parsed.data.payload;

    if (!message) {
      switch (parsed.data.kind) {
        case 'winner':
          message = `🎉 <b>Congratulations!</b>\n\nYou have a prize to claim in LLL.\n\nOpen the mini app to claim.`;
          break;
        case 'deposit':
          message = `✅ <b>Deposit received</b>\n\nYour LLL position has been updated.`;
          break;
        case 'withdrawal':
          message = `⏳ <b>Withdrawal queued</b>\n\nYour withdrawal request is in the queue.`;
          break;
        default:
          message = `🔔 <b>LLL update</b>`;
      }

      // Optional: attach short JSON details (dev)
      if (p) {
        try {
          message += `\n\n<code>${JSON.stringify(p).slice(0, 800)}</code>`;
        } catch {}
      }
    }

    const result = await sendTelegramMessage(chatId, message, { parseMode: 'HTML' });
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    const msg = e?.message ?? 'Internal error';
    const status = msg.includes('Invalid secret') ? 401 : 500;
    return NextResponse.json({ ok: false, error: msg }, { status });
  }
}
