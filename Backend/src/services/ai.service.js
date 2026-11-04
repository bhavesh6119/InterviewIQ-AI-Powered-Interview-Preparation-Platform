const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY
});

const interviewReportResponseSchema = {
    type: "object",
    properties: {
        title : { type : "string" },
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
    required: ["title","matchScore", "technicalQuestions", "behaviouralQuestions", "skillGaps", "preparationPlan"],
    additionalProperties: false
};


const sleep = (ms) =>
    new Promise(resolve => setTimeout(resolve, ms));

async function generateWithRetry(request, maxRetries = 3) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await request();
        } catch (error) {
            const status = error.status || error.code;

            // Retry only temporary server errors
            if (
                status !== 503 &&
                status !== 500 &&
                status !== 429
            ) {
                throw error;
            }

            if (attempt === maxRetries) {
                throw error;
            }

            const delay = Math.min(
                2000 * Math.pow(2, attempt),
                10000
            );

            console.log(
                `Gemini API failed. Retrying in ${delay / 1000}s...`
            );

            await sleep(delay);
        }
    }
}


async function generateInterviewReport({
    resume,
    selfDescription,
    jobDescription
}) {
    const prompt = `
    You are an expert technical interviewer, senior HR recruiter,
    and career assessment specialist.

    Analyze the candidate's resume, self-description, and job
    description carefully.

    Generate a detailed, personalized interview assessment.

    REQUIREMENTS:

    1. Technical Questions:
       - Generate 15 questions.
       - Include easy, medium, and hard questions.
       - Cover fundamentals, technologies, projects, and
         job-specific concepts.
       - Each question must include question, intention, answer.
       - Answers must contain detailed explanations and examples.

    2. Behavioural Questions:
       - Generate 8 questions.
       - Cover teamwork, conflict resolution, problem-solving,
         failures, leadership, and adaptability.
       - Use STAR methodology where appropriate.
       - Each question must include question, intention, answer.

    3. Skill Gaps:
       - Generate 6 relevant skill gaps.
       - Identify missing skills based on the job description.
       - Each object must include skill and severity.
       - Severity must be High, Medium, or Low.

    4. Preparation Plan:
       - Generate a 10-day preparation plan.
       - Each day must include day, focus, and tasks.
       - Include 3-5 practical tasks per day.
       - Address the identified skill gaps.

    5. Match Score:
       - Generate a realistic score between 0 and 100.
       - Evaluate technical skills, experience, projects,
         and job requirements.

    IMPORTANT:
    - Personalize all content using the candidate information.
    - Never invent candidate experience or achievements.
    - Avoid generic and repetitive questions.
    - Provide detailed answers, not one-line responses.
    - Do not leave arrays empty.
    - Return valid JSON matching the provided schema.
    - Do not include Markdown or additional text.

    CANDIDATE RESUME:
    ${resume}

    SELF DESCRIPTION:
    ${selfDescription}

    JOB DESCRIPTION:
    ${jobDescription}
    `;

    const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: interviewReportResponseSchema,
            temperature: 0.7,
            maxOutputTokens: 12000
        }
    });

    return JSON.parse(response.text);
}

module.exports = generateInterviewReport;