// Single source of truth for translating auth failures into user-facing
// copy. Raw provider/internal messages (e.g. undici's "fetch failed") must
// never reach the UI; unrecognized strings fall back to a generic message
// so leaks fail closed. The `kind` lets the UI pick the right treatment:
// red for mistakes the user can fix, amber for situations worth retrying.
export type AuthErrorKind =
  | 'credentials'
  | 'email-verification'
  | 'rate-limit'
  | 'transient'
  | 'validation'
  | 'unknown';

export type AuthErrorView = { message: string; kind: AuthErrorKind };

const TRANSIENT_PATTERN =
  /fetch failed|timed?\s*out|timeout|network|enotfound|econnreset|econnrefused|etimedout|socket|temporarily unavailable|unreachable|internal error|failed to fetch/i;

export function describeAuthError(raw?: string | null): AuthErrorView {
  const text = (raw ?? '').trim();
  const lower = text.toLowerCase();
  if (!lower)
    return {
      message: 'Something went wrong. Please try again.',
      kind: 'unknown',
    };
  if (lower.includes('invalid login credentials'))
    return {
      message: "That email and password don't match an account.",
      kind: 'credentials',
    };
  if (lower.includes('email not confirmed'))
    return {
      message:
        'Please confirm your email first — check your inbox for the verification link.',
      kind: 'email-verification',
    };
  if (lower.includes('already registered'))
    return {
      message:
        'An account already exists for this email. Try signing in instead.',
      kind: 'credentials',
    };
  if (
    lower.includes('rate limit') ||
    lower.includes('too many requests') ||
    lower.includes('every 60 seconds')
  )
    return {
      message: 'Too many attempts. Wait a minute, then try again.',
      kind: 'rate-limit',
    };
  // Safe, already-user-friendly validation wording from the auth server.
  if (/^password should be|^password must/i.test(text) || lower.includes('unable to validate email'))
    return { message: text, kind: 'validation' };
  if (TRANSIENT_PATTERN.test(text))
    return {
      message:
        "We couldn't reach the sign-in service just now. Check your connection and try again in a moment.",
      kind: 'transient',
    };
  return {
    message: 'Sign-in is unavailable right now. Please try again shortly.',
    kind: 'unknown',
  };
}
