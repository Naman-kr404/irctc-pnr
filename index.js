const express = require("express");
const multer = require("multer");
const fs = require("fs");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();

// -----------------------------------
// Multer setup
// -----------------------------------
const upload = multer({
    dest: "uploads/"
});

// -----------------------------------
// Gemini setup
// -----------------------------------
const genAI = new GoogleGenerativeAI(
    process.env.GEMINI_API_KEY
);

// -----------------------------------
// Root route
// -----------------------------------
app.get("/", (req, res) => {
    res.send("Gemini Captcha Solver API Running");
});

// -----------------------------------
// Solve captcha route
// -----------------------------------
app.post(
    "/solve-captcha",
    upload.single("image"),
    async (req, res) => {

        try {

            // Check upload
            if (!req.file) {
                return res.status(400).json({
                    error: "No image uploaded"
                });
            }

            console.log("Image received");

            // Read uploaded image
            const imageBuffer = fs.readFileSync(req.file.path);

            // Convert to base64
            const base64Image = imageBuffer.toString("base64");

            // Gemini model
            const model = genAI.getGenerativeModel({
                model: "gemini-1.5-flash"
            });

            console.log("Sending image to Gemini");

            // Gemini request
            const result = await model.generateContent([
                {
                    inlineData: {
                        mimeType: req.file.mimetype,
                        data: base64Image
                    }
                },
                {
                    text: `
                    This image contains a simple arithmetic captcha.

                    Read the arithmetic expression carefully.

                    Return ONLY the final numerical answer.

                    Example:
                    42 + 80 = 122

                    Output:
                    122
                    `
                }
            ]);

            const text = result.response.text();

            console.log("Gemini response:", text);

            // Delete uploaded temp file
            fs.unlinkSync(req.file.path);

            // Return response
            return res.json({
                result: text.trim()
            });

        } catch (err) {

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