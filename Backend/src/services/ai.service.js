const { GoogleGenAI } = require("@google/genai");
const puppeteer = require("puppeteer");

const googleApiKey = process.env.GOOGLE_GENAI_API_KEY;

if (!googleApiKey) {
    console.warn('WARNING: GOOGLE_GENAI_API_KEY is not set. Gemini AI features will fail until the environment variable is configured.');
}

const ai = new GoogleGenAI({
    apiKey: googleApiKey
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


/**
 * @description Function to generate content using Gemini API with retry mechanism for temporary server errors.
 */
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


/* ------------------------------------------------------------------ */
/* RESUME GENERATION                                                   */
/* ------------------------------------------------------------------ */

/**
 * Backward compatible: all original keys are kept. New OPTIONAL keys:
 *  - contactDetails: ["email", "phone", "city", "linkedin url", ...]
 *  - skillGroups:    [{ category, items[] }]   (replaces pill badges)
 *  - projects[].techStack / projects[].bullets (description is still accepted)
 */
const resumeJsonSchema = {
    type: "object",
    properties: {
        fullName: { type: "string" },
        targetRole: { type: "string" },
        contactDetails: {
            type: "array",
            items: { type: "string" }
        },
        professionalSummary: { type: "string" },
        keySkills: {
            type: "array",
            items: { type: "string" }
        },
        skillGroups: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    category: { type: "string" },
                    items: { type: "array", items: { type: "string" } }
                },
                required: ["category", "items"],
                additionalProperties: false
            }
        },
        experience: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    role: { type: "string" },
                    company: { type: "string" },
                    duration: { type: "string" },
                    highlights: {
                        type: "array",
                        items: { type: "string" }
                    }
                },
                required: ["role", "company", "duration", "highlights"],
                additionalProperties: false
            }
        },
        education: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    degree: { type: "string" },
                    institution: { type: "string" },
                    year: { type: "string" }
                },
                required: ["degree", "institution", "year"],
                additionalProperties: false
            }
        },
        projects: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    name: { type: "string" },
                    techStack: { type: "string" },
                    bullets: { type: "array", items: { type: "string" } },
                    description: { type: "string" }
                },
                required: ["name", "bullets"],
                additionalProperties: false
            }
        }
    },
    required: ["fullName", "targetRole", "professionalSummary", "keySkills", "skillGroups"],
    additionalProperties: false
};

async function generateResumeProfile({
    resume,
    selfDescription,
    jobDescription
}) {
    // Layout/pagination is handled entirely by CSS in buildResumeHtml.
    // The model is only asked for content, so it can't fight the layout.
    const prompt = `
    You are an expert resume writer and technical recruiter writing an ATS-friendly resume
    for a fresher / entry-level software candidate.

    Produce the CONTENT of the resume as JSON. Do not worry about page layout; that is handled separately.

    TRUTHFULNESS (most important):
    - Use ONLY facts present in the candidate resume and self description below.
    - Never invent companies, job titles, degrees, certifications, technologies, metrics, or achievements.
    - Do not add numbers or percentages unless they appear in the candidate's material.
    - If a section has no real content (e.g. no work experience), return an empty array for it.

    TAILORING:
    - Tailor the summary, skill ordering and project wording to the target job description,
      using the job's keywords only where the candidate genuinely has that skill.

    FIELD RULES:
    - contactDetails: email, phone, city, LinkedIn / GitHub / portfolio URLs exactly as given by the candidate. Omit anything not provided.
    - professionalSummary: 2-3 plain sentences (max ~55 words). No buzzword filler, no first-person pronouns.
    - skillGroups: group the candidate's real skills into categories such as
      "Languages", "Frontend", "Backend", "Databases", "Tools & Platforms", "Core Concepts".
      Use only categories that have items. Max 6 categories.
    - keySkills: the same skills as a flat list (compatibility field).
    - projects: choose the 2-4 projects most relevant to the target role.
      For each: name, techStack (comma separated technologies actually used), and 2-3 bullets.
      Each bullet is ONE concise line (max ~25 words) starting with a strong action verb,
      describing what was built, how, and the result, using only facts from the candidate material.
      Leave "description" empty.
    - experience.highlights: 2-3 concise action-verb bullets per role, same rules as above.
    - education: degree, institution, year exactly as in the candidate material.
    - Exclude any project named "DSA Practice Repository" or any pure DSA / coding-practice repository.
    - Omit projects that are irrelevant to the target role rather than padding.

    QUALITY BAR (write like a professional resume writer, not a chatbot):
    - Every bullet follows: strong action verb + what was built/done + technology used + outcome/purpose.
      Good: "Built a REST API with Node.js and Express to store interview reports in MongoDB"
      Bad: "Responsible for working on backend things"
    - Never start bullets with "Responsible for", "Worked on", "Helped with" or "Assisted in".
    - Do not repeat the same verb more than twice, and do not repeat the same fact in two places.
    - Put the skills most relevant to the target job first in each category and first among categories.
    - Mention each technology only where the candidate genuinely used it. Do not pad skills.
    - Plain text only: no markdown, no emojis, no bullet characters inside strings.
    - If the candidate has little experience, let projects and skills carry the resume. Do not stretch it.

    Return only JSON matching the schema.

    CANDIDATE RESUME:
    ${resume || "No resume text available."}

    SELF DESCRIPTION:
    ${selfDescription || "Not provided."}

    TARGET JOB DESCRIPTION:
    ${jobDescription || "Not provided."}
    `;

    const response = await generateWithRetry(() => ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: resumeJsonSchema,
            temperature: 0.4,
            maxOutputTokens: 8000
        }
    }));

    let parsed;
    try {
        parsed = JSON.parse(response.text);
    } catch (err) {
        throw new Error('Gemini returned an invalid resume JSON response.');
    }

    return sanitizeResumeProfile(parsed);
}

