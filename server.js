```javascript
const express = require("express");
const fileUpload = require("express-fileupload");
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");

const app = express();

app.use(fileUpload({
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB
    }
}));

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

    console.log("========== NEW REQUEST ==========");

    try {

        if (!req.files) {
            console.log("No files object found");
            return res.status(400).send("No file uploaded");
        }

        if (!req.files.video) {
            console.log("Video field not found");
            return res.status(400).send("Video file missing");
        }

        const video = req.files.video;

        console.log("File Name:", video.name);
        console.log("File Size:", video.size);

        const inputPath =
            "./uploads/" +
            Date.now() +
            "_" +
            video.name;

        await video.mv(inputPath);

        console.log("Upload Complete");
        console.log("Input Path:", inputPath);

        const outputPath =
            "./outputs/" +
            Date.now() +
            ".mp4";

        console.log("Output Path:", outputPath);

        ffmpeg(inputPath)

            .videoCodec("libx264")
            .audioCodec("aac")

            .output(outputPath)

            .on("start", (cmd) => {
                console.log("FFMPEG STARTED");
                console.log(cmd);
            })

            .on("progress", (progress) => {
                console.log(
                    "Progress:",
                    progress.percent
                );
            })

            .on("end", () => {

                console.log("Conversion Finished");

                res.download(
                    outputPath,
                    "converted.mp4",
                    (err) => {

                        console.log(
                            "Download Complete"
                        );

                        if (fs.existsSync(inputPath)) {
                            fs.unlinkSync(inputPath);
                        }

                        if (fs.existsSync(outputPath)) {
                            fs.unlinkSync(outputPath);
                        }

                    }
                );

            })

            .on("error", (err) => {

                console.error(
                    "FFMPEG ERROR:"
                );

                console.error(err);

                return res
                    .status(500)
                    .send(
                        "FFMPEG ERROR: " +
                        err.message
                    );

            })

            .run();

    } catch (err) {

        console.error(
            "SERVER ERROR:"
        );

        console.error(err);

        return res
            .status(500)
            .send(
                "SERVER ERROR: " +
                err.message
            );

    }

});

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {

    console.log(
        "Server Running on Port " +
        PORT
    );

});
```
