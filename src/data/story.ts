export type SceneId =
  | 'floor1'
  | 'floor2'
  | 'floor3'
  | 'floor4'
  | 'floor5'
  | 'sceneA'
  | 'sceneB'
  | 'sceneC'
  | 'sceneD'
  | 'badEnding'
  | 'badEnding2'
  | 'trueEnding';

export type OptionKey = 'A' | 'B' | 'C' | 'D';

export type StoryOption = {
  key: OptionKey;
  label: string;
};

export type StoryOutcome = {
  nextId: SceneId | 'restart';
  result: 'progress' | 'loop' | 'bad' | 'true' | 'restart';
  text: string;
};

export type Hotspot = {
  id: string;
  label: string;
  clue: string;
};

export type StoryScene = {
  id: SceneId;
  title: string;
  description: string;
  image: string;
  options: StoryOption[];
  outcomes: Partial<Record<OptionKey, StoryOutcome>>;
  floor?: number;
  location: string;
  timestamp: string;
  ambient: string;
  terminal: string[];
  hotspots: Hotspot[];
};

export const START_SCENE: SceneId = 'floor1';

export const introScreen = {
  eyebrow: 'Monday / QA Department / 11:59 PM',
  title: 'Office: The Endless Shift',
  terminal: ['FINAL AUDIT COMPLETE', 'NEW MESSAGE RECEIVED', '11:59 PM'],
  button: 'Start',
  beats: [
    'Due to the workload, you are still in the office.',
    'All audits, pending tasks, and pending projects are finally done.',
    'You are about to close your laptop.'
  ]
};

