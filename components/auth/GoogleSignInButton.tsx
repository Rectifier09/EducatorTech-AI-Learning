"use client";

import { useState } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

export function GoogleSignInButton() {
  const [loading, setLoading] = useState(false);

  async function signIn() {
    setLoading(true);
    const supabase = createBrowserClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setLoading(false); // otherwise the browser navigates to Google
  }

  return (
    <Button
      variant="primary"
      onClick={signIn}
      disabled={loading}
      className="w-full"
    >
      {loading ? "Opening Google…" : "Start with Google"}
    </Button>
  );
}
