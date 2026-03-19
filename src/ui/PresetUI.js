const BUILT_IN_PRESETS = [
  'acid-trip', 'underwater', 'heartbeat',
  'neon-dreams', 'glitch-storm', 'zen',
];

export function initPresetUI(container, presetManager, controls) {
  if (!container) return;

  const grid = document.createElement('div');
  grid.className = 'preset-grid';

  BUILT_IN_PRESETS.forEach((name) => {
    const btn = document.createElement('button');
    btn.className = 'preset-btn';
    btn.textContent = name.replace(/-/g, ' ');
    btn.addEventListener('click', async () => {
      grid.querySelectorAll('.preset-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      await presetManager.loadAndApply(name, controls);
    });
    grid.appendChild(btn);
  });

  container.appendChild(grid);
}
