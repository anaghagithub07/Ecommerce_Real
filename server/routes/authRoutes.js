import express from "express";
import {
  register,
  login,
  logout,
  forgotPassword,
  getResetPasswordPage, // Added this missing import
  resetPassword,
} from "../controllers/authController.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);

router.post("/forgot-password", forgotPassword);

// GET request to show the EJS form
router.get("/reset-password/:id/:token", getResetPasswordPage);

// POST request to handle the form submission
router.post("/reset-password/:id/:token", resetPassword);

export default router;