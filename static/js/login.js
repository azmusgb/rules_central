// Login page interactions

document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.getElementById("togglePassword");
  const passwordInput = document.getElementById("password");
  if (toggleBtn && passwordInput) {
    toggleBtn.addEventListener("click", () => {
      const type =
        passwordInput.getAttribute("type") === "password" ? "text" : "password";
      passwordInput.setAttribute("type", type);
      toggleBtn.querySelector("i").classList.toggle("fa-eye");
      toggleBtn.querySelector("i").classList.toggle("fa-eye-slash");
    });
  }

  const form = document.getElementById("loginForm");
  if (form) {
    form.addEventListener("submit", (e) => {
      if (!form.checkValidity()) {
        e.preventDefault();
      }
    });
  }
});
