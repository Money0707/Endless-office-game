import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Eye, Maximize2, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { START_SCENE, introScreen, story, type OptionKey, type SceneId, type StoryScene } from './data/story';
import './styles.css';
import './overrides.css';

type RouteEntry = {
  scene: string;
  choice: string;
  result: string;
};

type AudioContextLike = AudioContext & {
  webkitAudioContext?: typeof AudioContext;
};

type SoundEvent = 'click' | 'observe' | 'progress' | 'loop' | 'bad' | 'true' | 'restart' | 'glass' | 'type';

const BAD_ENDING_LORE = [
  '其实，Unknown B 曾经也只是某间公司的普通员工。',
  '很多年前，他和你一样，在凌晨还独自留在办公室工作。电脑上出现了两个来源不明的讯息，而他在关键时刻做出了错误的选择：回复了当时的 Unknown。',
  '下一秒，系统完成了身份交换。',
  'USER SWAPPED\nYOU ARE NOW UNKNOWN B',
  '从那一刻开始，他的员工资料、名字和现实身份全部被抹除。他的意识被困在公司的虚拟系统里，只能以 Unknown B 的身份，通过电脑讯息寻找下一个替代者。',
  '他无法主动离开。',
  '唯一的逃脱方式，就是让另一名员工相信他、回应他，并自愿建立连接。只要有人回复，他就能夺取对方的身份，重新回到现实世界；而被替换的人，则会成为新的 Unknown。',
  '他等了很多年。',
  '办公室换过员工，系统更新过无数次，旧电脑被丢弃，新的电脑又重新连接服务器。他不断发送同一句话：',
  "HEY! I'M HELPING YOU!\nREPLY TO ME.",
  '直到那天晚上，“你”出现了。',
  '你以为 Unknown B 是在帮助你逃离办公室。你回复了他。',
  '屏幕上随即出现：',
  'UNKNOWN B: THANK YOU.\nUSER SWAPPED\nYOU ARE NOW UNKNOWN B',
  '真正的 Unknown B 终于取得了你的员工编号、面孔、记忆与身体。',
  '他以“你”的身份离开公司。隔天，同事们看见的仍然是熟悉的你。',
  '但电脑系统深处，你被困在没有出口的虚拟办公室里。时间永远停留在 11:59 PM。',
  '你终于明白，Unknown B 并不是在救你。',
  '他只是在找替补。',
  '而现在，你只能等待下一名独自加班的员工出现，然后发送那句你曾经收到过的话：',
  "HEY! I'M HELPING YOU!\nREPLY TO ME.",
  'IDENTITY TRANSFER COMPLETE\nPREVIOUS USER: RELEASED\nCURRENT USER: UNKNOWN B\nWAITING FOR NEXT CONNECTION...'
];

