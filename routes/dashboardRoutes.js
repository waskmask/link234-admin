const express = require("express");
const router = require("express").Router();

const axios = require("axios");
const {
  isLoggedIn,
  notLoggedIn,
  whoIsLoggedIn,
} = require("../middlewares/auth");

// Dashboard
router.get("/dashboard", isLoggedIn, async (req, res) => {
  try {
    const common = {
      headers: {
        Origin: req.headers.origin || "",
        Cookie: req.headers.cookie || "",
      },
      withCredentials: true,
      timeout: 15000,
    };

    const { data } = await axios.get(
      `${process.env.API_URL}/api/admin/dashboard`,
      common
    );

    return res.render("dashboard", {
      title: "Dashboard",
      admin: req.admin,
      path: "dashboard",
      dashboard: data, // ⬅️ pass payload to EJS
    });
  } catch (error) {
    console.error("Dashboard proxy error:", {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });
    return res.render("dashboard", {
      title: "Dashboard",
      admin: req.admin,
      path: "dashboard",
      dashboard: null,
      error:
        error.response?.data?.message ||
        error.message ||
        "Failed to load dashboard",
    });
  }
});

// Render page
router.get("/submissions", isLoggedIn, async (req, res) => {
  try {
    return res.render("form-submissions", {
      title: "Form Submissions",
      path: "contacts",
      admin: req.admin,
    });
  } catch (e) {
    console.error("Render form submissions page error:", e);
    return res.render("form-submissions", {
      title: "Form Submissions",
      path: "contacts",
      admin: req.admin,
      error: "Failed to load page",
    });
  }
});

// Data proxy (Grid.js will call this)
router.get("/form/submissions/data", isLoggedIn, async (req, res) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 500);
    const q = req.query.q || "";

    const common = {
      headers: {
        Origin: req.headers.origin || "",
        Cookie: req.headers.cookie || "",
      },
      params: { page, limit, q },
      withCredentials: true,
      // optional timeout to fail fast
      timeout: 15000,
    };

    let data;
    try {
      // Try the most typical pattern first
      const r1 = await axios.get(
        `${process.env.API_URL}/api/form/submissions`,
        common
      );
      data = r1.data;
    } catch (e1) {
      // Fallback to non-/api prefix if backend is mounted differently
      const r2 = await axios.get(
        `${process.env.API_URL}/form/submissions`,
        common
      );
      data = r2.data;
    }

    const items = Array.isArray(data?.items)
      ? data.items
      : Array.isArray(data)
      ? data
      : [];

    console.log("[form-submissions] items:", items.length);
    return res.json({ items });
  } catch (e) {
    console.error("Form submissions proxy error:", {
      status: e.response?.status,
      data: e.response?.data,
      message: e.message,
      url: e.config?.url,
    });
    // Return a structured error the client can show
    return res.status(e.response?.status || 500).json({
      items: [],
      message:
        e.response?.data?.message ||
        e.response?.data?.error ||
        "Failed to fetch form submissions",
    });
  }
});

module.exports = router;
