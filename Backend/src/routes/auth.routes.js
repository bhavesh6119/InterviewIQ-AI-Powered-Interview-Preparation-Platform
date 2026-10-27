const express = require ("express");
const authRouter = express.Router();

const authController = require ("../controllers/auth.controller");
const authMiddleware = require("../middleware/auth.middleware");

/**
 * @route POST /api/auth/register
 * @description register a user
 * @access Public
 */
authRouter.post("/register",authController.registerUserController)

/**
 * @route POST /api/auth/login
 * @description login a user with email and password
 * @access Public
 */
authRouter.post("/login",authController.loginUserController)

/**
 * @route GET /api/auth/logout
 * @description clear token from cookie and add token in blacklist
 * @access Public
 */
authRouter.get("/logout", authController.logoutUserController);

/**
 * @route GET /api/auth/get-me
 * @description get the current user logged in details
 * @access Private
 */
authRouter.get("/get-me",authMiddleware.authUser,authController.getmeController);

module.exports = authRouter;