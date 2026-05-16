const express = require("express");
const multer = require("multer");
require("dotenv").config();
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
// const genAI = new GoogleGenerativeAI(
//     "AIzaSyCst6HlH_EW0A5ehSOfwNTq5yPL7Yf8DHg"
// );
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
// Solve captcha route
// -----------------------------------
app.post("/solve-captcha", upload.any(), async (req, res) => {

    try {

        console.log("Request received");

        // Validate uploaded files
        if (!req.files || req.files.length === 0) {

            return res.status(400).json({
                error: "No image uploaded"
            });
        }

        // First uploaded file
        const file = req.files[0];

        console.log("Uploaded File:", file.originalname);

        // Read image
        const imageBuffer = fs.readFileSync(file.path);

        // Convert image to base64
        const base64Image = imageBuffer.toString("base64");

        console.log("Sending image to Gemini");

        // Gemini model
        const model = genAI.getGenerativeModel({
            model: "models/gemini-2.5-flash"
        });

        // Send image to Gemini
        const result = await model.generateContent([
            {
                inlineData: {
                    mimeType: file.mimetype || "image/png",
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

        // Extract Gemini response
        const response = await result.response;

        const text = response.text();

        console.log("Gemini Output:", text);

        // Delete uploaded temp file
        fs.unlinkSync(file.path);

        // Return result
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
});

// -----------------------------------
// Start server
// -----------------------------------
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});