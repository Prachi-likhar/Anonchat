const membersService = require('./members.service');

async function listMembers(req, res) {
  const result = await membersService.listMembers(req.user.id, req.validated.query);
  res.status(200).json(result);
}

module.exports = {
  listMembers,
};

