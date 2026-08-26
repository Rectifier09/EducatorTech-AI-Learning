import { NextResponse } from "next/server";
import { getProfileByReferralCode } from "@/lib/data/profile";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { origin } = new URL(request.url);
  const { code } = await params;
  const referrer = await getProfileByReferralCode(code);

  const response = NextResponse.redirect(`${origin}/login`);
  if (referrer) {
    response.cookies.set("referred_by", referrer.userId, {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
  }
  return response;
}
