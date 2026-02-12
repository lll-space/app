const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

export type TelegramParseMode = 'HTML' | 'Markdown' | 'MarkdownV2';

export async function sendTelegramMessage(
  chatId: string,
  message: string,
  options?: {
    parseMode?: TelegramParseMode;
    disableWebPagePreview?: boolean;
  }
): Promise<{ ok: boolean; error?: string }> {
  if (!TELEGRAM_BOT_TOKEN) {
    return { ok: false, error: 'TELEGRAM_BOT_TOKEN not configured' };
  }

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: options?.parseMode ?? 'HTML',
        disable_web_page_preview: options?.disableWebPagePreview ?? true
      })
    });

    const data: any = await res.json().catch(() => null);
    if (!res.ok || !data?.ok) {
      return { ok: false, error: data?.description ?? `Telegram HTTP ${res.status}` };
    }

    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'unknown error' };
  }
}
