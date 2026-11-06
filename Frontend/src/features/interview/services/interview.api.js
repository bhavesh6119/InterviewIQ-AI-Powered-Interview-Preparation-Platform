import axios from "axios";

const api = axios.create({
    baseURL : "http://localhost:3000",
    withCredentials : true
})

/**
 * @description generate a new interview report on the basis of users self description, job description and resume pdf.
 */
export const generateInterviewReport = async ({jobDescription, selfDescription, resumeFile})=> { 

    const formData = new FormData()
    formData.append("jobDescription",jobDescription)
    formData.append("selfDescription",selfDescription)
    formData.append("resume",resumeFile)

    const response = await api.post("/api/interview/",formData,{
        headers : {
            "Content-Type" : "multipart/form-data"
        }
    })

    return response.data

}

/**
 * @description get interview report by interviewId
 */
export const getInterviewReportById = async (interviewId) =>{
    
    const response = await api.get (`/api/interview/report/${interviewId}`)

    return response.data
}

/**
 * @description get all interview reports of logged in user
 */
export const getAllInterviewReports = async () =>{

    const response = await api.get("/api/interview/")

    return response.data
}

// /**
//  * @description download a generated PDF resume for the selected interview report
//  */
// export const downloadInterviewResume = async (interviewId) => {
//     const endpoints = [
//         `/api/interview/resume/${interviewId}`,
//         `/api/interview/resume/pdf/${interviewId}`
//     ]

//     let lastError = null

//     for (const endpoint of endpoints) {
//         try {
//             const response = await api.get(endpoint, {
//                 responseType: 'blob',
//                 validateStatus: (status) => status >= 200 && status < 500
//             })

//             if (response.status === 200 && response.data) {
//                 return response.data
//             }

//             lastError = new Error(`Resume request failed with status ${response.status}`)
//         } catch (error) {
//             lastError = error
//         }
//     }

//     throw lastError || new Error('Failed to download resume.')
// }

/**
 * @description Service to generate resume pdf based on user self description, resume content and job description.
 */
export const generateResumePdf = async ({ interviewReportId }) => {
    const response = await api.post(`/api/interview/resume/pdf/${interviewReportId}`, null, {
        responseType: "blob"
    })

    return response.data
}