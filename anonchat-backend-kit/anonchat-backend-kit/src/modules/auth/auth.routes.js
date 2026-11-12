const express = require('express');
const asyncHandler = require('../../utils/asyncHandler');
const validate = require('../../middleware/validate');
const {
  registerLimiter,
  loginLimiter,
  otpCooldownLimiter,
  otpHourlyLimiter,
} = require('../../middleware/rateLimiters');
const authController = require('./auth.controller');
const {
  registerSchema,
  verifyEmailSchema,
  emailOnlySchema,
  loginSchema,
  refreshSchema,
  logoutSchema,
  resetPasswordSchema,
} = require('./auth.schemas');

const router = express.Router();

router.post(
  '/register',
  registerLimiter,
  validate(registerSchema),
  asyncHandler(authController.register),
);
router.post('/verify-email', validate(verifyEmailSchema), asyncHandler(authController.verifyEmail));
router.post(
  '/resend-otp',
  otpCooldownLimiter,
  otpHourlyLimiter,
  validate(emailOnlySchema),
  asyncHandler(authController.resendOtp),
);
router.post('/login', loginLimiter, validate(loginSchema), asyncHandler(authController.login));
router.post('/refresh', validate(refreshSchema), asyncHandler(authController.refresh));
router.post('/logout', validate(logoutSchema), asyncHandler(authController.logout));
router.post(
  '/forgot-password',
  otpCooldownLimiter,
  otpHourlyLimiter,
  validate(emailOnlySchema),
  asyncHandler(authController.forgotPassword),
);
router.post(
  '/reset-password',
  validate(resetPasswordSchema),
  asyncHandler(authController.resetPassword),
);

module.exports = router;