const escapeHtml = (value) =>
    String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

const toArray = (v) => (Array.isArray(v) ? v : []);
const cleanList = (v) => toArray(v).map((x) => String(x ?? "").trim()).filter(Boolean);

// Only drops DSA / coding-practice repos. (The old filter dropped any project that
// merely contained the word "repository" or "algorithm practice".)
const isPracticeProject = (project) => {
    const name = String(project?.name || "").toLowerCase();
    const text = `${name} ${String(project?.description || "").toLowerCase()}`;
    return (
        /\b(dsa|leetcode|hackerrank|codechef|geeksforgeeks)\b/.test(name) ||
        /practice (repository|repo)/.test(text) ||
        /data structures?( and|\s*&)? algorithms? (practice|repository)/.test(text)
    );
};

// Accepts `bullets`, or falls back to splitting a legacy `description` paragraph.
const projectBullets = (project) => {
    const bullets = cleanList(project?.bullets);
    if (bullets.length) return bullets;
    return String(project?.description || "")
        .split(/(?<=[.!?])\s+|\n+|•/)
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 3);
};

const cleanBullet = (value) => {
    let t = String(value ?? "")
        .replace(/^[\s\-\u2013\u2014\u2022*\u00b7\u25aa\u25ba]+/, "")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/[.;,]+$/, "");
    return t ? t.charAt(0).toUpperCase() + t.slice(1) : "";
};

const dedupe = (list) => {
    const seen = new Set();
    return list.filter((x) => {
        const k = x.toLowerCase();
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
    });
};

const trimToSentence = (text, max) => {
    const t = String(text ?? "").replace(/\s+/g, " ").trim();
    if (t.length <= max) return t;
    const cut = t.slice(0, max);
    const end = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("."));
    return end > 40 ? cut.slice(0, end + 1) : cut.replace(/\s+\S*$/, "") + ".";
};

/**
 * Deterministic clean-up of the model output so a weak generation can't produce a weak resume:
 * trims and de-duplicates, strips stray bullet characters, caps list sizes, removes practice
 * projects and empty entries, and keeps keySkills in sync with skillGroups.
 */
function sanitizeResumeProfile(profile) {
    const p = profile && typeof profile === "object" ? profile : {};

    const seenSkills = new Set();
    const skillGroups = toArray(p.skillGroups)
        .map((g) => ({
            category: String(g?.category || "").trim(),
            items: dedupe(cleanList(g?.items)).filter((item) => {
                const k = item.toLowerCase();
                if (seenSkills.has(k)) return false;
                seenSkills.add(k);
                return true;
            }).slice(0, 14)
        }))
        .filter((g) => g.items.length)
        .slice(0, 6);

    const keySkills = skillGroups.length
        ? skillGroups.flatMap((g) => g.items)
        : dedupe(cleanList(p.keySkills));

    const experience = toArray(p.experience)
        .map((x) => ({
            role: String(x?.role || "").trim(),
            company: String(x?.company || "").trim(),
            duration: String(x?.duration || "").trim(),
            highlights: dedupe(cleanList(x?.highlights).map(cleanBullet).filter(Boolean)).slice(0, 4)
        }))
        .filter((x) => x.role || x.company);

    const education = toArray(p.education)
        .map((x) => ({
            degree: String(x?.degree || "").trim(),
            institution: String(x?.institution || "").trim(),
            year: String(x?.year || "").trim()
        }))
        .filter((x) => x.degree || x.institution);

    const projects = toArray(p.projects)
        .filter((x) => !isPracticeProject(x))
        .map((x) => ({
            name: String(x?.name || "").trim(),
            techStack: String(x?.techStack || "").trim(),
            bullets: dedupe(projectBullets(x).map(cleanBullet).filter(Boolean)).slice(0, 3),
            description: ""
        }))
        .filter((x) => x.name && x.bullets.length)
        .slice(0, 4);

    return {
        fullName: String(p.fullName || "").trim() || "Candidate Name",
        targetRole: String(p.targetRole || "").trim(),
        contactDetails: dedupe(cleanList(p.contactDetails)).slice(0, 6),
        professionalSummary: trimToSentence(p.professionalSummary, 450),
        keySkills,
        skillGroups,
        experience,
        education,
        projects
    };
}

