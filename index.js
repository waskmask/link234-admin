// server.js
const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");

const app = express();

// parsers FIRST
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// views + static
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use("/public", express.static(path.join(__dirname, "public")));
app.use((req, res, next) => {
  if (req.path.endsWith(".mjs")) res.type("application/javascript");
  next();
});
app.use(
  "/vendor/lodash",
  express.static(path.join(__dirname, "node_modules/lodash"))
);
app.use(
  "/vendor/preline",
  express.static(path.join(__dirname, "node_modules/preline/dist"))
);
app.use(
  "/vendor/gridjs",
  express.static(require("path").join(__dirname, "node_modules/gridjs/dist"))
);

// routes
app.use("/", require("./routes/authRoutes"));
app.use("/", require("./routes/dashboardRoutes"));
app.use("/", require("./routes/membershipRoutes"));
app.use("/", require("./routes/appUsersRoutes"));
app.use("/", require("./routes/adminUsersPages"));

// Dev 500
app.get("/_dev/error", () => {
  throw new Error("Simulated server error");
});

// 404
app.use((req, res) =>
  res.status(404).render("errors/404", { title: "Page not found · Link234" })
);

// 500
app.use((err, req, res, next) => {
  console.error(err.stack);
  const incidentId = Date.now().toString(36);
  res.status(500).render("errors/500", {
    title: "Something went wrong · Link234",
    incidentId,
    stack: app.get("env") !== "production" ? err.stack : null,
  });
});

const PORT = process.env.PORT || 5100;
app.listen(PORT, () => console.log(`Link234 admin running on ${PORT}`));
