import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Eye, Maximize2, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { START_SCENE, introScreen, story, type OptionKey, type SceneId, type StoryScene } from './data/story';
import './styles.css';
import './overrides.css';
import './clean-overrides.css';

type RouteEntry = {
  scene: string;
  choice: string;
  result: string;
};

type AudioContextLike = AudioContext & {
  webkitAudioContext?: typeof AudioContext;
};

type SoundEvent =
  | 'click'
  | 'observe'
  | 'progress'
  | 'loop'
  | 'bad'
  | 'true'
  | 'restart'
  | 'glass'
  | 'type'
  | 'message'
  | 'buzz'
  | 'heartbeat';

type LorePage = {
  eyebrow: string;
  title: string;
  body: string[];
  terminal?: string[];
  image?: string;
};

type LoreSegment = {
  type: 'body' | 'terminal';
  text: string;
};

const badEndingLorePages: LorePage[] = [
  {
    eyebrow: 'Story Core Setting',
    title: 'Unknown B Was Once Like You',
    image: '/story-core-1.png',
    body: [
      'Unknown B was once an ordinary employee at this company.',
      'Years ago, he stayed alone in the office after midnight, just like you. Two messages from unknown sources appeared on his computer. At the critical moment, he made the wrong choice: he replied.',
    ],
  },
  {
    eyebrow: 'The Swap',
    title: 'One Reply Changed Everything',
    image: '/story-core-2.png',
    body: [
      'The next second, the system completed an identity exchange.',
      'His employee file, name, face, and real-world identity were erased. His consciousness was trapped inside the company system.',
    ],
    terminal: ['USER SWAPPED', 'YOU ARE NOW UNKNOWN B'],
  },
  {
    eyebrow: 'The Rule',
    title: 'He Could Not Leave',
    image: '/story-core-3.png',
    body: [
      'From that moment on, he could only exist as Unknown B, sending messages through office computers and searching for someone to replace him.',
      'There was only one way out: another employee had to trust him, reply to him, and willingly create a connection.',
    ],
  },
  {
    eyebrow: 'The Trap',
    title: 'A New Body For An Old Prisoner',
    image: '/story-core-4.png',
    body: [
      'If someone replied, he could take their identity and return to the real world. The person who answered would become the new Unknown.',
      'He waited for years. Employees changed, systems updated, old laptops were thrown away, and new ones connected to the same server.',
    ],
  },
  {
    eyebrow: 'The Message',
    title: 'The Same Line, Again And Again',
    image: '/story-core-5.png',
    body: [
      'He kept sending the same message, night after night, waiting for one tired employee to believe him.',
    ],
    terminal: ["HEY! I'M HELPING YOU!", 'REPLY TO ME.'],
  },
  {
    eyebrow: 'That Night',
    title: 'Then You Appeared',
    image: '/story-core-6.png',
    body: [
      'You thought Unknown B was helping you escape the office. You replied to him.',
      'The screen answered immediately.',
    ],
    terminal: ['UNKNOWN B: THANK YOU.', 'USER SWAPPED', 'YOU ARE NOW UNKNOWN B'],
  },
  {
    eyebrow: 'The Reveal',
    title: 'He Was Never Saving You',
    image: '/story-core-7.png',
    body: [
      'The real Unknown B finally obtained your employee number, your face, your memories, and your body.',
      'He left the company wearing your identity. The next day, your coworkers still saw the same familiar person.',
    ],
  },
  {
    eyebrow: 'The New Unknown',
    title: 'Now You Wait',
    body: [
      'Deep inside the computer system, you are trapped in a virtual office with no exit. Time is frozen at 11:59 PM.',
      'Now you understand: Unknown B was not trying to save you. He was looking for a replacement.',
    ],
    terminal: [
      'IDENTITY TRANSFER COMPLETE',
      'PREVIOUS USER: RELEASED',
      'CURRENT USER: UNKNOWN B',
      'WAITING FOR NEXT CONNECTION...',
    ],
  },
];

const loreSegments = (page: LorePage): LoreSegment[] => [
  ...page.body.map((text) => ({ type: 'body' as const, text })),
  ...(page.terminal?.map((text) => ({ type: 'terminal' as const, text })) ?? []),
];

const TYPEWRITER_SPEED_MS = 28;

const clickSound = () => playSound('click');
const observeSound = () => playSound('observe');
const progressSound = () => playSound('progress');
const loopSound = () => playSound('loop');
const badSound = () => playSound('bad');
const trueSound = () => playSound('true');
const restartSound = () => playSound('restart');

const playSound = (event: SoundEvent) => {
  window.dispatchEvent(new CustomEvent('office-sound', { detail: event }));
};

