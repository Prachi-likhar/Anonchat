const express = require('express');
const asyncHandler = require('../../utils/asyncHandler');
const { authenticate } = require('../../middleware/auth');
const { reportsLimiter } = require('../../middleware/rateLimiters');
const validate = require('../../middleware/validate');
const reportsController = require('./reports.controller');
const { createReportSchema } = require('./reports.schemas');

const router = express.Router();

router.use(authenticate);
router.post(
  '/',
  reportsLimiter,
  validate(createReportSchema),
  asyncHandler(reportsController.createReport),
);

module.exports = router;
