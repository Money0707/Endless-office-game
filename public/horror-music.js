(() => {
  const TRACK_SRC = '/The_Iron_Latch.mp3';
  let context = null;
  let master = null;
  let track = null;
  let nodes = [];
  let timers = [];
  let started = false;
  let synthStarted = false;
  let enabled = true;

  function getContext() {
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextCtor) return null;
    if (!context) context = new AudioContextCtor();
    if (context.state === 'suspended') void context.resume();
    return context;
  }

  function tone(frequency, duration, gainValue, type = 'sine', delay = 0) {
    const ctx = getContext();
    if (!ctx || !master || !enabled || !synthStarted) return;

    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    const start = ctx.currentTime + delay;
    const end = start + duration;

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(gainValue, start + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    oscillator.connect(gain);
    gain.connect(master);
    oscillator.start(start);
    oscillator.stop(end + 0.04);
  }

  function makeDrone(ctx, frequency, gainValue, type = 'sine') {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gain.gain.value = gainValue;
    lfo.type = 'sine';
    lfo.frequency.value = 0.05 + Math.random() * 0.08;
    lfoGain.gain.value = 1.8 + Math.random() * 2.6;

    lfo.connect(lfoGain);
    lfoGain.connect(oscillator.frequency);
    oscillator.connect(gain);
    gain.connect(master);
    oscillator.start();
    lfo.start();
    nodes.push(oscillator, gain, lfo, lfoGain);
  }

  function startSynthFallback() {
    if (synthStarted || !enabled) return;
    const ctx = getContext();
    if (!ctx) return;

    synthStarted = true;
    master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, ctx.currentTime);
    master.gain.exponentialRampToValueAtTime(0.026, ctx.currentTime + 1.2);
    master.connect(ctx.destination);
    nodes.push(master);

    makeDrone(ctx, 31, 0.2, 'sine');
    makeDrone(ctx, 38.7, 0.13, 'triangle');
    makeDrone(ctx, 53.5, 0.045, 'sawtooth');

    timers.push(window.setInterval(() => {
      if (!enabled) return;
      tone(740 + Math.random() * 260, 0.035, 0.01, 'triangle');
      tone(46 + Math.random() * 14, 0.22, 0.022, 'sine', 0.05);
    }, 7200));

    timers.push(window.setInterval(() => {
      if (!enabled) return;
      tone(27, 0.18, 0.034, 'sine');
      tone(34, 0.2, 0.02, 'triangle', 0.24);
    }, 11800));
  }

  function stopSynthFallback() {
    timers.forEach((timer) => window.clearInterval(timer));
    timers = [];

    if (context && master) {
      const now = context.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), now);
      master.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
    }

    window.setTimeout(() => {
      nodes.forEach((node) => {
        try {
          if (typeof node.stop === 'function') node.stop();
        } catch {
          // Already stopped.
        }
        try {
          node.disconnect();
        } catch {
          // Already disconnected.
        }
      });
      nodes = [];
      master = null;
      synthStarted = false;
    }, 420);
  }

  function createTrack() {
    const audio = new Audio(TRACK_SRC);
    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = 0.46;
    audio.addEventListener('error', () => {
      if (enabled) startSynthFallback();
    }, { once: true });
    return audio;
  }

  function start() {
    if (started || !enabled) return;
    started = true;

    track = track || createTrack();
    track.currentTime = track.currentTime || 0;
    const playRequest = track.play();

    if (playRequest && typeof playRequest.catch === 'function') {
      playRequest.catch(() => {
        if (enabled) startSynthFallback();
      });
    }
  }

  function stop() {
    enabled = false;
    if (track) {
      track.pause();
    }
    stopSynthFallback();
    started = false;
  }

  function startIfAllowed() {
    if (!enabled) return;
    start();
  }

  document.addEventListener('pointerdown', (event) => {
    const target = event.target instanceof Element ? event.target.closest('button[aria-label="Toggle sound"]') : null;
    if (target) {
      enabled = !enabled;
      if (enabled) start();
      else stop();
      return;
    }
    startIfAllowed();
  }, true);

  document.addEventListener('keydown', startIfAllowed, true);
})();
