"use strict";
function carousel(count) {
  return {
    current: 0,
    timer: null,
    init() {
      const o = new IntersectionObserver(
        ([e]) => (e.isIntersecting ? this.start() : this.stop()),
        { threshold: 0.5 },
      );
      o.observe(this.$el);
    },
    start() {
      if (this.prefersReduce) return;
      this.timer = setInterval(() => {
        this.current = (this.current + 1) % count;
      }, 5000);
    },
    stop() {
      clearInterval(this.timer);
      this.timer = null;
    },
    get prefersReduce() {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    },
  };
}
