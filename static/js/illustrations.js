export function initBearAnimations() {
  document.querySelectorAll('.bear-illustration-path').forEach(path => {
    const length = path.getTotalLength();
    path.style.strokeDasharray = length;
    path.style.strokeDashoffset = length;

    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        path.style.transition = 'stroke-dashoffset 800ms cubic-bezier(0.4, 0, 0.2, 1)';
        path.style.strokeDashoffset = '0';
      }
    });

    observer.observe(path.closest('svg'));
  });
}
