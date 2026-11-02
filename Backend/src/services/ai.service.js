const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY
});

const interviewReportResponseSchema = {
    type: "object",
    properties: {
        matchScore: {
            type: "number",
            minimum: 0,
            maximum: 100
        },
        technicalQuestions: {
            type: "array",
            minItems: 3,
            items: {
                type: "object",
                properties: {
                    question: { type: "string" },
                    intention: { type: "string" },
                    answer: { type: "string" }
                },
                required: ["question", "intention", "answer"],
                additionalProperties: false
            }
        },
        behaviouralQuestions: {
            type: "array",
            minItems: 2,
            items: {
                type: "object",
                properties: {
                    question: { type: "string" },
                    intention: { type: "string" },
                    answer: { type: "string" }
                },
                required: ["question", "intention", "answer"],
                additionalProperties: false
            }
        },
        skillGaps: {
            type: "array",
            minItems: 1,
            items: {
                type: "object",
                properties: {
                    skill: { type: "string" },
                    severity: { type: "string", enum: ["low", "medium", "high"] }
                },
                required: ["skill", "severity"],
                additionalProperties: false
            }
        },
        preparationPlan: {
            type: "array",
            minItems: 3,
            items: {
                type: "object",
                properties: {
                    day: { type: "integer", minimum: 1 },
                    focus: { type: "string" },
                    tasks: {
                        type: "array",
                        minItems: 2,
                        items: { type: "string" }
                    }
                },
                required: ["day", "focus", "tasks"],
                additionalProperties: false
            }
        }
    },
    required: ["matchScore", "technicalQuestions", "behaviouralQuestions", "skillGaps", "preparationPlan"],
    additionalProperties: false
};

async function generateInterviewReport({ resume, selfDescription, jobDescription }){

    const prompt = `Generate a complete interview assessment in valid JSON only.

Requirements:
- Return a JSON object with exactly these fields: matchScore, technicalQuestions, behaviouralQuestions, skillGaps, preparationPlan.
- Do not leave arrays empty.
- Generate realistic interview content relevant to the candidate and job role.
- technicalQuestions: include at least 3 or more questions appropriate to the role and candidate profile.
- behaviouralQuestions: include at least 2 or more situational or experience-based questions.
- skillGaps: include at least 2 or more concrete skill gaps when relevant; if the candidate appears strong in a skill, still include meaningful but smaller gaps where appropriate.
- preparationPlan: include at least 3 or more daily plan items with a clear focus and practical tasks.
- Each question object must include: question, intention, answer.
- Each skill gap object must include: skill, severity.
- Each plan item must include: day, focus, tasks.
- Tailor the questions and gaps to the actual resume, self-description, and job description rather than using a fixed template.

Candidate data:
Resume:
${resume}

Self Description:
${selfDescription}

Job Description:
${jobDescription}
`;

    const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: interviewReportResponseSchema,
            temperature: 0.7
        }
    });

    return JSON.parse(response.text);
}

module.exports = generateInterviewReport;