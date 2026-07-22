(() => {
  const seenByScene = new Map();
  let lastSignature = '';

  function getSceneKey(layout) {
    const classes = Array.from(layout.classList).filter((name) => name.startsWith('scene-') || name.startsWith('theme-'));
    return classes.sort().join('|') || layout.className;
  }

  function getVisibleHotspots(layout) {
    return Array.from(layout.querySelectorAll('.sceneFrame .hotspot')).filter((button) => {
      const style = window.getComputedStyle(button);
      return style.display !== 'none' && style.visibility !== 'hidden' && button.getClientRects().length > 0;
    });
  }

  function ensureGateCard(panel) {
    let card = panel.querySelector('.investigationGate');
    if (card) return card;

    card = document.createElement('section');
    card.className = 'investigationGate';
    card.setAttribute('aria-live', 'polite');
    card.innerHTML = `
      <p class="gateKicker">Read The Scene First</p>
      <h3>Click every eye icon to read the story.</h3>
      <p class="gateCopy">The choices will appear after you inspect every clue on the left image.</p>
      <div class="gateProgress" aria-hidden="true"></div>
      <p class="gateCount"></p>
    `;
    panel.insertBefore(card, panel.firstChild);
    return card;
  }

  function unlock(panel) {
    panel.classList.remove('investigationLocked');
    panel.querySelector('.investigationGate')?.remove();
  }

  function updateGate(force = false) {
    const layout = document.querySelector('.immersiveLayout');
    if (!layout) return;

    const panel = layout.querySelector('.actionPanel');
    const choices = layout.querySelector('.choicesList');
    if (!panel || !choices || panel.classList.contains('storybookMode')) return;

    const sceneKey = getSceneKey(layout);
    const shouldGateScene = /scene-floor[1-5]/.test(sceneKey);
    const hotspots = getVisibleHotspots(layout);
    const choiceButtons = Array.from(choices.querySelectorAll('.choiceButton'));
    const shouldGate = shouldGateScene && hotspots.length > 0 && choiceButtons.length > 0;

    if (!shouldGate) {
      unlock(panel);
      lastSignature = sceneKey;
      return;
    }

    const seen = seenByScene.get(sceneKey) || new Set();
    const labels = hotspots.map((hotspot) => hotspot.getAttribute('aria-label') || hotspot.textContent || 'clue');
    const total = labels.length;
    const read = labels.filter((label) => seen.has(label)).length;
    const unlocked = read >= total;
    const signature = `${sceneKey}:${read}/${total}:${unlocked}`;

    if (!force && signature === lastSignature) return;
    lastSignature = signature;

    if (unlocked) {
      unlock(panel);
      return;
    }

    panel.classList.add('investigationLocked');
    const card = ensureGateCard(panel);
    card.hidden = false;

    const count = card.querySelector('.gateCount');
    if (count) count.textContent = `${read} / ${total} clues read`;

    const progress = card.querySelector('.gateProgress');
    if (progress) {
      progress.replaceChildren(...labels.map((label) => {
        const dot = document.createElement('span');
        dot.className = seen.has(label) ? 'read' : '';
        return dot;
      }));
    }
  }

  document.addEventListener('pointerdown', (event) => {
    const hotspot = event.target instanceof Element ? event.target.closest('.sceneFrame .hotspot') : null;
    if (!hotspot) return;

    const layout = hotspot.closest('.immersiveLayout');
    if (!layout) return;

    const sceneKey = getSceneKey(layout);
    const seen = seenByScene.get(sceneKey) || new Set();
    seen.add(hotspot.getAttribute('aria-label') || hotspot.textContent || 'clue');
    seenByScene.set(sceneKey, seen);
    window.setTimeout(() => updateGate(true), 60);
  }, true);

  window.addEventListener('load', () => updateGate(true));
  window.addEventListener('resize', () => updateGate(true));
  window.setInterval(() => updateGate(false), 900);
})();
