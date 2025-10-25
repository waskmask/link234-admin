// routes/ui.js
const router = require("express").Router();
const axios = require("axios");
const {
  isLoggedIn,
  notLoggedIn,
  whoIsLoggedIn,
} = require("../middlewares/auth");

// expose admin to views (optional)
router.use(whoIsLoggedIn);

// LOGIN PAGE
router.get("/", notLoggedIn, (req, res) =>
  res.render("login", { title: "Link234" })
);

// LOGIN PROXY
router.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const apiRes = await axios.post(
      `${process.env.API_URL}/api/admin-users/login`,
      { email, password },
      {
        withCredentials: true,
        headers: {
          Origin: req.headers.origin || "",
          Cookie: req.headers.cookie || "",
        },
      }
    );
    const sc = apiRes.headers["set-cookie"];
    if (sc?.length) res.setHeader("Set-Cookie", sc);
    return res.status(200).json(apiRes.data);
  } catch (err) {
    return res
      .status(err.response?.status || 500)
      .json(err.response?.data || { message: "server_error" });
  }
});

router.post("/auth/logout", async (req, res) => {
  try {
    const apiRes = await axios.post(
      `${process.env.API_URL}/api/admin-users/logout`,
      null,
      {
        withCredentials: true,
        headers: {
          Origin: req.headers.origin || "",
          Cookie: req.headers.cookie || "",
        },
      }
    );
    const sc = apiRes.headers["set-cookie"];
    if (sc?.length) res.setHeader("Set-Cookie", sc);
  } catch (_) {}
  res.clearCookie("adminToken", { path: "/" });
  return res.redirect("/"); // login page
});

module.exports = router;
