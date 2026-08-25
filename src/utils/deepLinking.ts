// Supabase's password-recovery email links redirect to
// atsdecor://auth/reset-password#access_token=...&type=recovery — extract
// the token so SetPassword can use it to authorize the new password.
export function extractRecoveryToken(url: string | null): string | null {
  if (!url || !url.includes('reset-password')) {
    return null;
  }
  const paramString = url.split('#')[1] || url.split('?')[1] || '';
  const match = paramString.match(/access_token=([^&]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export interface VerifiedSessionTokens {
  accessToken: string;
  refreshToken: string;
}

// Supabase's signup-confirmation email links redirect to
// atsdecor://auth/verified#access_token=...&refresh_token=...&type=signup
// on success — extract both tokens so we can establish a session directly
// instead of sending the user back through Login.
export function extractVerifiedSession(
  url: string | null,
): VerifiedSessionTokens | null {
  if (!url || !url.includes('auth/verified')) {
    return null;
  }
  const paramString = url.split('#')[1] || url.split('?')[1] || '';
  const accessMatch = paramString.match(/access_token=([^&]+)/);
  const refreshMatch = paramString.match(/refresh_token=([^&]+)/);
  if (!accessMatch || !refreshMatch) {
    return null;
  }
  return {
    accessToken: decodeURIComponent(accessMatch[1]),
    refreshToken: decodeURIComponent(refreshMatch[1]),
  };
}

// A failed/expired verification link redirects to the same
// atsdecor://auth/verified path but with error params instead of tokens
// (e.g. error_code=otp_expired) — surface the description to the user.
export function extractAuthError(url: string | null): string | null {
  if (!url || !url.includes('auth/verified')) {
    return null;
  }
  const paramString = url.split('#')[1] || url.split('?')[1] || '';
  const match = paramString.match(/error_description=([^&]+)/);
  return match ? decodeURIComponent(match[1].replace(/\+/g, ' ')) : null;
}
