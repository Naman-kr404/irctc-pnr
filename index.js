const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();

// -----------------------------------
// Multer
// -----------------------------------
const upload = multer({
    dest: "uploads/"
});

// -----------------------------------
// Gemini
// -----------------------------------
const genAI = new GoogleGenerativeAI(
    process.env.GEMINI_API_KEY
);

// -----------------------------------
// Root route
// -----------------------------------
app.get("/", (req, res) => {
    res.send("Gemini Captcha Solver Running");
});

// -----------------------------------
// Solve captcha
// -----------------------------------
app.post(
    "/solve-captcha",
    upload.single("image"),
    async (req, res) => {

        try {

            console.log("Request received");

            // Validate file
            if (!req.file) {
                return res.status(400).json({
                    error: "No image uploaded"
                });
            }

            console.log("File:", req.file.originalname);

            // Read uploaded file
            const imageBuffer = fs.readFileSync(req.file.path);

            // Convert to base64
            const base64Image = imageBuffer.toString("base64");

            console.log("Sending to Gemini");

            // Gemini model
            const model = genAI.getGenerativeModel({
                model: "gemini-1.5-flash"
            });

            // Generate response
            const result = await model.generateContent([
                {
                    inlineData: {
                        mimeType: req.file.mimetype || "image/png",
                        data: base64Image
                    }
                },
                {
                    text: `
                    Solve this arithmetic captcha.

                    Return ONLY the final number.

                    Example:
                    22 + 10 = 32

                    Output:
                    32
                    `
                }
            ]);

            // Extract text
            const text = result.response.text();

            console.log("Gemini Output:", text);

            // Delete temp file
            fs.unlinkSync(req.file.path);

            // Send JSON response
            return res.json({
                result: text.trim()
            });

        } catch (err) {

            console.error("FULL ERROR:");
            console.error(err);

            return res.status(500).json({
                error: err.message
            });
        }
    }
);

// -----------------------------------
// Start server
// -----------------------------------
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});