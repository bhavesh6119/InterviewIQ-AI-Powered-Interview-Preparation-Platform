
const pdfParse = require("pdf-parse");
const generateInterviewReport = require("../services/ai.service");
const { generateResumePdf } = require("../services/ai.service");
const interviewReportModel = require("../models/interviewReport.model");

/**
 * @description Controller to generate interview report based on the user self-description, resume and job-description
 */
async function generateInterviewReportController(req,res){
    
    const resumeContent = await (new pdfParse.PDFParse(Uint8Array.from(req.file.buffer))).getText()

    const {selfDescription, jobDescription} = req.body

    const interviewReportByAI = await generateInterviewReport({
        resume : resumeContent.text,
        selfDescription,
        jobDescription
    })

    const interviewReport = await interviewReportModel.create({
        user : req.user.id,
        resume : resumeContent.text,
        selfDescription,
        jobDescription,
        ...interviewReportByAI
    })

    res.status(201).json({
        message : "Interview report generated successfully",
        interviewReport
    })
}

/**
 * @description Controller to get interview report by interviewId
 */
async function getInterviewReportByIdController(req,res){

    const { interviewId } = req.params

    const interviewReport = await interviewReportModel.findOne({
        _id : interviewId,
        user : req.user.id
    })

    if(!interviewReport){
        return res.status(404).json({
            message : "Interview report not found"
        })
    }

    return res.status(200).json({
        message : "Interview report fetched successfully",
        interviewReport
    })
}

/**
 * @description Controller to get all the interview reports of logged in user
 */
async function getAllInterviewReportsController(req,res){
    const interviewReports = await interviewReportModel.find({
        user : req.user.id
    }).sort({createdAt:-1}).select("-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan")

    res.status(200).json({
        message: "Interview reports fetched successfully.",
        interviewReports
    })
}


/**
 * @description Controller to download the generated PDF resume for the selected interview report
 */
// async function downloadResumeController(req,res){
//     const { interviewId } = req.params;

//     const interviewReport = await interviewReportModel.findOne({
//         _id: interviewId,
//         user: req.user.id
//     });

//     if(!interviewReport){
//         return res.status(404).json({
//             message: "Interview report not found"
//         });
//     }

//     try {
//         const { pdfBuffer, fileName } = await generateResumePdf({
//             resume: interviewReport.resume || "",
//             selfDescription: interviewReport.selfDescription || "",
//             jobDescription: interviewReport.jobDescription || "",
//             fileName: `${(interviewReport.title || "candidate-resume").replace(/\s+/g, "-").toLowerCase()}.pdf`
//         });

//         res.setHeader("Content-Type", "application/pdf");
//         res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

//         return res.send(pdfBuffer);
//     } catch (error) {
//         console.error("Resume PDF generation failed:", error);
//         return res.status(500).json({
//             message: error?.message || "Failed to generate resume PDF"
//         });
//     }
// }

async function generateResumePdfController(req, res) {
    try {
        const { interviewReportId } = req.params

        const interviewReport = await interviewReportModel.findById(interviewReportId)

        if (!interviewReport) {
            return res.status(404).json({
                message: "Interview report not found."
            })
        }

        const { resume, jobDescription, selfDescription } = interviewReport

        const { pdfBuffer } = await generateResumePdf({ resume, jobDescription, selfDescription })

        const pdf = Buffer.from(pdfBuffer)

        res.status(200)
        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="resume_${interviewReportId}.pdf"`,
            "Content-Length": pdf.length
        })

        return res.end(pdf)
    } catch (error) {
        console.error("Resume PDF generation failed:", error)
        return res.status(500).json({
            message: error.message || "Failed to generate resume PDF."
        })
    }
}

module.exports = { generateInterviewReportController, getInterviewReportByIdController, getAllInterviewReportsController, generateResumePdfController };