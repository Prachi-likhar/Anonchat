const { env } = require('../../config/env');
const authService = require('./auth.service');

const REFRESH_COOKIE_NAME = 'refresh_token';

function isMobileClient(req) {
  return String(req.get('x-client') || '').toLowerCase() === 'mobile';
}

function setRefreshCookie(res, refreshToken) {
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: 'lax',
    path: '/api/auth',
    maxAge: env.REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000,
  });
}

function clearRefreshCookie(res) {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: 'lax',
    path: '/api/auth',
  });
}

function extractRefreshToken(req) {
  if (isMobileClient(req)) {
    return req.body?.refreshToken || null;
  }
  return req.cookies?.[REFRESH_COOKIE_NAME] || req.body?.refreshToken || null;
}

async function register(req, res) {
  const result = await authService.register(req.validated.body);
  res.status(201).json(result);
}

async function verifyEmail(req, res) {
  const result = await authService.verifyEmail({
    ...req.validated.body,
    userAgent: req.get('user-agent') || null,
  });

  if (isMobileClient(req)) {
    return res.status(200).json({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: result.user,
    });
  }

  setRefreshCookie(res, result.refreshToken);
  return res.status(200).json({
    accessToken: result.accessToken,
    user: result.user,
  });
}

async function resendOtp(req, res) {
  const result = await authService.resendOtp(req.validated.body);
  res.status(200).json(result);
}

async function login(req, res) {
  const result = await authService.login({
    ...req.validated.body,
    userAgent: req.get('user-agent') || null,
  });

  if (isMobileClient(req)) {
    return res.status(200).json({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: result.user,
    });
  }

  setRefreshCookie(res, result.refreshToken);
  return res.status(200).json({
    accessToken: result.accessToken,
    user: result.user,
  });
}

async function refresh(req, res) {
  const rawToken = extractRefreshToken(req);
  const result = await authService.refresh({
    rawToken,
    userAgent: req.get('user-agent') || null,
  });

  if (isMobileClient(req)) {
    return res.status(200).json({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  }

  setRefreshCookie(res, result.refreshToken);
  return res.status(200).json({
    accessToken: result.accessToken,
  });
}

async function logout(req, res) {
  const rawToken = extractRefreshToken(req);
  await authService.logout({ rawToken });
  clearRefreshCookie(res);
  res.status(204).send();
}

async function forgotPassword(req, res) {
  const result = await authService.forgotPassword(req.validated.body);
  res.status(200).json(result);
}

async function resetPassword(req, res) {
  const result = await authService.resetPassword(req.validated.body);
  res.status(200).json(result);
}

module.exports = {
  REFRESH_COOKIE_NAME,
  clearRefreshCookie,
  register,
  verifyEmail,
  resendOtp,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
};

