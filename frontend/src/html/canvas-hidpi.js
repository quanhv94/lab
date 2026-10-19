(() => {
  const canvas = document.getElementById('cv');

  if (!canvas) {
    return;
  }

  const context = canvas.getContext('2d');
  const logicalWidth = canvas.width;
  const logicalHeight = canvas.height;

  function sharpenCanvas() {
    const rect = canvas.getBoundingClientRect();
    const pixelRatio = Math.max(1, window.devicePixelRatio || 1);
    const targetWidth = Math.max(1, Math.round(rect.width * pixelRatio));
    const targetHeight = Math.max(1, Math.round(rect.height * pixelRatio));

    if (canvas.width === targetWidth && canvas.height === targetHeight) {
      return;
    }

    canvas.width = targetWidth;
    canvas.height = targetHeight;
    context.setTransform(targetWidth / logicalWidth, 0, 0, targetHeight / logicalHeight, 0, 0);

    if (typeof window.render === 'function') {
      window.render();
    }
  }

  window.addEventListener('resize', sharpenCanvas);
  window.requestAnimationFrame(sharpenCanvas);
})();
