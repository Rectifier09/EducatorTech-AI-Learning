/**
 * Fire-and-forget server-side event mirror to Mixpanel's HTTP track API.
 * NEVER throws — analytics must not break the app. No-ops if the project
 * token isn't configured (e.g. local dev without Mixpanel set up).
 */
export async function trackServer(
  name: string,
  distinctId: string,
  props: Record<string, unknown> = {},
): Promise<void> {
  const token = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;
  if (!token) return;

  try {
    await fetch("https://api.mixpanel.com/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify([
        {
          event: name,
          properties: {
            ...props,
            token,
            distinct_id: distinctId,
            time: Math.floor(Date.now() / 1000),
            $insert_id: `${distinctId}-${name}-${Date.now()}`,
          },
        },
      ]),
    });
  } catch (e) {
    console.error("trackServer failed:", e);
  }
}

/**
 * Fire-and-forget profile-property mirror to Mixpanel's HTTP Engage API.
 * NEVER throws — analytics must not break the app. No-ops if the project
 * token isn't configured.
 */
export async function setProfileProperties(
  distinctId: string,
  props: Record<string, unknown>,
): Promise<void> {
  const token = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;
  if (!token) return;

  try {
    await fetch("https://api.mixpanel.com/engage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify([
        {
          $token: token,
          $distinct_id: distinctId,
          $set: props,
        },
      ]),
    });
  } catch (e) {
    console.error("setProfileProperties failed:", e);
  }
}
