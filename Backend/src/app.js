const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const app = express();

// Trust reverse proxy for secure cookies on Render/Railway/Heroku
app.set("trust proxy", 1);

//require all the routes here
const authRouter = require ("./routes/auth.routes");
const interviewRouter = require("./routes/interview.routes");

// Build allowed origins list
const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:3000"
];

if (process.env.FRONTEND_URL) {
    const urls = process.env.FRONTEND_URL.split(",").map(u => u.trim().replace(/\/$/, ""));
    allowedOrigins.push(...urls);
}

//middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        const normalizedOrigin = origin.replace(/\/$/, "");
        
        // Allow listed origins, any vercel deployment, or non-production mode
        const isAllowed = 
            allowedOrigins.includes(normalizedOrigin) ||
            normalizedOrigin.endsWith(".vercel.app") ||
            process.env.NODE_ENV !== "production";

        if (isAllowed) {
            return callback(null, true);
        }
        return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"]
}));

// Health check endpoint for hosting providers
app.get("/api/health", (req, res) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

//using all the routes here
app.use("/api/auth", authRouter);
app.use("/api/interview", interviewRouter);

module.exports = app;