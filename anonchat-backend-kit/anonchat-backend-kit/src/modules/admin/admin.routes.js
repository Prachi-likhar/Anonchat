const express = require('express');
const asyncHandler = require('../../utils/asyncHandler');
const { authenticate } = require('../../middleware/auth');
const requireAdmin = require('../../middleware/requireAdmin');
const validate = require('../../middleware/validate');
const adminController = require('./admin.controller');
const {
  listUsersSchema,
  userIdSchema,
  suspendUserSchema,
  banUserSchema,
  changeRoleSchema,
  listReportsSchema,
  reportIdSchema,
  updateReportSchema,
  listActivitySchema,
} = require('./admin.schemas');

const router = express.Router();

router.use(authenticate, requireAdmin);

router.get('/stats', asyncHandler(adminController.getStats));
router.get('/users', validate(listUsersSchema), asyncHandler(adminController.listUsers));
router.get('/users/:id', validate(userIdSchema), asyncHandler(adminController.getUserDetail));
router.post(
  '/users/:id/suspend',
  validate(suspendUserSchema),
  asyncHandler(adminController.suspendUser),
);
router.post('/users/:id/ban', validate(banUserSchema), asyncHandler(adminController.banUser));
router.post(
  '/users/:id/reinstate',
  validate(userIdSchema),
  asyncHandler(adminController.reinstateUser),
);
router.post(
  '/users/:id/role',
  validate(changeRoleSchema),
  asyncHandler(adminController.changeUserRole),
);

router.get('/reports', validate(listReportsSchema), asyncHandler(adminController.listReports));
router.get('/reports/:id', validate(reportIdSchema), asyncHandler(adminController.getReportDetail));
router.patch(
  '/reports/:id',
  validate(updateReportSchema),
  asyncHandler(adminController.updateReport),
);

router.get('/activity', validate(listActivitySchema), asyncHandler(adminController.listActivity));
router.get('/online', asyncHandler(adminController.listOnlineUsers));

module.exports = router;
