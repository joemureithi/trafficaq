const express = require("express");
const path = require("path");
const port = 3000;

const app = express();

/* Ensure any requests prefixed with /static will serve our "frontend/static" directory */
// https://expressjs.com/en/starter/static-files.html
app.use("/static", express.static(path.resolve(__dirname, "frontend", "static")));

/* Redirect all routes to "index.html" file */
app.get("/*", (req, res) => {
    res.sendFile(path.resolve("frontend", "index.html"));
});

app.listen(process.env.PORT || port, () => console.log(`Server running at port: ${port}`));