const express = require("express");
const router = require("express").Router();

const axios = require("axios");
const {
  isLoggedIn,
  notLoggedIn,
  whoIsLoggedIn,
} = require("../middlewares/auth");

router.get("/memberships", isLoggedIn, async (req, res) => {
  try {
    const api = axios.create({
      baseURL: process.env.API_URL,
      withCredentials: true,
      headers: {
        Origin: req.headers.origin || "",
        Cookie: req.headers.cookie || "",
      },
    });

    // Ask the API for a larger page size if it supports it.
    // We'll still iterate pages to be safe.
    const LIMIT = Number(req.query.limit) || 200; // try big; API may clamp
    const HARD_CAP = 5000; // safety: never pull more than this many items

    let page = 1;
    let pages = 1;
    const all = [];

    while (page <= pages && all.length < HARD_CAP) {
      const { data, status } = await api.get("/api/all/purchases", {
        params: { page, limit: LIMIT },
      });

      if (!data || !Array.isArray(data.items)) {
        throw new Error("Unexpected API response shape for purchases");
      }

      // meta from first page
      if (page === 1) {
        pages = Number(data.pages) || 1;
        console.log("Purchases meta:", {
          page: data.page,
          pages: data.pages,
          total: data.total,
          limit: data.limit,
        });
      }

      all.push(...data.items);
      console.log(
        `Fetched page ${page}/${pages}: +${data.items.length}, total=${all.length}`
      );
      page += 1;
    }

    // Map once for the grid
    const items = all.slice(0, HARD_CAP).map((p) => ({
      id: p.id,
      userName: p.user?.username || p.user?.name || "—",
      userEmail: p.user?.email || "—",
      planName: p.planName,
      durationDays: p.durationDays,
      couponCode: p.couponCode || "—",
      provider: p.provider,
      transactionId: p.transactionId,
      currency: p.currency,
      base: (p.baseAmountMinor ?? 0) / 100,
      discount: (p.discountMinor ?? 0) / 100,
      final: (p.finalAmountMinor ?? 0) / 100,
      region: p.region,
      paid: !!p.paid,
      createdAt: p.createdAt,
    }));

    return res.render("memberships", {
      title: "Memberships",
      admin: req.admin,
      path: "memberships",
      // client will paginate locally; set single meta
      page: 1,
      pages: 1,
      limit: items.length,
      total: items.length,
      items,
    });
  } catch (err) {
    console.error(
      "Purchases error:",
      err.response?.status,
      err.response?.data || err.message
    );
    return res.render("memberships", {
      title: "Memberships",
      admin: req.admin,
      path: "memberships",
      page: 1,
      pages: 1,
      limit: 20,
      total: 0,
      items: [],
      error: "Failed to load purchases",
    });
  }
});

router.get("/membership-plans", isLoggedIn, async (req, res) => {
  try {
    const plans = await axios.get(`${process.env.API_URL}/api/memberships`, {
      headers: {
        Origin: req.headers.origin || "",
        Cookie: req.headers.cookie || "",
      },
    });
    const allPlans = plans.data.plans || [];
    console.log("Membership plans fetched:", allPlans);
    console.log(allPlans[0].priceBook);
    return res.render("membership-plans", {
      path: "membership-plans",
      title: "All Membership plans",
      admin: req.admin,
      allPlans,
    });
  } catch (err) {
    console.error("Membership plans error:", err.message);
  }
});

// Render page
router.get("/coupons", isLoggedIn, async (req, res) => {
  try {
    return res.render("coupons", {
      title: "Coupons",
      path: "coupons",
      admin: req.admin,
    });
  } catch (e) {
    console.error("Render coupons page error:", e);
    return res.render("coupons", {
      title: "Coupons",
      path: "coupons",
      admin: req.admin,
      error: "Failed to load page",
    });
  }
});

