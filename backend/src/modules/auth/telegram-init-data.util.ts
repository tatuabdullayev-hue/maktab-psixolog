import * as crypto from 'crypto';

interface TelegramWebAppUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
}

export interface ParsedInitData {
  user: TelegramWebAppUser;
  authDate: number;
}

/**
 * Validates Telegram Mini App initData per
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
export function validateTelegramInitData(
  initData: string,
  botToken: string,
): ParsedInitData {
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) {
    throw new Error('hash topilmadi');
  }
  params.delete('hash');

  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(botToken)
    .digest();

  const computedHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  if (computedHash !== hash) {
    throw new Error('initData imzosi noto\'g\'ri');
  }

  const userRaw = params.get('user');
  if (!userRaw) {
    throw new Error('user maydoni topilmadi');
  }

  return {
    user: JSON.parse(userRaw),
    authDate: Number(params.get('auth_date')),
  };
}
