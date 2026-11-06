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


/**
 * @route GET /api/interview/report/:interviewId
 * @description get interview report by interviewId
 * @access private
 */
interviewRouter.get("/report/:interviewId",authMiddleware.authUser,interviewController.getInterviewReportByIdController)

/**
 * @route GET /api/interview/resume/:interviewId
 * @description download a generated PDF resume for the selected interview report
 * @access private
 */
interviewRouter.get("/resume/:interviewId", authMiddleware.authUser, interviewController.generateResumePdfController)

// /**
//  * @route GET /api/interview/resume/pdf/:interviewId
//  * @description backward-compatible alias for older frontend calls
//  * @access private
//  */
// interviewRouter.get("/resume/pdf/:interviewId", authMiddleware.authUser, interviewController.downloadResumeController)

/**
 * @route GET /api/interview/resume/pdf
 * @description generate resume pdf on the basis of user self description, resume content and job description.
 * @access private
 */
interviewRouter.post("/resume/pdf/:interviewReportId", authMiddleware.authUser, interviewController.generateResumePdfController)

/**
 * @route GET /api/interview/
 * @description get all interview reports of the logged in user
 * @access private
 */
interviewRouter.get("/",authMiddleware.authUser,interviewController.getAllInterviewReportsController)

module.exports = interviewRouter