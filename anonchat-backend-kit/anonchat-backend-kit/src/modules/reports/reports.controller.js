const reportsService = require('./reports.service');

async function createReport(req, res) {
  const result = await reportsService.createReport(req.user.id, req.validated.body);
  res.status(201).json(result);
}

module.exports = {
  createReport,
};
