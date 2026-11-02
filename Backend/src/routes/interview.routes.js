const express = require("express")
const authMiddleware = require("../middleware/auth.middleware");
const interviewController = require("../controllers/interview.controller");
const upload = require("../middleware/file.middleware");


const interviewRouter = express.Router()

/**
 * @route POST /api/interview
 * @description generate a new interview report on the basis of users self description, job description and resume pdf.
 * @access private
 */
interviewRouter.post("/", authMiddleware.authUser, upload.single("resume"), interviewController.generateInterviewReportController)

module.exports = interviewRouter