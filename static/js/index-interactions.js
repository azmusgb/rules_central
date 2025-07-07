// Interactions for dashboard page
// Handles fade-in effects, card hover animations, and FAB actions

document.addEventListener('DOMContentLoaded', () => {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-fade-in');
      }
    });
  }, observerOptions);

  document.querySelectorAll('.card-hover').forEach(card => {
    observer.observe(card);
  });

  document.querySelectorAll('[class*="hover:bg-dark-750"]').forEach(item => {
    item.addEventListener('mouseenter', () => {
      item.style.transform = 'translateX(5px)';
    });
    item.addEventListener('mouseleave', () => {
      item.style.transform = 'translateX(0)';
    });
  });

  const fab = document.querySelector('.fixed button');
  if (fab) {
    fab.addEventListener('click', () => {
      console.log('FAB clicked!');
    });
  }
});
