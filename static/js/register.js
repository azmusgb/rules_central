// Register page interactions

document.addEventListener('DOMContentLoaded', () => {
  function toggleVisibility(btnId, inputId) {
    const btn = document.getElementById(btnId);
    const input = document.getElementById(inputId);
    if (!btn || !input) return;
    btn.addEventListener('click', () => {
      const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
      input.setAttribute('type', type);
      btn.querySelector('i').classList.toggle('fa-eye');
      btn.querySelector('i').classList.toggle('fa-eye-slash');
    });
  }

  toggleVisibility('togglePassword', 'password');
  toggleVisibility('toggleConfirm', 'confirm_password');

  const form = document.getElementById('registerForm');
  if (form) {
    form.addEventListener('submit', (e) => {
      if (!form.checkValidity()) {
        e.preventDefault();
      }
    });
  }
});
