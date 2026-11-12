const blocksService = require('./blocks.service');

async function blockMember(req, res) {
  await blocksService.blockMember(req.user.id, req.validated.body.memberId);
  res.status(204).send();
}

async function unblockMember(req, res) {
  await blocksService.unblockMember(req.user.id, req.validated.params.memberId);
  res.status(204).send();
}

async function listBlockedMembers(req, res) {
  const result = await blocksService.listBlockedMembers(req.user.id);
  res.status(200).json(result);
}

module.exports = {
  blockMember,
  unblockMember,
  listBlockedMembers,
};

