const ADMIN_EMAILS = ["prashantpps09@gmail.com"];

export function isAdmin(email: string | null | undefined): boolean {
  return Boolean(email && ADMIN_EMAILS.includes(email.toLowerCase()));
}
