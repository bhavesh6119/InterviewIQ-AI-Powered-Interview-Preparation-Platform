import { useContext, useEffect } from 'react'
import { InterviewContext } from '../interview.context'
import {
  getAllInterviewReports,
  getInterviewReportById,
  generateInterviewReport,
  generateResumePdf
} from '../services/interview.api'
import { useParams } from "react-router"

export const useInterview = () => {
  const context = useContext(InterviewContext)
  const { interviewId } = useParams()

  if (!context) {
    throw new Error('useInterview must be used with an InterviewProvider')
  }

  const { loading, setLoading, report, setReport, reports, setReports } = context

  const generateReport = async ({ jobDescription, selfDescription, resumeFile }) => {
    setLoading(true)
    let response = null

    try {
      response = await generateInterviewReport({ jobDescription, selfDescription, resumeFile })

      if (!response || !response.interviewReport) {
        setReport(null)
        return null
      }

      setReport(response.interviewReport)
      return response.interviewReport
    } catch (error) {
      console.log(error)
      setReport(null)
      return null
    } finally {
      setLoading(false)
    }
  }

  const getReportById = async (interviewId) => {
    setLoading(true)
    let response = null

    try {
      response = await getInterviewReportById(interviewId)

      if (!response || !response.interviewReport) {
        setReport(null)
        return null
      }

      setReport(response.interviewReport)
      return response.interviewReport
    } catch (error) {
      console.log(error)
      setReport(null)
      return null
    } finally {
      setLoading(false)
    }
  }

  const getReports = async () => {
    setLoading(true)
    let response = null

    try {
      response = await getAllInterviewReports()

      const nextReports = Array.isArray(response?.interviewReports)
        ? response.interviewReports
        : []

      setReports(nextReports)
      return nextReports
    } catch (error) {
      console.log(error)
      setReports([])
      return []
    } finally {
      setLoading(false)
    }
  }

   const getResumePdf = async (interviewReportId) => {
        setLoading(true)
        let response = null
        try {
            response = await generateResumePdf({ interviewReportId })
            const url = window.URL.createObjectURL(new Blob([ response ], { type: "application/pdf" }))
            const link = document.createElement("a")
            link.href = url
            link.setAttribute("download", `resume_${interviewReportId}.pdf`)
            document.body.appendChild(link)
            link.click()
        }
        catch (error) {
            console.log(error)
        } finally {
            setLoading(false)
        }
   }

    useEffect(() => {
        if (interviewId) {
        getReportById(interviewId)
        } else {
        getReports()
        }
    }, [ interviewId ])

  return { loading, setLoading, report, setReport, reports, setReports, generateReport, getReportById, getReports, getResumePdf }
}