const adminService = require('./admin.service');

async function getStats(_req, res) {
  const stats = await adminService.getStats();
  res.status(200).json(stats);
}

async function listUsers(req, res) {
  const result = await adminService.listUsers(req.validated.query);
  res.status(200).json(result);
}

async function getUserDetail(req, res) {
  const result = await adminService.getUserDetail(req.validated.params.id);
  res.status(200).json(result);
}

async function suspendUser(req, res) {
  await adminService.suspendUser(req.user.id, req.validated.params.id, req.validated.body);
  res.status(204).send();
}

async function banUser(req, res) {
  await adminService.banUser(req.user.id, req.validated.params.id, req.validated.body);
  res.status(204).send();
}

async function reinstateUser(req, res) {
  await adminService.reinstateUser(req.user.id, req.validated.params.id);
  res.status(204).send();
}

async function changeUserRole(req, res) {
  await adminService.changeUserRole(req.user.id, req.validated.params.id, req.validated.body);
  res.status(204).send();
}

async function listReports(req, res) {
  const result = await adminService.listReports(req.validated.query);
  res.status(200).json(result);
}

async function getReportDetail(req, res) {
  const result = await adminService.getReportDetail(req.validated.params.id);
  res.status(200).json(result);
}

async function updateReport(req, res) {
  const result = await adminService.updateReport(
    req.user.id,
    req.validated.params.id,
    req.validated.body,
  );
  res.status(200).json(result);
}

async function listActivity(req, res) {
  const result = await adminService.listActivity(req.validated.query);
  res.status(200).json(result);
}

async function listOnlineUsers(_req, res) {
  const result = await adminService.listOnlineUsers();
  res.status(200).json(result);
}

module.exports = {
  getStats,
  listUsers,
  getUserDetail,
  suspendUser,
  banUser,
  reinstateUser,
  changeUserRole,
  listReports,
  getReportDetail,
  updateReport,
  listActivity,
  listOnlineUsers,
};
