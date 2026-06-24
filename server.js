const express = require("express");
const fileUpload = require("express-fileupload");
const ffmpeg = require("fluent-ffmpeg");
const path = require("path");
const fs = require("fs");

const app = express();

app.use(fileUpload());
app.use(express.static("public"));

if (!fs.existsSync("uploads")) {
    fs.mkdirSync("uploads");
}

if (!fs.existsSync("outputs")) {
    fs.mkdirSync("outputs");
}

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/public/index.html");
});

app.post("/convert", async (req, res) => {

    if (!req.files || !req.files.video) {
        return res.status(400).send("No file uploaded");
    }

    const video = req.files.video;

    const inputPath = "./uploads/" + Date.now() + "_" + video.name;

    await video.mv(inputPath);

    const outputPath =
        "./outputs/" +
        Date.now() +
        ".mp4";

    ffmpeg(inputPath)
        .output(outputPath)
        .videoCodec("libx264")
        .audioCodec("aac")
        .on("end", () => {

            res.download(outputPath, () => {

                fs.unlinkSync(inputPath);

                if (fs.existsSync(outputPath)) {
                    fs.unlinkSync(outputPath);
                }

            });

        })
        .on("error", (err) => {

            console.log(err);

            res.status(500).send("Conversion Failed");

        })
        .run();

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

    console.log(
        "Server Running on Port " + PORT
    );

});
