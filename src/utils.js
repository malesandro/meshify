export function screenshot(canvas) {
  const a = document.createElement('a');
  a.download = `meshify_${Date.now()}.png`;
  a.href = canvas.toDataURL('image/png');
  a.click();
}

export function createFPSCounter(element) {
  let frameCount = 0;
  let lastTime = 0;

  return function updateFPS() {
    frameCount++;
    const now = performance.now();
    if (now - lastTime > 500) {
      element.textContent = Math.round(frameCount / ((now - lastTime) / 1000)) + ' fps';
      frameCount = 0;
      lastTime = now;
    }
  };
}

export function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}
