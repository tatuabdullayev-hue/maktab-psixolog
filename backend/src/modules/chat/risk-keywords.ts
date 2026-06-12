export const RISK_KEYWORDS: string[] = [
  // o'zbek
  'o\'zimni o\'ldir',
  'ozimni oldir',
  'o\'limni xohlayman',
  'yashagim kelmayapti',
  'yashagim kelmaydi',
  'o\'zimga zarar',
  'ozimga zarar',
  'hech kimga kerak emasman',
  // rus
  'покончить с собой',
  'не хочу жить',
  'причинить себе вред',
  // ingliz
  'kill myself',
  'suicide',
  'self harm',
  'self-harm',
  'want to die',
];

export function containsRiskKeyword(text: string): boolean {
  const normalized = text.toLowerCase();
  return RISK_KEYWORDS.some((keyword) => normalized.includes(keyword));
}
