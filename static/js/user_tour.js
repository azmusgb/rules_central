/**
 * user_tour.js — Handles first-time user tour
 * ------------------------------------------
 * ✅ Shows tour only once unless reset
 * ✅ Persists completion in localStorage
 * ✅ Accessible with Escape key to dismiss
 */

document.addEventListener('DOMContentLoaded', () => {
  const STORAGE_KEY = 'tourDone';
  const tourEl = document.getElementById('user-tour');

  // If no tour element OR user already completed it → exit early
  if (!tourEl || localStorage.getItem(STORAGE_KEY)) return;

  const dismissBtn = tourEl.querySelector('button, [data-tour-dismiss]');
  
  // Show the tour (remove hidden state)
  tourEl.classList.remove('hidden');
  tourEl.setAttribute('aria-hidden', 'false');

  /**
   * Hide & mark as completed
   */
  const dismissTour = () => {
    tourEl.classList.add('hidden');
    tourEl.setAttribute('aria-hidden', 'true');
    localStorage.setItem(STORAGE_KEY, '1');
  };

  // Dismiss via button click
  if (dismissBtn) {
    dismissBtn.addEventListener('click', dismissTour);
  }

  // Dismiss via Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !tourEl.classList.contains('hidden')) {
      dismissTour();
    }
  });

  // Optional: prevent body scroll when tour is active
  document.body.classList.add('overflow-hidden');
  tourEl.addEventListener('transitionend', () => {
    if (tourEl.classList.contains('hidden')) {
      document.body.classList.remove('overflow-hidden');
    }
  });
});