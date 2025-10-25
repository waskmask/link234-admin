// /public/apicalls/admin-users.js
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const show = (el) => el && el.classList.remove("hidden");
  const hide = (el) => el && el.classList.add("hidden");

  // ---- elements ----
  const form = $("#adminCreateForm");
  if (!form) return;

  const nameEl = $("#name");
  const emailEl = $("#email");
  const passwordEl = $("#password");
  const roleEl = $("#role");
  const submitBtn = $("#submitBtn");
  const spinner = $("#btnSpinner");
  const alertSuccess = $("#alertSuccess");
  const alertError = $("#alertError");
  const togglePwdBtn = $("#togglePwdBtn"); // eye icon button

  // ---- error helpers ----
  const setErr = (key, msg) => {
    const el = document.querySelector(`[data-err="${key}"]`);
    if (!el) return;
    if (msg) {
      el.textContent = msg;
      show(el);
    } else {
      el.textContent = "";
      hide(el);
    }
  };

  // ---- validators ----
  const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const strongPwdRx = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

  function validateField(field) {
    switch (field) {
      case "name": {
        const v = (nameEl.value || "").trim();
        if (!v || v.length < 2) {
          setErr("name", "Please enter a valid name (min 2 chars).");
          return false;
        }
        setErr("name");
        return true;
      }
      case "email": {
        const v = (emailEl.value || "").trim();
        if (!emailRx.test(v)) {
          setErr("email", "Please enter a valid email address.");
          return false;
        }
        setErr("email");
        return true;
      }
      case "password": {
        // no spaces allowed & must be strong
        let v = passwordEl.value || "";
        if (/\s/.test(v)) {
          setErr("password", "Password cannot contain spaces.");
          return false;
        }
        if (!strongPwdRx.test(v)) {
          setErr(
            "password",
            "Password must be 8+ chars and include a number & symbol."
          );
          return false;
        }
        setErr("password");
        return true;
      }
      case "role": {
        const v = (roleEl.value || "").trim();
        if (!v) {
          setErr("role", "Please select a role.");
          return false;
        }
        setErr("role");
        return true;
      }
      default:
        return true;
    }
  }

  function validateAll() {
    const a = validateField("name");
    const b = validateField("email");
    const c = validateField("password");
    const d = validateField("role");
    return a && b && c && d;
  }

  // ---- blur validations ----
  nameEl?.addEventListener("blur", () => validateField("name"));
  emailEl?.addEventListener("blur", () => validateField("email"));
  roleEl?.addEventListener("blur", () => validateField("role"));
  emailEl?.addEventListener("input", () => validateField("email"));
  // Prevent spaces in password as user types; also trim leading/trailing once per input event
  if (passwordEl) {
    passwordEl.addEventListener("input", () => {
      // Strip spaces live
      const noSpaces = passwordEl.value.replace(/\s+/g, "");
      if (passwordEl.value !== noSpaces) {
        const pos = passwordEl.selectionStart || noSpaces.length;
        passwordEl.value = noSpaces;
        // keep caret close to where the user was typing
        passwordEl.setSelectionRange(
          pos - 1 < 0 ? 0 : pos - 1,
          pos - 1 < 0 ? 0 : pos - 1
        );
      }
    });
    passwordEl.addEventListener("blur", () => {
      // trim (just in case) and validate
      passwordEl.value = (passwordEl.value || "").trim();
      validateField("password");
    });
  }

  // ---- show/hide password toggle ----
  togglePwdBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    if (!passwordEl) return;
    const isText = passwordEl.type === "text";
    passwordEl.type = isText ? "password" : "text";
    // swap icon data-state
    togglePwdBtn.setAttribute("data-state", isText ? "hidden" : "visible");
    // accessible label
    togglePwdBtn.setAttribute(
      "aria-label",
      isText ? "Show password" : "Hide password"
    );
  });

  // ---- submit ----
  async function submit(e) {
    e.preventDefault();
    hide(alertSuccess);
    hide(alertError);
    // force trim name + email on submit
    if (nameEl) nameEl.value = (nameEl.value || "").trim();
    if (emailEl) emailEl.value = (emailEl.value || "").trim();
    if (passwordEl) passwordEl.value = (passwordEl.value || "").trim();

    if (!validateAll()) return;

    submitBtn.disabled = true;
    spinner.classList.remove("hidden");

    try {
      const payload = {
        name: nameEl.value,
        email: emailEl.value,
        password: passwordEl.value, // server hashes
        role: roleEl.value.trim(),
      };
      await axios.post("/admin-users", payload, { timeout: 15000 });

      // Success UI
      $("#alertSuccess").textContent = "Admin created successfully.";
      show(alertSuccess);
      hide(alertError);

      // Reset form
      form.reset();
      // reset eye state
      if (passwordEl) passwordEl.type = "password";
      togglePwdBtn?.setAttribute("data-state", "hidden");

      // focus first field
      nameEl?.focus();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to create admin user";
      $("#alertError").textContent = msg;
      show(alertError);
      hide(alertSuccess);
    } finally {
      submitBtn.disabled = false;
      spinner.classList.add("hidden");
    }
  }

  form.addEventListener("submit", submit);
})();