function buildResumeHtml(resumeProfile) {
    const {
        fullName = "Candidate Name",
        targetRole = "",
        contactDetails = [],
        professionalSummary = "",
        keySkills = [],
        skillGroups = [],
        experience = [],
        education = [],
        projects = []
    } = resumeProfile || {};

    const e = escapeHtml;

    const contact = cleanList(contactDetails);
    const contactHtml = contact.length
        ? `<p class="contact">${contact.map((c) => `<span class="ci">${e(c)}</span>`).join('<span class="sep"> | </span>')}</p>`
        : "";

    // Skills: categorized plain text, comma separated (no badges)
    const groups = toArray(skillGroups)
        .map((g) => ({ category: String(g?.category || "").trim(), items: cleanList(g?.items) }))
        .filter((g) => g.items.length);
    const flatSkills = cleanList(keySkills);

    const skillsHtml = groups.length
        ? groups.map((g) => `<p class="skill-line"><strong>${e(g.category || "Skills")}:</strong> ${g.items.map(e).join(", ")}</p>`).join("")
        : flatSkills.length
            ? `<p class="skill-line"><strong>Technical Skills:</strong> ${flatSkills.map(e).join(", ")}</p>`
            : "";

    const experienceHtml = toArray(experience).map((item) => {
        const points = cleanList(item?.highlights);
        return `
            <article class="entry">
                <div class="entry-head">
                    <h3>${e(item?.role || "Role")}</h3>
                    <span class="date">${e(item?.duration || "")}</span>
                </div>
                <p class="sub">${e(item?.company || "")}</p>
                ${points.length ? `<ul>${points.map((p) => `<li>${e(p)}</li>`).join("")}</ul>` : ""}
            </article>`;
    }).join("");

    const educationHtml = toArray(education).map((item) => `
            <article class="entry">
                <div class="entry-head">
                    <h3>${e(item?.degree || "Degree")}</h3>
                    <span class="date">${e(item?.year || "")}</span>
                </div>
                <p class="sub">${e(item?.institution || "")}</p>
            </article>`).join("");

    const projectsHtml = toArray(projects)
        .filter((p) => !isPracticeProject(p))
        .map((project) => {
            const bullets = projectBullets(project);
            const stack = String(project?.techStack || "").trim();
            return `
            <article class="entry">
                <div class="entry-head">
                    <h3>${e(project?.name || "Project")}</h3>
                </div>
                ${stack ? `<p class="sub"><em>${e(stack)}</em></p>` : ""}
                ${bullets.length ? `<ul>${bullets.map((b) => `<li>${e(b)}</li>`).join("")}</ul>` : ""}
            </article>`;
        }).join("");

    const section = (title, body) =>
        body.trim() ? `<section><h2>${title}</h2>${body}</section>` : "";

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${e(fullName)} - Resume</title>
  <style>
    /* Page size and margins are defined ONLY here (pdf() uses preferCSSPageSize). */
    @page { size: A4; margin: 14mm 16mm; }

    /* Base size is adjusted by generateResumePdf (10pt-10.5pt) to avoid a nearly empty 2nd page */
    :root { --fs: 10.5pt; --gap: 1; }

    * { box-sizing: border-box; }

    html, body {
      margin: 0;
      padding: 0;
      background: #fff;
      color: #1f2933;
      font-family: Calibri, "Segoe UI", Arial, Helvetica, sans-serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    body { font-size: var(--fs); line-height: 1.4; }

    header { margin-bottom: 4mm; }

    h1 {
      margin: 0;
      font-size: 24pt;
      line-height: 1.15;
      font-weight: 700;
      letter-spacing: 0.01em;
      color: #14284b;
    }

    .role { margin: 1mm 0 0; font-size: 12pt; font-weight: 600; color: #3b5b8f; }
    .contact { margin: 1.5mm 0 0; font-size: 9.5pt; color: #3e4c59; }
    .sep { color: #9aa5b1; }
    .ci { white-space: nowrap; }

    section { margin-top: calc(4.5mm * var(--gap)); }

    h2 {
      margin: 0 0 2mm;
      padding-bottom: 1mm;
      font-size: 11pt;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #14284b;
      border-bottom: 0.75pt solid #14284b;
      break-after: avoid;
      page-break-after: avoid;
    }

    h3 { margin: 0; font-size: var(--fs); font-weight: 700; color: #111827; }

    p { margin: 0; }

    /* Only individual entries are kept together; sections flow freely across pages */
    .entry {
      margin-top: calc(2.5mm * var(--gap));
      break-inside: avoid;
      page-break-inside: avoid;
    }
    section > .entry:first-of-type { margin-top: 0; }

    .entry-head {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 8mm;
      break-after: avoid;
      page-break-after: avoid;
    }

    .date { font-size: calc(var(--fs) - 0.5pt); color: #3e4c59; white-space: nowrap; }
    .sub { font-size: calc(var(--fs) - 0.5pt); color: #3e4c59; break-after: avoid; page-break-after: avoid; }

    ul { margin: 1mm 0 0; padding-left: 5mm; }
    li { margin: 0 0 0.8mm; padding-left: 0.5mm; }

    .skill-line { margin-bottom: 1mm; }
    .skill-line strong { color: #14284b; }

    .summary { text-align: left; }
  </style>
</head>
<body>
  <header>
    <h1>${e(fullName)}</h1>
    ${targetRole ? `<p class="role">${e(targetRole)}</p>` : ""}
    ${contactHtml}
  </header>
  <main>
    ${section("Professional Summary", professionalSummary ? `<p class="summary">${e(professionalSummary)}</p>` : "")}
    ${section("Technical Skills", skillsHtml)}
    ${section("Projects", projectsHtml)}
    ${section("Experience", experienceHtml)}
    ${section("Education", educationHtml)}
  </main>
</body>
</html>`;
}

async function generateResumePdf({
    resume,
    selfDescription,
    jobDescription,
    fileName = "candidate-resume.pdf"
}) {
    if (!googleApiKey) {
        throw new Error('GOOGLE_GENAI_API_KEY is not configured. Please add it to your backend .env file before generating the resume PDF.');
    }

    const profile = await generateResumeProfile({ resume, selfDescription, jobDescription });
    const html = buildResumeHtml(profile);

    const browser = await puppeteer.launch({
        headless: "new",
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox"
        ]
    });

    try {
        const page = await browser.newPage();
        await page.emulateMediaType("print");
        // A4 content width (210mm - 2x16mm) so measurements match the printed layout
        await page.setViewport({ width: 673, height: 1000 });
        await page.setContent(html, { waitUntil: "load" });

        // Fit step (font stays within 10-11pt; content is never added or stretched):
        //  - slightly over one page  -> shrink to 10.25 / 10pt so page 2 isn't nearly empty
        //  - clearly short of a page -> grow to 11pt with a little more section spacing
        //  - otherwise               -> 10.5pt, natural flow
        const pageHeightPx = ((297 - 28) / 25.4) * 96;
        const measure = (fs, gap = 1) => page.evaluate((a, b) => {
            const root = document.documentElement;
            root.style.setProperty("--fs", a + "pt");
            root.style.setProperty("--gap", String(b));
            return root.scrollHeight;
        }, fs, gap);

        let choice = { fs: 10.5, gap: 1 };
        const naturalHeight = await measure(10.5, 1);
        if (naturalHeight > pageHeightPx && naturalHeight <= pageHeightPx * 1.12) {
            for (const fs of [10.25, 10]) {
                if ((await measure(fs, 1)) <= pageHeightPx) { choice = { fs, gap: 1 }; break; }
            }
        } else if (naturalHeight < pageHeightPx * 0.85) {
            for (const c of [{ fs: 11, gap: 1.3 }, { fs: 11, gap: 1.15 }, { fs: 11, gap: 1 }, { fs: 10.75, gap: 1 }]) {
                if ((await measure(c.fs, c.gap)) <= pageHeightPx * 0.97) { choice = c; break; }
            }
        }
        await measure(choice.fs, choice.gap);

        const pdfBuffer = await page.pdf({
            format: "A4",
            printBackground: true,
            preferCSSPageSize: true // margins come from @page only (no double margins)
        });

        return {
            fileName,
            html,
            profile,
            pdfBuffer
        };
    } finally {
        await browser.close();
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
module.exports.generateInterviewReport = generateInterviewReport;
module.exports.generateResumeProfile = generateResumeProfile;
module.exports.buildResumeHtml = buildResumeHtml;
module.exports.sanitizeResumeProfile = sanitizeResumeProfile;
module.exports.generateResumePdf = generateResumePdf;