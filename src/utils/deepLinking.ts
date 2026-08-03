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
