const express = require("express");
const router = require("express").Router();

const axios = require("axios");
const {
  isLoggedIn,
  notLoggedIn,
  whoIsLoggedIn,
} = require("../middlewares/auth");

// PROTECTED
router.get("/app-users", isLoggedIn, (req, res) => {
  return res.render("app-users", {
    title: "App users",
    admin: req.admin,
    path: "app-users",
  });
});

// Data proxy (Grid.js will call this)
router.get("/users/data", isLoggedIn, async (req, res) => {
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
      const users = await axios.get(
        `${process.env.API_URL}/api/admin/users`,
        common
      );
      data = users.data;
    } catch (e1) {
      // Fallback to non-/api prefix if backend is mounted differently
      const r2 = await axios.get(
        `${process.env.API_URL}/api/admin/users`,
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
        "Failed to fetch users",
    });
  }
});

module.exports = router;
