document.addEventListener('DOMContentLoaded', () => {
  const tour = document.getElementById('user-tour');
  if (!tour || localStorage.getItem('tourDone')) return;
  tour.classList.remove('hidden');
  const btn = tour.querySelector('button');
  if (btn) {
    btn.addEventListener('click', () => {
      localStorage.setItem('tourDone', '1');
      tour.classList.add('hidden');
    });
  }
});