export const story: Record<SceneId, StoryScene> = {
  floor1: {
    id: 'floor1',
    floor: 1,
    title: 'The Message',
    description:
      'You are about to close your laptop, but a message notification appears. The laptop clock shows 11:59 PM.',
    image: 'messageRoom',
    location: 'QA Department',
    timestamp: '11:59 PM',
    ambient: 'laptop fan / empty office / notification chime',
    terminal: ['USER: UNKNOWN A', 'SENT: TOMORROW 12:04 AM', 'MESSAGE RECEIVED'],
    options: [
      { key: 'A', label: 'Open the message' },
      { key: 'B', label: 'Delete the message' },
      { key: 'C', label: 'Ignore it and close laptop' }
    ],
    outcomes: {
      A: { nextId: 'floor2', result: 'progress', text: 'The message opens into a chat window.' },
      B: { nextId: 'sceneA', result: 'loop', text: 'The floor goes dark.' },
      C: { nextId: 'sceneA', result: 'loop', text: 'The floor goes dark.' }
    },
    hotspots: [
      { id: 'laptop', label: 'Laptop', clue: 'The time reads 11:59 PM. The notification refuses to disappear.' },
      { id: 'sender', label: 'Unknown A', clue: 'No profile photo. No department. Sent from tomorrow.' },
      { id: 'floor', label: 'Dark office', clue: 'Every desk is empty, but one chair is not pushed in.' }
    ]
  },
  floor2: {
    id: 'floor2',
    floor: 2,
    title: 'The Unknown A Message',
    description: 'The message is from Unknown A. It asks: Are you still there? The typing indicator keeps blinking.',
    image: 'chatRoom',
    location: 'QA Department',
    timestamp: '12:08 AM',
    ambient: 'typing indicator / monitor buzz / distant Teams ping',
    terminal: ['UNKNOWN A: ARE YOU STILL THERE?', 'TYPING...', '12:08 AM'],
    options: [
      { key: 'A', label: 'Reply: Who are you?' },
      { key: 'B', label: 'Ignore it and close laptop' },
      { key: 'C', label: 'Block the user' }
    ],
    outcomes: {
      A: { nextId: 'floor3', result: 'progress', text: 'The typing stops. A light turns on down the corridor.' },
      B: { nextId: 'sceneA', result: 'loop', text: 'The office cuts to black.' },
      C: { nextId: 'sceneB', result: 'loop', text: 'The screen fills with accusations.' }
    },
    hotspots: [
      { id: 'typing', label: 'Typing box', clue: 'The dots continue even after you disconnect from Wi-Fi.' },
      { id: 'message', label: 'Message', clue: '"Are you still there?" appears before the clock reaches 12:08.' },
      { id: 'keyboard', label: 'Keyboard', clue: 'Your draft reply is already typed: Who are you?' }
    ]
  },
  floor3: {
    id: 'floor3',
    floor: 3,
    title: 'The Meeting Room',
    description:
      'Meeting Room C is marked empty, but several faceless people sit around the table with scorecards showing your name.',
    image: 'calibrationRoom',
    location: 'Meeting Room C',
    timestamp: '12:23 AM',
    ambient: 'fluorescent buzz / paper shuffle / no footsteps',
    terminal: ['MONTHLY SCORECARD', 'EMPLOYEE: YOU', 'ROOM OCCUPANCY: 0'],
    options: [
      { key: 'A', label: 'Choose highest score: 100%' },
      { key: 'B', label: 'Choose lowest score: 71%' },
      { key: 'C', label: 'Ignore and leave' },
      { key: 'D', label: 'Review the evidence first' }
    ],
    outcomes: {
      A: { nextId: 'sceneC', result: 'loop', text: 'Every score becomes 0%.' },
      B: { nextId: 'sceneC', result: 'loop', text: 'Every score becomes 0%.' },
      C: { nextId: 'sceneA', result: 'loop', text: 'The floor goes dark before you reach the door.' },
      D: { nextId: 'floor4', result: 'progress', text: 'The figures vanish. One confidential audit file remains.' }
    },
    hotspots: [
      { id: 'figures', label: 'Hidden faces', clue: 'Some look down. Some read audit reports. None cast a shadow.' },
      { id: 'scorecard', label: 'Scorecards', clue: 'Score A: 98%. Score B: 83%. Score C: 71%. Score D: 100%.' },
      { id: 'booking', label: 'Room panel', clue: 'Meeting Room C. Status: EMPTY. Current Occupancy: 0.' }
    ]
  },
  floor4: {
    id: 'floor4',
    floor: 4,
    title: 'The Audit File',
    description:
      'The meeting room is empty. One thick brown folder remains on the table, stamped CONFIDENTIAL with a note: Pass to Manager.',
    image: 'auditFileRoom',
    location: 'Meeting Room C',
    timestamp: '12:41 AM',
    ambient: 'projector cooling / paper folder scrape / empty chairs',
    terminal: ['CONFIDENTIAL', 'PASS TO MANAGER', 'DO NOT OPEN'],
    options: [
      { key: 'A', label: 'Open it' },
      { key: 'B', label: 'Ignore it' },
      { key: 'C', label: "Take it to Manager's desk" }
    ],
    outcomes: {
      A: { nextId: 'sceneD', result: 'loop', text: 'The printer starts by itself.' },
      B: { nextId: 'sceneA', result: 'loop', text: 'The floor goes dark.' },
      C: { nextId: 'floor5', result: 'progress', text: 'The manager laptop powers on by itself.' }
    },
    hotspots: [
      { id: 'folder', label: 'Brown folder', clue: 'Stamped CONFIDENTIAL. The stamp ink is still wet.' },
      { id: 'note', label: 'Attached note', clue: 'Pass to Manager. The handwriting looks almost like yours.' },
      { id: 'chairs', label: 'Missing chairs', clue: 'The chairs are gone. Their marks remain on the carpet.' }
    ]
  },
  floor5: {
    id: 'floor5',
    floor: 5,
    title: "The Manager's Desk",
    description:
      'You place the confidential file on the manager desk. The laptop powers on: Last Login Tomorrow 06:15 AM.',
    image: 'managerRoom',
    location: "Manager's Workstation",
    timestamp: '11:57 PM',
    ambient: 'clock ticking backward / laptop boot / silent air-conditioning',
    terminal: [
      'LAST LOGIN: TOMORROW 06:15 AM',
      'UNKNOWN A: CHECK THE CLOCK',
      'LOOK BEHIND THE PHOTO FRAME',
      "UNKNOWN B: HEY! I'M HELPING YOU! REPLY TO ME."
    ],
    options: [
      { key: 'A', label: 'Reply Unknown A' },
      { key: 'B', label: 'Ignore both and leave' },
      { key: 'C', label: 'Reply Unknown B' }
    ],
    outcomes: {
      A: { nextId: 'floor1', result: 'restart', text: 'Unknown A pulls the loop back to 11:59 PM.' },
      B: { nextId: 'trueEnding', result: 'true', text: 'You ignore both messages and leave.' },
      C: { nextId: 'badEnding2', result: 'bad', text: 'Unknown B answers immediately.' }
    },
    hotspots: [
      { id: 'clock', label: 'Wall clock', clue: 'The second hand moves backward: 11:59, 11:58, 11:57.' },
      { id: 'photo', label: 'Photo frame', clue: 'Behind it, a sticky note says: Never believe anyone leave.' },
      { id: 'message', label: 'Unknown B', clue: "UNKNOWN B: Hey! I'm helping you! Reply to me." }
    ]
  },
  sceneA: {
    id: 'sceneA',
    title: 'The Floor Goes Dark',
    description:
      'The whole floor becomes dark. You fall. When you wake up, you are back at 11:59 PM with the same message.',
    image: 'loopRoom',
    location: 'QA Department',
    timestamp: '11:59 PM',
    ambient: 'lights failing / carpet impact / notification chime',
    terminal: ['11:59 PM', 'NEW MESSAGE RECEIVED', 'WELCOME BACK'],
    options: [{ key: 'A', label: 'Continue the loop' }],
    outcomes: {
      A: { nextId: 'floor1', result: 'restart', text: 'The loop restarts.' }
    },
    hotspots: [
      { id: 'floor', label: 'Cold carpet', clue: 'Your ID card is already on the floor before you fall.' },
      { id: 'lights', label: 'Dead lights', clue: 'The emergency lights do not turn on.' },
      { id: 'message', label: 'Same message', clue: 'Unknown A sends the same message again at exactly 11:59 PM.' }
    ]
  },
  sceneB: {
    id: 'sceneB',
    title: 'Why Did You Block Me?',
    description:
      'Your laptop starts blinking and fills with the words: why you ignore me? why you block me?',
    image: 'blockedRoom',
    location: 'QA Department',
    timestamp: '11:59 PM',
    ambient: 'screen blinking / repeated text / corrupted notification',
    terminal: ['WHY YOU IGNORE ME?', 'WHY YOU BLOCK ME?', 'WHY YOU IGNORE ME?'],
    options: [{ key: 'A', label: 'Continue the loop' }],
    outcomes: {
      A: { nextId: 'floor1', result: 'restart', text: 'The loop restarts.' }
    },
    hotspots: [
      { id: 'screen', label: 'Blinking screen', clue: 'The words appear over every app, including the lock screen.' },
      { id: 'cursor', label: 'Cursor', clue: 'It moves to unblock UNKNOWN A by itself.' },
      { id: 'clock', label: 'Clock', clue: 'The minute hand snaps backward to 11:59 PM.' }
    ]
  },
  sceneC: {
    id: 'sceneC',
    title: '0%',
    description: 'The figures remain silent. Every score on the projector changes to 0%. The room disappears.',
    image: 'zeroRoom',
    location: 'Meeting Room C',
    timestamp: '11:59 PM',
    ambient: 'projector whine / lights out / delayed applause',
    terminal: ['SCORE: 0%', 'ROOM NOT FOUND', 'NEW MESSAGE RECEIVED'],
    options: [{ key: 'A', label: 'Continue the loop' }],
    outcomes: {
      A: { nextId: 'floor1', result: 'restart', text: 'The loop restarts.' }
    },
    hotspots: [
      { id: 'projector', label: 'Projector', clue: '0% covers your name until the letters disappear.' },
      { id: 'table', label: 'Empty table', clue: 'The meeting room vanishes first. The table is last.' },
      { id: 'notification', label: 'New message', clue: 'UNKNOWN A is waiting at your desk again.' }
    ]
  },
  sceneD: {
    id: 'sceneD',
    title: 'Confidential Breach',
    description:
      'The office printer starts by itself. A page slides out: Date Today. Employee You. Status Missing. FAILED.',
    image: 'printerRoom',
    location: 'Printer Bay',
    timestamp: '11:59 PM',
    ambient: 'printer motor / red stamp / paper drag',
    terminal: ['EMPLOYEE: YOU', 'STATUS: MISSING', 'BREACH OF CONFIDENTIALITY'],
    options: [{ key: 'A', label: 'Continue the loop' }],
    outcomes: {
      A: { nextId: 'floor1', result: 'restart', text: 'The loop restarts.' }
    },
    hotspots: [
      { id: 'paper', label: 'Printed page', clue: 'Date: Today. Status: Missing. The red stamp says FAILED.' },
      { id: 'attempt', label: 'Attempt number', clue: 'Another page prints: Attempt #38...' },
      { id: 'printer', label: 'Printer', clue: 'It stops only when the clock returns to 11:59 PM.' }
    ]
  },
  badEnding: {
    id: 'badEnding',
    title: 'Bad Ending',
    description:
      'Standing at the end of the corridor is a figure wearing your employee ID, your clothes, and your face.',
    image: 'badFigureRoom',
    location: 'Corridor',
    timestamp: '11:59 PM',
    ambient: 'lights out / badge lanyard / your own breathing',
    terminal: ['FROM: YOU', 'SENT: TOMORROW', 'TIME: 11:59 PM'],
    options: [{ key: 'A', label: 'Continue the loop' }],
    outcomes: {
      A: { nextId: 'floor1', result: 'restart', text: 'The loop restarts.' }
    },
    hotspots: [
      { id: 'figure', label: 'Your face', clue: 'It smiles only after you do.' },
      { id: 'badge', label: 'Employee ID', clue: 'The badge photo updates while you stare at it.' },
      { id: 'message', label: 'New message', clue: 'From: You. Sent: Tomorrow. Time: 11:59 PM.' }
    ]
  },
  badEnding2: {
    id: 'badEnding2',
    title: 'Bad Ending 2',
    description: 'You are NOW the unknown B.',
    image: 'badFigureRoom',
    location: 'QA Department',
    timestamp: '11:59 PM',
    ambient: 'message sent / identity swap / silent keyboard',
    terminal: ['UNKNOWN B: THANK YOU', 'USER SWAPPED', 'YOU ARE NOW UNKNOWN B'],
    options: [],
    outcomes: {},
    hotspots: [
      { id: 'screen', label: 'Your message', clue: 'Your last reply is already being sent to someone else.' },
      { id: 'badge', label: 'Employee ID', clue: 'Your name fades. The badge now says UNKNOWN B.' },
      { id: 'keyboard', label: 'Keyboard', clue: 'It keeps typing: Hey! I am helping you.' }
    ]
  },
  trueEnding: {
    id: 'trueEnding',
    title: 'True Ending',
    description:
      'You ignore the message and run. The elevator opens. The display descends to Ground Floor. Morning sunlight floods the lobby.',
    image: 'sunriseRoom',
    location: 'Elevator / Lobby',
    timestamp: '06:00 AM',
    ambient: 'elevator descent / morning traffic / unlocked doors',
    terminal: ['GROUND FLOOR', '06:00 AM', 'TUESDAY', 'YOU HAVE ESCAPED'],
    options: [{ key: 'A', label: 'Restart game' }],
    outcomes: {
      A: { nextId: 'restart', result: 'restart', text: 'Restart from the opening.' }
    },
    hotspots: [
      { id: 'elevator', label: 'Elevator display', clue: '12, 11, 10, 9... 3, 2, 1, Ground Floor.' },
      { id: 'sunlight', label: 'Sunlight', clue: 'Morning floods the lobby. Nothing follows you out.' },
      { id: 'doors', label: 'Exit doors', clue: 'For once, they unlock without approval.' }
    ]
  }
};
