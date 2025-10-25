// routes/adminUsersPages.js
const express = require("express");
const axios = require("axios");
const { isLoggedIn } = require("../middlewares/auth");

const router = express.Router();

/**
 * Page: Add Admin User (form)
 */
router.get("/admin-users/new", isLoggedIn, (req, res) => {
  return res.render("admin-users-new", {
    title: "Add Admin User",
    admin: req.admin,
    path: "admin-users",
  });
});

/**
 * Proxy: Create Admin User (JSON)
 * Client will POST here; we forward to backend API and return JSON.
 */
router.post("/admin-users", isLoggedIn, async (req, res) => {
  try {
    const common = {
      headers: {
        Origin: req.headers.origin || "",
        Cookie: req.headers.cookie || "",
      },
      withCredentials: true,
      timeout: 15000,
    };

    const { data } = await axios.post(
      `${process.env.API_URL}/api/admin-users/signup`,
      req.body,
      common
    );

    return res.status(201).json(data);
  } catch (e) {
    const status = e.response?.status || 500;
    return res.status(status).json({
      message:
        e.response?.data?.message ||
        e.response?.data?.error ||
        e.message ||
        "Failed to create admin user",
    });
  }
});

router.get("/admins", isLoggedIn, (req, res) => {
  return res.render("admins", {
    title: "All Admin Users",
    admin: req.admin,
    path: "admins",
  });
});

/**
 * Data proxy for Grid.js (supports pagination + search)
 * Grid.js will request this; we forward to your API (/api/admin-users/admins)
 * and normalize the response for the grid.
 */
router.get("/admins/data", isLoggedIn, async (req, res) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const q = (req.query.q || "").trim();
    const role = (req.query.role || "").trim();
    const status = (req.query.status || "").trim();

    const common = {
      headers: {
        Origin: req.headers.origin || "",
        Cookie: req.headers.cookie || "",
      },
      params: { page, limit, q, role, status },
      withCredentials: true,
      timeout: 15000,
    };

    const { data } = await axios.get(
      `${process.env.API_URL}/api/admin-users/admins`,
      common
    );

    const items = Array.isArray(data?.items) ? data.items : [];
    const total = Number(data?.total || items.length);

    // Normalize for grid
    return res.json({
      items,
      page,
      limit,
      total,
    });
  } catch (e) {
    return res.status(e.response?.status || 500).json({
      items: [],
      total: 0,
      message:
        e.response?.data?.message ||
        e.response?.data?.error ||
        "Failed to fetch admins",
    });
  }
});

/**
 * Page: Single Admin detail
 * (The page can fetch directly from /api/admin-users/admins/:id, or you can add a proxy route too)
 */
router.get("/admin/:id", isLoggedIn, async (req, res) => {
  const { id } = req.params;

  try {
    // Forward auth cookies + origin to API
    const common = {
      headers: {
        Origin: req.headers.origin || "",
        Cookie: req.headers.cookie || "",
      },
      withCredentials: true,
      timeout: 15000,
    };

    const { data } = await axios.get(
      `${process.env.API_URL}/api/admin-users/admins/${id}`,
      common
    );

    const adminDetail = data?.admin || null;

    return res.render("admin-view", {
      title: adminDetail ? `Admin · ${adminDetail.name || "Profile"}` : "Admin",
      admin: req.admin, // logged-in admin (from isLoggedIn)
      path: "admins",
      viewId: id, // still send if you’ll need it on the client
      adminDetail, // ← server-fetched admin data
      error: null,
    });
  } catch (e) {
    const status = e?.response?.status || 500;
    const message =
      e?.response?.data?.message ||
      e?.message ||
      "Failed to load admin profile";

    // You can render the same page with an error message
    return res.status(status).render("admin-view", {
      title: "Admin",
      admin: req.admin,
      path: "admins",
      viewId: id,
      adminDetail: null,
      error: message,
    });
  }
});

// routes/adminUsersPages.js (same file)
router.post("/admin/:id/status", isLoggedIn, async (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body;
  try {
    const { data } = await axios.patch(
      `${process.env.API_URL}/api/admin-users/admins/${id}/active`,
      { isActive: !!isActive },
      {
        headers: {
          "Content-Type": "application/json",
          Origin: req.headers.origin || "",
          Cookie: req.headers.cookie || "",
        },
        withCredentials: true,
        timeout: 15000,
      }
    );
    res.json({ success: true, data });
  } catch (e) {
    res.status(e?.response?.status || 500).json({
      success: false,
      message: e?.response?.data?.message || "Update failed",
    });
  }
});

router.post("/admin/:id/password", isLoggedIn, async (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;
  try {
    const { data } = await axios.post(
      `${process.env.API_URL}/api/admin-users/admins/${id}/change-password`,
      { newPassword },
      {
        headers: {
          "Content-Type": "application/json",
          Origin: req.headers.origin || "",
          Cookie: req.headers.cookie || "",
        },
        withCredentials: true,
        timeout: 15000,
      }
    );
    res.json({ success: true, data });
  } catch (e) {
    res.status(e?.response?.status || 500).json({
      success: false,
      message: e?.response?.data?.message || "Password update failed",
    });
  }
});

// Settings page
router.get("/settings", isLoggedIn, (req, res) => {
  return res.render("settings", {
    title: "Settings",
    admin: req.admin, // from isLoggedIn
    path: "settings",
  });
});

// Change own password (proxy to API)
router.post("/settings/password", isLoggedIn, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  try {
    const { data } = await axios.post(
      `${process.env.API_URL}/api/admin-users/change-password`,
      { oldPassword, newPassword },
      {
        headers: {
          "Content-Type": "application/json",
          Origin: req.headers.origin || "",
          Cookie: req.headers.cookie || "",
        },
        withCredentials: true,
        timeout: 15000,
      }
    );
    return res.json({ success: true, data });
  } catch (e) {
    return res.status(e?.response?.status || 500).json({
      success: false,
      message:
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        "Failed to change password",
    });
  }
});

module.exports = router;
