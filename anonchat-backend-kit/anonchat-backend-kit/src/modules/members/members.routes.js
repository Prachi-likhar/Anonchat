const express = require('express');
const asyncHandler = require('../../utils/asyncHandler');
const { authenticate } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const membersController = require('./members.controller');
const { listMembersSchema } = require('./members.schemas');

const router = express.Router();

router.use(authenticate);
router.get('/', validate(listMembersSchema), asyncHandler(membersController.listMembers));

module.exports = router;