const App = () => {
  const [sceneId, setSceneId] = useState<SceneId>(START_SCENE);
  const [history, setHistory] = useState<RouteEntry[]>([]);
  const [muted, setMuted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [started, setStarted] = useState(false);
  const [typedNotice, setTypedNotice] = useState('');
  const [displayNotice, setDisplayNotice] = useState('');
  const [typeTick, setTypeTick] = useState(0);
  const [loreOpen, setLoreOpen] = useState(false);
  const [lorePage, setLorePage] = useState(0);
  const [loreTyped, setLoreTyped] = useState('');
  const [loreTick, setLoreTick] = useState(0);
  const audioRef = useRef<AudioContextLike | null>(null);
  const bgRef = useRef<{ oscillators: OscillatorNode[]; gain: GainNode } | null>(null);
  const scene = story[sceneId];
  const currentLorePage = badEndingLorePages[lorePage];
  const currentLoreSegments = useMemo(() => loreSegments(currentLorePage), [currentLorePage]);
  const currentLoreText = useMemo(
    () => currentLoreSegments.map((segment) => segment.text).join('\n'),
    [currentLoreSegments]
  );

  const initAudio = () => {
    if (!audioRef.current) {
      const AudioCtor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioRef.current = new AudioCtor() as AudioContextLike;
    }

    if (audioRef.current.state === 'suspended') {
      audioRef.current.resume();
    }
  };

  const playTone = (frequency: number, duration = 0.12, type: OscillatorType = 'sine', volume = 0.04) => {
    if (muted) return;
    initAudio();
    const ctx = audioRef.current;
    if (!ctx) return;

    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + duration);
  };

  const playNoise = (duration = 0.18, volume = 0.05) => {
    if (muted) return;
    initAudio();
    const ctx = audioRef.current;
    if (!ctx) return;

    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i += 1) {
      output[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const noise = ctx.createBufferSource();
    const gain = ctx.createGain();
    gain.gain.value = volume;
    noise.buffer = buffer;
    noise.connect(gain);
    gain.connect(ctx.destination);
    noise.start();
  };

  const startBackground = () => {
    if (muted || bgRef.current) return;
    initAudio();
    const ctx = audioRef.current;
    if (!ctx) return;

    const gain = ctx.createGain();
    gain.gain.value = 0.012;
    const oscillators = [36, 43, 51].map((frequency) => {
      const oscillator = ctx.createOscillator();
      oscillator.type = 'sawtooth';
      oscillator.frequency.value = frequency;
      oscillator.connect(gain);
      oscillator.start();
      return oscillator;
    });
    gain.connect(ctx.destination);
    bgRef.current = { oscillators, gain };
  };

  const stopBackground = () => {
    bgRef.current?.oscillators.forEach((oscillator) => oscillator.stop());
    bgRef.current?.gain.disconnect();
    bgRef.current = null;
  };

  useEffect(() => {
    const listener = (event: Event) => {
      const soundEvent = (event as CustomEvent<SoundEvent>).detail;
      if (soundEvent === 'click') playTone(680, 0.07, 'square', 0.025);
      if (soundEvent === 'observe') {
        playTone(330, 0.09, 'triangle', 0.02);
        playTone(110, 0.18, 'sine', 0.018);
      }
      if (soundEvent === 'progress') {
        playTone(490, 0.12, 'triangle', 0.03);
        setTimeout(() => playTone(735, 0.1, 'triangle', 0.025), 90);
      }
      if (soundEvent === 'loop') {
        playTone(90, 0.3, 'sawtooth', 0.04);
        playNoise(0.22, 0.035);
      }
      if (soundEvent === 'bad') {
        playNoise(0.45, 0.07);
        playTone(58, 0.8, 'sawtooth', 0.055);
      }
      if (soundEvent === 'true') {
        playTone(220, 0.16, 'sine', 0.025);
        setTimeout(() => playTone(330, 0.22, 'sine', 0.02), 120);
      }
      if (soundEvent === 'restart') playTone(180, 0.16, 'square', 0.03);
      if (soundEvent === 'glass') playNoise(0.28, 0.04);
      if (soundEvent === 'type') {
        playTone(520 + Math.random() * 120, 0.028, 'square', 0.009);
      }
      if (soundEvent === 'message') {
        playTone(880, 0.08, 'triangle', 0.025);
        setTimeout(() => playTone(660, 0.08, 'triangle', 0.02), 90);
      }
      if (soundEvent === 'buzz') {
        playTone(72, 0.35, 'sawtooth', 0.035);
        playNoise(0.2, 0.025);
      }
      if (soundEvent === 'heartbeat') {
        playTone(48, 0.11, 'sine', 0.04);
        setTimeout(() => playTone(44, 0.16, 'sine', 0.032), 150);
      }
    };

    window.addEventListener('office-sound', listener);
    return () => window.removeEventListener('office-sound', listener);
  }, [muted]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('office-muted', { detail: muted }));
    if (muted) {
      stopBackground();
    } else if (started) {
      startBackground();
    }
  }, [muted, started]);

  useEffect(() => {
    setLoreOpen(false);
    setLorePage(0);
    if (!started) return;
    setDisplayNotice(scene.description);
    setTypedNotice('');
    setTypeTick((tick) => tick + 1);
    if (scene.result === 'bad') badSound();
    else if (scene.result === 'true') trueSound();
    else if (scene.result === 'loop') loopSound();
    else if (scene.id === 'floor2') playSound('message');
  }, [sceneId, started]);

  useEffect(() => {
    if (!started) return;
    const tick = typeTick;
    setTypedNotice('');
    let index = 0;
    const timer = window.setInterval(() => {
      index += 1;
      if (index % 2 === 0) playSound('type');
      setTypedNotice(displayNotice.slice(0, index));
      if (index >= displayNotice.length || tick !== typeTick) {
        window.clearInterval(timer);
      }
    }, TYPEWRITER_SPEED_MS);

    return () => window.clearInterval(timer);
  }, [displayNotice, typeTick, started]);

  useEffect(() => {
    if (!loreOpen) return;
    setLoreTyped('');
    setLoreTick((tick) => tick + 1);
  }, [loreOpen, lorePage, currentLoreText]);

  useEffect(() => {
    if (!loreOpen) return;
    const tick = loreTick;
    let index = 0;
    const timer = window.setInterval(() => {
      index += 1;
      if (index % 2 === 0) playSound('type');
      setLoreTyped(currentLoreText.slice(0, index));
      if (index >= currentLoreText.length || tick !== loreTick) {
        window.clearInterval(timer);
      }
    }, TYPEWRITER_SPEED_MS);

    return () => window.clearInterval(timer);
  }, [currentLoreText, loreTick, loreOpen]);

  const choose = (key: OptionKey) => {
    clickSound();
    const outcome = scene.outcomes[key];
    setHistory((prev) => [
      ...prev,
      {
        scene: scene.title,
        choice: scene.options.find((option) => option.key === key)?.label ?? key,
        result: outcome.result,
      },
    ]);
    setSceneId(outcome.nextId);
  };

  const observe = (label: string, note: string) => {
    observeSound();
    setDisplayNotice(note);
    setTypeTick((tick) => tick + 1);
  };

  const reset = () => {
    restartSound();
    setSceneId(START_SCENE);
    setHistory([]);
    setStarted(false);
    setDisplayNotice('');
    setTypedNotice('');
    setLoreOpen(false);
    setLorePage(0);
  };

  const begin = () => {
    clickSound();
    initAudio();
    setStarted(true);
    startBackground();
    setDisplayNotice(story[START_SCENE].description);
    setTypeTick((tick) => tick + 1);
  };

  const toggleFullscreen = () => {
    clickSound();
    setFullscreen((value) => !value);
  };

  const openLore = () => {
    clickSound();
    setLorePage(0);
    setLoreOpen(true);
  };

  const closeLore = () => {
    clickSound();
    setLoreOpen(false);
    setLorePage(0);
  };

  const nextLore = () => {
    clickSound();
    setLorePage((page) => Math.min(page + 1, badEndingLorePages.length - 1));
  };

  const prevLore = () => {
    clickSound();
    if (lorePage === 0) {
      closeLore();
      return;
    }
    setLorePage((page) => Math.max(page - 1, 0));
  };

  const renderLorePageText = () => {
    let cursor = 0;
    return currentLoreSegments.map((segment, index) => {
      const start = cursor;
      const end = cursor + segment.text.length;
      cursor = end + 1;
      const visible = loreTyped.slice(start, Math.min(end, loreTyped.length));
      const key = `${segment.type}-${index}-${segment.text}`;
      if (segment.type === 'terminal') {
        return <code key={key}>{visible}</code>;
      }
      return <p key={key}>{visible}</p>;
    });
  };

  const renderScene = (sceneData: StoryScene) => (
    <section className={`sceneFrame scene-${sceneData.id}`}>
      <div className={`sceneIllustration ${sceneData.image}`}>
        <div className="sceneGlitch" />
        {sceneData.hotspots.map((hotspot, index) => (
          <button
            key={hotspot.label}
            className={`hotspot hotspot${index + 1}`}
            style={{ left: hotspot.x, top: hotspot.y }}
            onClick={() => observe(hotspot.label, hotspot.note)}
          >
            <Eye size={14} />
            <span>{hotspot.label}</span>
          </button>
        ))}
        <div className="sceneHud">
          <p className="kicker">Floor {sceneData.floor}</p>
          <h2>{sceneData.title}</h2>
        </div>
        <div className="timeBadge">{sceneData.timestamp}</div>
        <div className="ambientReadout">{sceneData.ambient}</div>
        <div className="typewriterNotice">
          <p className="kicker">What you notice</p>
          <strong>
            {typedNotice}
            {typedNotice.length < displayNotice.length ? <span className="typewriterCursor">_</span> : null}
          </strong>
        </div>
      </div>
    </section>
  );

  const renderLore = () => (
    <div className="badEndingLore">
      <article className="lorePage" key={lorePage}>
        {currentLorePage.image ? (
          <img className="loreImage" src={currentLorePage.image} alt={`${currentLorePage.title} illustration`} />
        ) : null}
        <p className="choicesKicker">{currentLorePage.eyebrow}</p>
        <h3>{currentLorePage.title}</h3>
        <div className="loreTypedText">{renderLorePageText()}</div>
        {currentLorePage.terminal ? <pre className="terminalBox loreTerminal">{renderLorePageText().filter((_, index) => currentLoreSegments[index]?.type === 'terminal')}</pre> : null}
      </article>
      <div className="loreControls">
        <button className="secondaryButton" onClick={prevLore}>{lorePage === 0 ? 'Close' : 'Back'}</button>
        <span>{lorePage + 1} / {badEndingLorePages.length}</span>
        <button className="secondaryButton" onClick={nextLore} disabled={lorePage === badEndingLorePages.length - 1}>Next</button>
      </div>
    </div>
  );

  if (!started) {
    return (
      <main className="appShell introMode">
        <section className="introPanel">
          <p className="kicker">{introScreen.eyebrow}</p>
          <h1>{introScreen.title}</h1>
          <p>{introScreen.body}</p>
          <div className="terminalBox">
            {introScreen.terminal.map((line) => <code key={line}>{line}</code>)}
          </div>
          <button className="primaryButton" onClick={begin}>Start</button>
        </section>
      </main>
    );
  }

  return (
    <main className={`appShell ${fullscreen ? 'fullscreenMode' : ''}`}>
      <header className="topBar">
        <div>
          <p className="kicker">Office</p>
          <h1>The Endless Shift</h1>
        </div>
        <div className="statusCluster">
          <span>Floor {scene.floor} / 5</span>
          <button aria-label={muted ? 'Unmute' : 'Mute'} onClick={() => setMuted((value) => !value)}>
            {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <button aria-label="Toggle fullscreen" onClick={toggleFullscreen}><Maximize2 size={18} /></button>
        </div>
      </header>

      <div className="immersiveLayout">
        {renderScene(scene)}

        <aside className={`actionPanel ${loreOpen ? 'storybookMode' : ''}`}>
          {loreOpen ? renderLore() : (
            <>
              <div className="progressTrack">
                {[1, 2, 3, 4, 5].map((floor) => (
                  <span key={floor} className={floor === scene.floor ? 'active' : ''}>{floor}</span>
                ))}
              </div>

              {scene.terminal.length ? (
                <div className="terminalBox">
                  {scene.terminal.map((line) => <code key={line}>{line}</code>)}
                </div>
              ) : null}

              {scene.result === 'bad' || scene.result === 'true' ? (
                <button className="secondaryButton" onClick={reset}><RotateCcw size={16} /> Restart loop</button>
              ) : null}

              {scene.id === 'badEnding2' ? (
                <button className="secondaryButton loreButton" onClick={openLore}>Story Core Setting</button>
              ) : null}

              {scene.options.length ? <p className="choicesKicker">What will you do</p> : null}
              <div className="choicesList">
                {scene.options.map((option) => (
                  <button key={option.key} className="choiceButton" onClick={() => choose(option.key)}>
                    <span className="choiceKey">{option.key}</span>
                    <span>{option.label}</span>
                    <span aria-hidden>›</span>
                  </button>
                ))}
              </div>

              <div className="pathLog">
                <p className="choicesKicker">Path</p>
                {history.length ? history.map((entry, index) => (
                  <p key={`${entry.scene}-${index}`}>
                    {index + 1}. {entry.scene}: {entry.choice} — {entry.result}
                  </p>
                )) : <p>No choices recorded.</p>}
              </div>
            </>
          )}
        </aside>
      </div>
    </main>
  );
};

createRoot(document.getElementById('root')!).render(<App />);
