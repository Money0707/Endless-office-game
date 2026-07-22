(() => {
  const seenByScene = new Map();
  let lastSignature = '';

  const floorOneClues = [
    'No profile photo. No department. Sent from tomorrow.',
    'The time reads 11:59 PM. The notification refuses to disappear.',
    'Every desk is empty, but one chair is not pushed in.'
  ];

  function getSceneKey(layout) {
    const classes = Array.from(layout.classList).filter((name) => name.startsWith('scene-') || name.startsWith('theme-'));
    return classes.sort().join('|') || layout.className;
  }

  function isFloorOne(layout) {
    return layout.classList.contains('scene-floor1');
  }

  function getVisibleHotspots(layout) {
    return Array.from(layout.querySelectorAll('.sceneFrame .hotspot')).filter((button) => {
      const style = window.getComputedStyle(button);
      return style.display !== 'none' && style.visibility !== 'hidden' && button.getClientRects().length > 0;
    });
  }

  function setClueText(layout, text) {
    if (!isFloorOne(layout)) return;
    const clueBox = layout.querySelector('.typewriterNotice strong');
    if (!clueBox) return;
    clueBox.childNodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) node.textContent = '';
    });
    clueBox.insertBefore(document.createTextNode(text), clueBox.firstChild);
  }

  function ensureGateCard(panel, floorOne = false) {
    let card = panel.querySelector('.investigationGate');
    if (card) return card;

    card = document.createElement('section');
    card.className = 'investigationGate';
    card.setAttribute('aria-live', 'polite');
    card.innerHTML = floorOne ? `
      <p class="gateKicker">Notice What You Notice</p>
      <h3>Read the clue, then click the matching object.</h3>
      <p class="gateCopy">Start with the laptop. Each correct object reveals the next clue. The final choice appears after all clues are found.</p>
      <div class="gateProgress" aria-hidden="true"></div>
      <p class="gateCount"></p>
    ` : `
      <p class="gateKicker">Notice What You Notice</p>
      <h3>Click each eye icon to reveal the next clue.</h3>
      <p class="gateCopy">Read all clues in the image first. The final choice will appear after the room is fully noticed.</p>
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
    const floorOne = isFloorOne(layout);
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
    const signature = `${sceneKey}:${read}/${total}:${unlocked}:${floorOne}`;

    if (floorOne && !unlocked) {
      setClueText(layout, floorOneClues[Math.min(read, floorOneClues.length - 1)]);
    }

    if (!force && signature === lastSignature) return;
    lastSignature = signature;

    if (unlocked) {
      unlock(panel);
      return;
    }

    panel.classList.add('investigationLocked');
    const card = ensureGateCard(panel, floorOne);
    card.hidden = false;

    const count = card.querySelector('.gateCount');
    if (count) {
      count.textContent = floorOne
        ? `Clue ${Math.min(read + 1, total)} / ${total}. Click the object that matches the clue.`
        : `Clue ${Math.min(read + 1, total)} / ${total}. Click another eye icon.`;
    }

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
    window.setTimeout(() => updateGate(true), 80);
  }, true);

  window.addEventListener('load', () => updateGate(true));
  window.addEventListener('resize', () => updateGate(true));
  window.setInterval(() => updateGate(false), 900);
})();
