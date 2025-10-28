const API_BASE = "https://api.link234.com";
// admin-login.js (direct API, no proxy)
document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");
  const emailInput = document.querySelector("#email");
  const passwordInput = document.querySelector("#password");
  const submitBtn = form.querySelector('button[type="submit"]');

  // axios global config for cookies + baseURL
  if (window.axios) {
    axios.defaults.withCredentials = true; // send/receive cookies
    axios.defaults.baseURL = window.API_BASE || "https://api.link234.com";
    axios.defaults.headers.post["Content-Type"] = "application/json";
  }

  const showError = (input, msg) => {
    removeError(input);
    const div = document.createElement("p");
    div.className = "text-red-500 text-sm mt-1";
    div.textContent = msg;
    input.insertAdjacentElement("afterend", div);
  };

  const removeError = (input) => {
    const next = input.nextElementSibling;
    if (next && next.classList.contains("text-red-500")) next.remove();
  };

  emailInput.addEventListener("blur", () => {
    removeError(emailInput);
    const val = emailInput.value.trim();
    if (!val) showError(emailInput, "Email required");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val))
      showError(emailInput, "Invalid email");
  });

  passwordInput.addEventListener("blur", () => {
    removeError(passwordInput);
    if (!passwordInput.value.trim())
      showError(passwordInput, "Password required");
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    document.querySelector(".form-alert")?.remove();

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    if (!email || !password) return;

    // UI: disable while submitting
    submitBtn?.setAttribute("disabled", "disabled");
    const prevText = submitBtn?.textContent;
    if (submitBtn) submitBtn.textContent = "Signing in...";

    try {
      // DIRECT CALL to API (no proxy). Cookie comes from api.link234.com
      const res = await axios.post(
        "/api/admin-users/login",
        { email, password },
        {
          withCredentials: true, // redundant but explicit
        }
      );

      if (res?.data?.success) {
        // success → cookie set by api.link234.com (HttpOnly; Secure; SameSite=None)
        // location.href = "/dashboard";
        return;
      }

      throw new Error("unexpected_response");
    } catch (err) {
      // Map server messages to friendly text
      const msgKey = err?.response?.data?.message || "server_error";
      const fallbackMap = {
        invalid_credentials: "Invalid email",
        invalid_password: "Incorrect password",
        inactive_account: "Account inactive",
        "User not found": "Invalid email",
        server_error: "Server error",
        unauthorized: "Invalid credentials",
      };
      const msg =
        (window.translations && window.translations[msgKey]) ||
        fallbackMap[msgKey] ||
        "Login failed";

      const alert = document.createElement("div");
      alert.className =
        "form-alert text-red-500 text-sm mt-2 text-center font-medium";
      alert.textContent = msg;
      form.appendChild(alert);
    } finally {
      // restore UI
      submitBtn?.removeAttribute("disabled");
      if (submitBtn && prevText) submitBtn.textContent = prevText;
    }
  });
});
