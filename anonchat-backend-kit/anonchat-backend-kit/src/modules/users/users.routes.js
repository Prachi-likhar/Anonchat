const express = require('express');
const asyncHandler = require('../../utils/asyncHandler');
const { authenticate } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const usersController = require('./users.controller');
const { updateMeSchema, changePasswordSchema, deleteMeSchema } = require('./users.schemas');

const router = express.Router();

router.use(authenticate);

router.get('/', asyncHandler(usersController.getMe));
router.patch('/', validate(updateMeSchema), asyncHandler(usersController.updateMe));
router.post(
  '/change-password',
  validate(changePasswordSchema),
  asyncHandler(usersController.changePassword),
);
router.delete('/', validate(deleteMeSchema), asyncHandler(usersController.deleteMe));

module.exports = router;

