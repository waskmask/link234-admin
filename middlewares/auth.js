// middlewares/auth.js
const axios = require("axios");
const API = process.env.API_URL;

async function fetchMe(req) {
  return axios.get(`${API}/api/admin-users/me`, {
    withCredentials: true,
    headers: {
      Cookie: req.headers.cookie || "",
      Origin: req.headers.origin || "",
    },
  });
}

exports.isLoggedIn = async (req, res, next) => {
  try {
    const { data } = await fetchMe(req);
    console.log("data:", data);
    req.admin = data.admin;
    res.locals.admin = data.admin;

    return next();
  } catch {
    res.clearCookie("adminToken", { path: "/" });
    return res.redirect("/"); // login at "/"
  }
};

exports.notLoggedIn = async (req, res, next) => {
  try {
    await fetchMe(req);
    return res.redirect("/dashboard");
  } catch {
    return next();
  }
};

exports.whoIsLoggedIn = async (req, res, next) => {
  try {
    const { data } = await fetchMe(req);
    req.admin = data.admin;
    res.locals.admin = data.admin;
  } catch {
    // not logged in; leave undefined
  }
  return next();
};
