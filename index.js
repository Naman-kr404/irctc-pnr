const express = require("express");
const multer = require("multer");
const fs = require("fs");
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
    res.send("Gemini API Running");
});

// -----------------------------------
// Captcha route
// -----------------------------------
app.post(
    "/solve-captcha",
    upload.single("image"),
    async (req, res) => {

        try {

            console.log("POST request received");

            // Validate upload
            if (!req.file) {
                return res.status(400).json({
                    error: "No image uploaded"
                });
            }

            console.log("Uploaded file:", req.file.path);

            // Read image
            const imageBuffer = fs.readFileSync(req.file.path);

            // Base64 encode
            const base64Image = imageBuffer.toString("base64");

            console.log("Sending to Gemini");

            // Gemini model
            const model = genAI.getGenerativeModel({
                model: "gemini-1.5-flash"
            });

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
                    Solve this arithmetic captcha.

                    Return ONLY the final numerical answer.
                    `
                }
            ]);

            const text = result.response.text();

            console.log("Gemini response:", text);

            // Cleanup
            fs.unlinkSync(req.file.path);

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