function App() {
  const [mode, setMode] = useState<'intro' | 'playing'>('intro');
  const [sceneId, setSceneId] = useState<SceneId>(START_SCENE);
  const [route, setRoute] = useState<RouteEntry[]>([]);
  const [soundOn, setSoundOn] = useState(false);
  const [observedClue, setObservedClue] = useState<string | null>(null);
  const [transitionKey, setTransitionKey] = useState(0);
  const [shattering, setShattering] = useState(false);
  const audioRef = useRef<{ context: AudioContext } | null>(null);

  const scene = story[sceneId];
  const isBadState = sceneId === 'badEnding' || sceneId === 'badEnding2' || sceneId.startsWith('scene');

  function ensureAudioContext() {
    const AudioContextCtor = window.AudioContext || (window as unknown as AudioContextLike).webkitAudioContext;
    if (!AudioContextCtor) return null;

    const context = audioRef.current?.context || new AudioContextCtor();
    if (context.state === 'suspended') {
      void context.resume();
    }
    audioRef.current = { context };
    return context;
  }

  function playTone(
    context: AudioContext,
    frequency: number,
    duration: number,
    gainValue: number,
    type: OscillatorType = 'sine',
    delay = 0
  ) {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const start = context.currentTime + delay;
    const end = start + duration;

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(gainValue, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(start);
    oscillator.stop(end + 0.02);
  }

  function playSound(event: SoundEvent, force = false) {
    if (!soundOn && !force) return;

    const context = ensureAudioContext();
    if (!context) return;

    if (event === 'type') {
      playTone(context, 820 + Math.random() * 140, 0.018, 0.006, 'square');
      return;
    }

    if (event === 'click') {
      playTone(context, 132, 0.055, 0.035, 'triangle');
      playTone(context, 72, 0.08, 0.025, 'sine');
      return;
    }

    if (event === 'observe') {
      playTone(context, 96, 0.055, 0.018, 'sine');
      playTone(context, 144, 0.05, 0.01, 'triangle', 0.035);
      return;
    }

    if (event === 'progress') {
      playTone(context, 88, 0.1, 0.026, 'sine');
      playTone(context, 132, 0.11, 0.018, 'triangle', 0.06);
      return;
    }

    if (event === 'loop' || event === 'bad') {
      playTone(context, event === 'bad' ? 42 : 54, 0.3, event === 'bad' ? 0.055 : 0.04, 'sine');
      playTone(context, 30, 0.34, 0.028, 'triangle', 0.04);
      return;
    }

    if (event === 'glass') {
      playTone(context, 740, 0.045, 0.012, 'triangle', 0.08);
      playTone(context, 1180, 0.035, 0.009, 'sine', 0.22);
      playTone(context, 920, 0.04, 0.008, 'triangle', 0.36);
      playTone(context, 1480, 0.026, 0.006, 'sine', 0.54);
      playTone(context, 166, 0.18, 0.012, 'sine', 0.7);
      return;
    }

    if (event === 'true') {
      playTone(context, 196, 0.14, 0.025, 'sine');
      playTone(context, 247, 0.16, 0.024, 'sine', 0.11);
      playTone(context, 330, 0.24, 0.022, 'triangle', 0.25);
      return;
    }

    if (event === 'restart') {
      playTone(context, 88, 0.12, 0.035, 'triangle');
    }
  }

  useEffect(() => {
    if (!soundOn || mode === 'intro') return;

    const AudioContextCtor = window.AudioContext || (window as unknown as AudioContextLike).webkitAudioContext;
    if (!AudioContextCtor) return;

    const context = audioRef.current?.context || new AudioContextCtor();
    const drone = context.createOscillator();
    const tremor = context.createOscillator();
    const gain = context.createGain();
    const tremorGain = context.createGain();

    drone.type = 'sine';
    drone.frequency.value = sceneId === 'trueEnding' ? 52 : 38 + (scene.floor || 1) * 3;
    tremor.type = 'triangle';
    tremor.frequency.value = sceneId === 'trueEnding' ? 2 : 4.5;
    gain.gain.value = sceneId === 'trueEnding' ? 0.01 : 0.018;
    tremorGain.gain.value = 0.008;

    tremor.connect(tremorGain);
    tremorGain.connect(gain.gain);
    drone.connect(gain);
    gain.connect(context.destination);
    drone.start();
    tremor.start();
    audioRef.current = { context };

    return () => {
      drone.stop();
      tremor.stop();
      drone.disconnect();
      tremor.disconnect();
      gain.disconnect();
      tremorGain.disconnect();
    };
  }, [soundOn, mode, sceneId, isBadState, scene.floor, transitionKey]);

  const status = useMemo(() => {
    if (mode === 'intro') return 'Shift not started';
    if (sceneId === 'trueEnding') return 'Escaped';
    if (isBadState) return 'Time loop detected';
    return `Floor ${scene.floor} / 5`;
  }, [mode, scene, sceneId, isBadState]);

  function beginShift() {
    playSound('progress');
    setMode('playing');
    setSceneId(START_SCENE);
    setRoute([]);
    setObservedClue(null);
    setTransitionKey((value) => value + 1);
  }

  function choose(key: OptionKey) {
    const option = scene.options.find((item) => item.key === key);
    const outcome = scene.outcomes[key];
    if (!option || !outcome) return;

    if (outcome.nextId === 'restart') {
      playSound('restart');
      restart();
      return;
    }

    playSound(outcome.result === 'bad' ? 'bad' : outcome.result === 'true' ? 'true' : outcome.result === 'loop' ? 'loop' : 'progress');

    setRoute((current) => [
      ...current,
      {
        scene: scene.title,
        choice: `${option.key}. ${option.label}`,
        result: outcome.result
      }
    ]);

    if (outcome.result === 'restart' && outcome.nextId === START_SCENE) {
      playSound('glass');
      setShattering(true);
      setObservedClue(outcome.text);
      window.setTimeout(() => {
        setSceneId(START_SCENE);
        setObservedClue(null);
        setTransitionKey((value) => value + 1);
        setShattering(false);
      }, 2400);
      return;
    }

    setSceneId(outcome.nextId);
    setObservedClue(outcome.text);
    setTransitionKey((value) => value + 1);
  }

  function restart() {
    playSound('restart');
    setMode('intro');
    setSceneId(START_SCENE);
    setRoute([]);
    setObservedClue(null);
    setShattering(false);
    setTransitionKey((value) => value + 1);
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
      return;
    }
    document.exitFullscreen?.();
  }

  function toggleSound() {
    const nextSoundState = !soundOn;
    setSoundOn(nextSoundState);
    if (nextSoundState) {
      const context = ensureAudioContext();
      if (context) {
        playTone(context, 176, 0.08, 0.03, 'triangle');
        playTone(context, 220, 0.1, 0.024, 'sine', 0.08);
      }
    }
  }

  return (
    <main className={`gameShell ${isBadState ? 'dangerMode' : ''}`}>
      <div className="noiseLayer" />
      <div className="scanlineLayer" />
      <div className="fogLayer" />
      {shattering && <GlassShatter />}

      <header className="gameHeader">
        <div>
          <p className="kicker">Office</p>
          <h1>The Endless Shift</h1>
        </div>
        <div className="headerActions">
          <span className="status">{status}</span>
          <button className="iconButton" onClick={toggleSound} aria-label="Toggle sound">
            {soundOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
          <button className="iconButton" onClick={toggleFullscreen} aria-label="Fullscreen">
            <Maximize2 size={18} />
          </button>
        </div>
      </header>

      {mode === 'intro' && <OpeningScreen onBegin={beginShift} />}
      {mode === 'playing' && (
        <GameScene
          key={transitionKey}
          scene={scene}
          observedClue={observedClue}
          onObserve={setObservedClue}
          onPlaySound={playSound}
          onChoose={choose}
          onRestart={restart}
        />
      )}
    </main>
  );
}

function GlassShatter() {
  return (
    <div className="glassShatter" aria-hidden="true">
      {Array.from({ length: 22 }, (_, index) => (
        <span key={index} />
      ))}
    </div>
  );
}

function OpeningScreen({ onBegin }: { onBegin: () => void }) {
  return (
    <section className="openingScreen glitchIn">
      <SceneIllustration sceneClass="introRoom" hotspots={[]} />
      <article className="openingOverlay">
        <p className="kicker">{introScreen.eyebrow}</p>
        <h2>{introScreen.title}</h2>
        <div className="openingBeats" aria-label="Opening story">
          {introScreen.beats.map((beat) => (
            <span key={beat}>{beat}</span>
          ))}
        </div>
        <Terminal lines={introScreen.terminal} />
        <button className="primaryButton" onClick={onBegin}>
          {introScreen.button}
        </button>
      </article>
    </section>
  );
}

function GameScene({
  scene,
  observedClue,
  onObserve,
  onChoose,
  onRestart,
  onPlaySound
}: {
  scene: StoryScene;
  observedClue: string | null;
  onObserve: (clue: string) => void;
  onChoose: (key: OptionKey) => void;
  onRestart: () => void;
  onPlaySound: (event: SoundEvent) => void;
}) {
  const isEnding = scene.id === 'trueEnding';
  const isBadEnding2 = scene.id === 'badEnding2';
  const noticeText = observedClue || scene.description;
  const [typedNotice, setTypedNotice] = useState('');
  const [showBadEndingLore, setShowBadEndingLore] = useState(false);

  useEffect(() => {
    setShowBadEndingLore(false);
  }, [scene.id]);

  useEffect(() => {
    setTypedNotice('');
    let index = 0;
    const timer = window.setInterval(() => {
      index += 1;
      setTypedNotice(noticeText.slice(0, index));
      const typedChar = noticeText[index - 1];
      if (typedChar && typedChar.trim() && index % 2 === 0) {
        onPlaySound('type');
      }
      if (index >= noticeText.length) {
        window.clearInterval(timer);
      }
    }, 22);

    return () => window.clearInterval(timer);
  }, [noticeText, onPlaySound]);

  return (
    <section className={`immersiveLayout glitchIn theme-${scene.image} scene-${scene.id} ${isEnding ? 'endingLayout' : ''}`}>
      <div className="sceneFrame">
        <SceneIllustration sceneClass={scene.image} hotspots={scene.hotspots} onObserve={onObserve} onPlaySound={onPlaySound} />
        <div className="sceneHud">
          <div>
            <p className="kicker">{scene.floor ? `Floor ${scene.floor}` : scene.location}</p>
            <h2>{scene.title}</h2>
          </div>
        </div>
        <div className="objectiveBox typewriterNotice" aria-live="polite">
          <p className="kicker">What You Notice</p>
          <strong>
            {typedNotice}
            <span className="typewriterCursor" aria-hidden="true">_</span>
          </strong>
        </div>
      </div>

      <aside className="actionPanel">
        <ProgressIndicator scene={scene} />
        <Terminal lines={scene.terminal} />

        {scene.options.length > 0 && <p className="choicesKicker">WHAT WILL YOU DO</p>}
        <div className="choicesList">
          {scene.options.map((option) => (
            <button className="choiceButton" key={option.key} onClick={() => onChoose(option.key)}>
              <span className="choiceKey">{option.key}</span>
              <strong>{option.label}</strong>
            </button>
          ))}
        </div>

        {isBadEnding2 && (
          <button
            className="secondaryButton loreButton"
            onClick={() => {
              onPlaySound('observe');
              setShowBadEndingLore((value) => !value);
            }}
          >
            故事核心设定
          </button>
        )}

        {isBadEnding2 && showBadEndingLore && <BadEndingLore />}

        {isEnding && (
          <button className="secondaryButton" onClick={onRestart}>
            <RotateCcw size={17} />
            Opening Screen
          </button>
        )}
      </aside>
    </section>
  );
}

function BadEndingLore() {
  return (
    <article className="badEndingLore" aria-label="Bad ending story lore">
      <p className="choicesKicker">IDENTITY FILE</p>
      {BAD_ENDING_LORE.map((line) => (
        <p className={line.includes('\n') ? 'loreTerminal' : ''} key={line}>
          {line.split('\n').map((part) => (
            <React.Fragment key={part}>
              {part}
              <br />
            </React.Fragment>
          ))}
        </p>
      ))}
    </article>
  );
}

function ProgressIndicator({ scene }: { scene: StoryScene }) {
  const activeFloor = scene.floor ?? (scene.id === 'trueEnding' ? 5 : 0);

  return (
    <div className="progressTrack" aria-label="Progress indicator">
      {[1, 2, 3, 4, 5].map((floor) => (
        <span className={floor <= activeFloor ? 'active' : ''} key={floor} aria-label={`Step ${floor}`} />
      ))}
    </div>
  );
}

function SceneIllustration({
  sceneClass,
  hotspots,
  onObserve,
  onPlaySound
}: {
  sceneClass: string;
  hotspots: StoryScene['hotspots'];
  onObserve?: (clue: string) => void;
  onPlaySound?: (event: SoundEvent) => void;
}) {
  return (
    <div className={`sceneIllustration ${sceneClass}`} aria-label="Horror office scene">
      <div className="ceilingLight" />
      <div className="backWall">
        <div className="windowBand" />
        <div className="exitGlow">EXIT</div>
      </div>
      <div className="floorPlane" />
      <div className="deskSet">
        <div className="monitor mainMonitor">
          <span />
        </div>
        <div className="keyboard" />
        <div className="coffeeCup" />
      </div>
      <div className="leftCubicle" />
      <div className="rightCubicle" />
      <div className="chairShape" />
      <div className="printerProp" />
      <div className="conferenceTable" />
      <div className="cameraWall" />
      <div className="phoneProp" />
      <div className="auditWall" />
      <div className="managerDesk" />
      <div className="elevatorDoors" />
      <div className="humanShape humanOne" />
      <div className="humanShape humanTwo" />
      <div className="paperTrail" />
      <div className="sceneGlitch" />
      {hotspots.map((hotspot, index) => (
        <button
          className={`hotspot hotspot${index + 1}`}
          key={hotspot.id}
          onClick={() => {
            onPlaySound?.('observe');
            onObserve?.(hotspot.clue);
          }}
          aria-label={hotspot.label}
        >
          <Eye size={15} />
          <span>{hotspot.label}</span>
        </button>
      ))}
    </div>
  );
}

function Terminal({ lines }: { lines: string[] }) {
  return (
    <div className="terminalBox">
      {lines.map((line) => (
        <span key={line}>{line}</span>
      ))}
    </div>
  );
}

createRoot(document.getElementById('root') as HTMLElement).render(<App />);
