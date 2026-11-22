/* Agency Studio spotlight scene: no libraries or media downloads. */
(() => {
  const scenes = document.querySelectorAll('.sf-agency-widget--studio .codela-scene');
  if (!scenes.length) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(pointer: fine)');
  scenes.forEach(scene => {
    if (scene.dataset.initialized === 'true') return;
    scene.dataset.initialized = 'true';
    let inView = true;
    const syncVisibility = () => {
      scene.dataset.suspended = String(document.hidden || !inView);
    };
    const syncMotion = () => {
      scene.dataset.reduced = String(reduced.matches);
    };
    document.addEventListener('visibilitychange', syncVisibility);
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(([entry]) => {
        inView = entry.isIntersecting;
        syncVisibility();
      }, {threshold: 0});
      observer.observe(scene);
    }
    if (typeof reduced.addEventListener === 'function') {
      reduced.addEventListener('change', syncMotion);
    }
    if (finePointer.matches) {
      let frame = 0;
      scene.addEventListener('pointermove', event => {
        if (frame || scene.dataset.suspended === 'true' || reduced.matches) return;
        const x = event.clientX, y = event.clientY;
        frame = window.requestAnimationFrame(() => {
          frame = 0;
          const rect = scene.getBoundingClientRect();
          if (!rect.width || !rect.height) return;
          const nx = (x - rect.left) / rect.width - 0.5;
          const ny = (y - rect.top) / rect.height - 0.5;
          scene.style.setProperty('--tilt-y', (nx * 7).toFixed(2) + 'deg');
          scene.style.setProperty('--tilt-x', (-ny * 5).toFixed(2) + 'deg');
        });
      }, {passive:true});
      scene.addEventListener('pointerleave', () => {
        scene.style.setProperty('--tilt-x', '0deg');
        scene.style.setProperty('--tilt-y', '0deg');
      });
    }
    syncMotion();
    syncVisibility();
  });
})();
