export interface PasswordRecoveryParams {
  isRecovery: boolean;
  isExpired: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  code: string | null;
  error: string | null;
  errorCode: string | null;
  errorDescription: string | null;
}

function paramsFromHash(hash: string) {
  const trimmedHash = hash.replace(/^#/, '');
  const queryStart = trimmedHash.indexOf('?');
  const rawParams = queryStart >= 0 ? trimmedHash.slice(queryStart + 1) : trimmedHash.replace(/^\/+/, '');

  return new URLSearchParams(rawParams);
}

export function getPasswordRecoveryParams(): PasswordRecoveryParams {
  const search = new URLSearchParams(window.location.search);
  const hash = paramsFromHash(window.location.hash);

  const type = search.get('type') || hash.get('type');
  const accessToken = search.get('access_token') || hash.get('access_token');
  const refreshToken = search.get('refresh_token') || hash.get('refresh_token');
  const code = search.get('code') || hash.get('code');
  const error = search.get('error') || hash.get('error');
  const errorCode = search.get('error_code') || hash.get('error_code');
  const errorDescription = search.get('error_description') || hash.get('error_description');
  const isExpired =
    errorCode === 'otp_expired' ||
    errorDescription?.toLowerCase().includes('email link is invalid or has expired') === true;

  return {
    isRecovery: type === 'recovery' || Boolean(accessToken && refreshToken) || Boolean(code) || isExpired,
    isExpired,
    accessToken,
    refreshToken,
    code,
    error,
    errorCode,
    errorDescription,
  };
}

export function isPasswordRecoveryUrl() {
  return getPasswordRecoveryParams().isRecovery;
}
