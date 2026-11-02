
const pdfParse = require("pdf-parse");
const generateInterviewReport = require("../services/ai.service");
const interviewReportModel = require("../models/interviewReport.model");


async function generateInterviewReportController(req,res){
    
    const resumeContent = await (new pdfParse.PDFParse(Uint8Array.from(req.file.buffer))).getText()

    const {selfDescription, jobDescription} = req.body

    const interviewReportByAI = await generateInterviewReport({
        resume : resumeContent.text,
        selfDescription,
        jobDescription
    })

    const normalizedReport = {
        ...interviewReportByAI,
        skillGaps: interviewReportByAI.skillGaps || interviewReportByAI.skillGap || [],
        skillGap: interviewReportByAI.skillGap || interviewReportByAI.skillGaps || []
    };

    const interviewReport = await interviewReportModel.create({
        user : req.user.id,
        resume : resumeContent.text,
        selfDescription,
        jobDescription,
        ...normalizedReport
    })

    res.status(201).json({
        message : "Interview report generated successfully",
        interviewReport
    })
}


module.exports = { generateInterviewReportController };