// JSON data proxy for Grid.js (supports pagination params if you want)
router.get("/coupons/data", isLoggedIn, async (req, res) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 200); // pull a lot; Grid paginates locally
    const q = req.query.q || "";
    const isActive = req.query.isActive;

    const { data } = await axios.get(`${process.env.API_URL}/api/coupons`, {
      headers: {
        Origin: req.headers.origin || "",
        Cookie: req.headers.cookie || "",
      },
      params: {
        page,
        limit,
        q,
        isActive,
      },
      withCredentials: true,
    });

    // Expecting { items, page, pages, total, ... }. If different, adjust here:
    res.json(data);
  } catch (e) {
    console.error("Fetch coupons proxy error:", e.response?.data || e.message);
    res.status(500).json({
      items: [],
      page: 1,
      pages: 1,
      total: 0,
      error: "Failed to fetch coupons",
    });
  }
});

// Toggle isActive proxy
router.patch("/coupons/:id/toggle", isLoggedIn, async (req, res) => {
  try {
    const couponId = req.params.id;
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({ message: "isActive must be boolean." });
    }

    const { data } = await axios.patch(
      `${process.env.API_URL}/api/coupons/${couponId}/toggle`,
      { isActive },
      {
        headers: {
          Origin: req.headers.origin || "",
          Cookie: req.headers.cookie || "",
        },
        withCredentials: true,
      }
    );

    res.json(data);
  } catch (e) {
    console.error("Toggle coupon proxy error:", e.response?.data || e.message);
    res
      .status(e.response?.status || 500)
      .json({ message: "Failed to toggle coupon." });
  }
});

router.get("/coupons/new", isLoggedIn, async (req, res) => {
  try {
    return res.render("coupons-new", {
      title: "Create New Coupon",
      path: "coupons",
      admin: req.admin,
    });
  } catch (e) {
    console.error("Render new coupon page error:", e);
    return res.render("coupons-new", {
      title: "Create New Coupon",
      path: "coupons",
      admin: req.admin,
      error: "Failed to load page",
    });
  }
});

// POST /admin/coupons  -> proxy to API: ${process.env.API_URL}/api/coupons
router.post("/coupons", isLoggedIn, async (req, res) => {
  try {
    const api = axios.create({
      baseURL: process.env.API_URL,
      withCredentials: true,
      headers: {
        Origin: req.headers.origin || "",
        Cookie: req.headers.cookie || "",
      },
    });

    // Normalize payload a bit (handle regions + amount/percent fields)
    const payload = { ...req.body };

    // regions: allow CSV or array
    if (typeof payload.regions === "string") {
      payload.regions = payload.regions
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }

    // type → value/amountMinor normalization
    // If type === 'percent', keep `value`. If type === 'amount', use `amountMinor`
    if (payload.type === "amount") {
      if (payload.value != null && payload.amountMinor == null) {
        payload.amountMinor = Number(payload.value);
        delete payload.value;
      } else if (payload.amountMinor != null) {
        payload.amountMinor = Number(payload.amountMinor);
        delete payload.value; // ensure API gets amountMinor only
      }
    } else if (payload.type === "percent") {
      if (payload.value != null) payload.value = Number(payload.value);
      delete payload.amountMinor;
    }

    // numeric fields (if present)
    ["maxDiscountMinor", "usageLimit", "perUserLimit"].forEach((k) => {
      if (payload[k] != null && payload[k] !== "") {
        payload[k] = Number(payload[k]);
      } else {
        delete payload[k];
      }
    });

    // booleans
    if (typeof payload.isActive === "string") {
      payload.isActive =
        payload.isActive === "true" || payload.isActive === "on";
    }

    // POST to upstream API
    const { data } = await api.post(
      `${process.env.API_URL}/api/coupons`,
      payload
    );
    return res.status(201).json(data);
  } catch (e) {
    console.error("Create coupon proxy error:", e.response?.data || e.message);
    return res
      .status(e.response?.status || 500)
      .json(e.response?.data || { message: "Failed to create coupon." });
  }
});

module.exports = router;
