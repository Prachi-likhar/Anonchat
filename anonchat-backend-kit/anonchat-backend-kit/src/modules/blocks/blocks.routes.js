const express = require('express');
const asyncHandler = require('../../utils/asyncHandler');
const { authenticate } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const blocksController = require('./blocks.controller');
const { blockMemberSchema, unblockMemberSchema } = require('./blocks.schemas');

const router = express.Router();

router.use(authenticate);
router.get('/', asyncHandler(blocksController.listBlockedMembers));
router.post('/', validate(blockMemberSchema), asyncHandler(blocksController.blockMember));
router.delete(
  '/:memberId',
  validate(unblockMemberSchema),
  asyncHandler(blocksController.unblockMember),
);

module.exports = router;
