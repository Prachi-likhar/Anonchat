const usersService = require('./users.service');
const { REFRESH_COOKIE_NAME, clearRefreshCookie } = require('../auth/auth.controller');

async function getMe(req, res) {
  const me = await usersService.getMe(req.user.id);
  res.status(200).json(me);
}

async function updateMe(req, res) {
  const me = await usersService.updateMe(req.user.id, req.validated.body);
  res.status(200).json(me);
}

async function changePassword(req, res) {
  const currentRefreshToken =
    req.cookies?.[REFRESH_COOKIE_NAME] || req.get('x-refresh-token') || null;
  await usersService.changePassword(req.user.id, {
    ...req.validated.body,
    currentRefreshToken,
  });
  res.status(204).send();
}

async function deleteMe(req, res) {
  await usersService.deleteMe(req.user.id, req.validated.body);
  clearRefreshCookie(res);
  res.status(204).send();
}

module.exports = {
  getMe,
  updateMe,
  changePassword,
  deleteMe,
};

