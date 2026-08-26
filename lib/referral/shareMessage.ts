export function buildReferralLink(origin: string, code: string): string {
  return `${origin}/r/${code}`;
}

export function buildWhatsappShareHref(origin: string, code: string): string {
  const link = buildReferralLink(origin, code);
  const message = `Hi! Ever wished learning AI felt as easy as using it? SahajAiVidya is built just for teachers — bite-sized AI & Tech lessons that turn into real worksheets and quizzes for your class in minutes. Try it: ${link}`;
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}
