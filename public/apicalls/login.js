document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");
  const emailInput = document.querySelector("#email");
  const passwordInput = document.querySelector("#password");

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

    try {
      const res = await axios.post("/auth/login", { email, password });
      if (res.data.success) location.href = "/dashboard";
    } catch (err) {
      const msgKey = err.response?.data?.message || "server_error";
      const msg =
        window.translations?.[msgKey] ||
        {
          invalid_credentials: "Invalid email",
          invalid_password: "Incorrect password",
          inactive_account: "Account inactive",
          server_error: "Server error",
        }[msgKey] ||
        "Login failed";

      const alert = document.createElement("div");
      alert.className =
        "form-alert text-red-500 text-sm mt-2 text-center font-medium";
      alert.textContent = msg;
      form.appendChild(alert);
    }
  });
});
