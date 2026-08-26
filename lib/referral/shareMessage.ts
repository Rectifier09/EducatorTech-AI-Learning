export function buildReferralLink(origin: string, code: string): string {
  return `${origin}/r/${code}`;
}

export function buildWhatsappShareHref(origin: string, code: string): string {
  const link = buildReferralLink(origin, code);
  const message = `I've been using SahajAiVidya to make worksheets and quizzes in minutes instead of hours — thought you'd like it too: ${link}`;
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}
