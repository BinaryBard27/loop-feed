const AI_CONTENT = {
  mind: [
    "You are aware of your blinking now.",
    "Choose left or right in your mind.",
    "Your brain is expecting a dopamine hit from the next swipe.",
    "You just read this sentence twice.",
    "Notice how quickly you judged that.",
    "Your mind filled in the blank before you finished reading.",
    "You're breathing manually now.",
    "Did you read that, or did you just scan it?",
    "Your eyes just focused intentionally for the first time in minutes.",
    "Think of a red door. Now try to stop. Too late.",
    "You just blinked on purpose.",
    "Notice your tongue touching the roof of your mouth.",
    "Your heartbeat just changed pace slightly.",
    "You are aware of both your hands right now.",
    "You were scrolling without reading. Until just now.",
    "Your posture changed when you read that.",
    "You just had a thought you didn't choose to have.",
    "Notice the temperature of the air around you.",
    "Your grip on this device just tightened slightly.",
    "You almost scrolled past this without seeing it."
  ],
  meta: [
    "You forgot why you opened this app.",
    "This algorithm is mapping your attention span perfectly.",
    "How many of these have you scrolled past today?",
    "You are the product.",
    "Every swipe is a data point.",
    "This app knows more about you than you do.",
    "The feed ends when you decide it does. You won't decide.",
    "Your scroll speed tells us everything.",
    "You paused. We noticed.",
    "Your attention has a price. Someone is paying it right now.",
    "We made this unpredictable on purpose.",
    "You are being optimized for maximum session time.",
    "This feels random. It isn't.",
    "The next item is already loading. You'll never catch up.",
    "Your brain is being trained right now. Without your consent.",
    "You opened this app 47 seconds ago. It feels like 10 minutes.",
    "The algorithm wins every time. You scroll anyway.",
    "You'll think about something you saw here in 3 days.",
    "Your subconscious has already made a decision. You're just waiting to find out what it is.",
    "This is designed to feel effortless. That's the trap."
  ],
  challenge: [
    "Don't tap. Seriously don't.",
    "Try staring at the center without blinking.",
    "Don't swipe up. Prove you're in control.",
    "Look away for 3 seconds. You won't.",
    "Put the phone down. Just for 10 seconds.",
    "Don't think about what you'll do after this.",
    "Try not to react to the next thing you see.",
    "Scroll slower than you want to.",
    "Stay on this screen for 5 full seconds.",
    "Don't smile at the next meme.",
    "Close your eyes. Count to 3. Open them. Now scroll.",
    "Don't read the next item. Just look at it.",
    "Breathe in for 4 counts. Hold. Breathe out. Now keep going.",
    "Put your thumb down. Don't scroll for exactly 8 seconds.",
    "Name three things in this room without looking away from the screen.",
    "Say the next word you think out loud. Go.",
    "Try to feel completely neutral about the next thing you see.",
    "Don't blink for the next 5 seconds.",
    "Tap the screen exactly 5 times. No more. No less.",
    "Look at the top-left corner of your screen. Now look back."
  ],
  uncomfortable: [
    "Someone is thinking exactly what you're thinking right now.",
    "You are wasting your time staring at a screen.",
    "That sinking feeling is just reality setting in again.",
    "You've been avoiding something today.",
    "This is not making you happy.",
    "You will forget this in 30 seconds.",
    "The people you love don't know you're here.",
    "You opened this to feel something.",
    "There's something you should be doing instead.",
    "You are physically uncomfortable and haven't noticed until now.",
    "What were you actually looking for when you opened this?",
    "This is your 14th choice to keep scrolling.",
    "You checked this app before you checked on someone you love today.",
    "The version of yourself from 5 years ago would be confused by this moment.",
    "You have a conversation you've been putting off for weeks.",
    "This is the easiest thing you've done all day.",
    "You're waiting for something. You're not sure what.",
    "You were more bored than you realized.",
    "You're tired but you're still here.",
    "You know exactly what you should close right now."
  ],
  curiosity: [
    "What was the last thing you actually remember learning?",
    "Does your future self regret this exact moment?",
    "Is this your original thought, or was it planted?",
    "If you stopped right now, would anything change?",
    "Why do you prefer certain content over others?",
    "What's the oldest memory you can access right now?",
    "When did you last feel genuinely surprised?",
    "Do you ever wonder who else is scrolling right now?",
    "What would you do if the internet disappeared tomorrow?",
    "If you described yourself honestly, what would you say?",
    "What do you think people notice first about you?",
    "What have you changed your mind about recently?",
    "When was the last time you were truly bored? Not distracted — bored.",
    "What's a belief you hold that you've never questioned?",
    "What would you do with tomorrow if you had no obligations at all?",
    "What are you really good at that you never talk about?",
    "If you couldn't use your phone for a week, what would be hardest?",
    "What emotion are you most afraid of feeling?",
    "Have you ever had a feeling you couldn't name?",
    "What would you do today if no one was watching?"
  ],
  weird: [
    "The air in your room is slowly getting heavier.",
    "Look behind you. Just checking.",
    "There's a subtle ringing in your ear you only just noticed.",
    "Something is slightly off about this room.",
    "You have a thought you won't tell anyone about.",
    "The last sound you heard is still echoing slightly.",
    "Your reflection always blinks at exactly the same time as you.",
    "You've made this exact expression before. Right now.",
    "Something in this room moved while you weren't looking.",
    "You are being observed. Always.",
    "There's a smell you almost noticed.",
    "The light in this room is slightly wrong today.",
    "Your name sounds strange if you say it too many times.",
    "There's a word on the tip of your tongue. You'll remember it at 3am.",
    "You've been in this exact moment before.",
    "The silence between sounds is louder than you realize.",
    "You almost remember something important right now.",
    "Your shadow moves slightly before you do.",
    "There's a door in your memory you've never opened.",
    "You were just watched through a window you forgot existed."
  ]
};

// ──────────────────────────────────────────────────────────────
// Psychological content pools — 4 new types
// ──────────────────────────────────────────────────────────────

const DISRUPT_CONTENT = [
  "Stop. Breathe. Now continue.",
  "You are aware of your thoughts now.",
  "Pause for 2 seconds.",
  "Let go of what you were thinking.",
  "Feel your feet on the floor.",
  "You just blinked without thinking.",
  "Your jaw. Is it clenched right now?",
  "Notice the weight of the device in your hand.",
  "Put your shoulders down. They were raised.",
  "Breathe out slowly. Hold. Breathe in.",
  "For one second, feel absolutely nothing.",
  "Your eyes are tired. You know this.",
  "Name 3 things you can see right now.",
  "Release the tension in your neck.",
  "You are not your thoughts. Just breathe.",
  "Feel the texture of whatever you're holding.",
  "Notice where your weight is right now.",
  "Unclench your hand. It was gripping.",
  "Your face is doing something right now. Relax it.",
  "You're allowed to stop. You know that, right?",
  "Take one breath that lasts 6 seconds. Go.",
  "Look at something far away for exactly 3 seconds.",
  "Your body needs water. You haven't had enough today.",
  "Let your eyes go soft. Just for a moment."
];

const DECISION_CONTENT = [
  "Choose left or right in your mind.",
  "Pick: loop or still.",
  "Yes or no?",
  "Fast or slow?",
  "Stay or leave?",
  "Fight or freeze?",
  "Now or never?",
  "Noise or silence?",
  "Logic or instinct?",
  "Act or wait?",
  "Truth or comfort?",
  "More or enough?",
  "Real or curated?",
  "Scroll or stop?",
  "React or ignore?",
  "Forward or back?",
  "Alone or together?",
  "Say it or don't?",
  "Known or unknown?",
  "Hold on or let go?"
];

const RESET_CONTENT = [
  "Wait...",
  "Don't scroll.",
  "Just one more.",
  "You're still here.",
  "Hold on.",
  "Not yet.",
  "Almost.",
  "Stop for a second.",
  "Breathe. Okay. Go.",
  "...",
  "Hey.",
  "Look up.",
  "Slow down.",
  "Not this one.",
  "Wrong way.",
  "Pause.",
  "Look at your hands.",
  "One moment.",
  "Not so fast.",
  "Stay here.",
  "This one matters.",
  "Read this again.",
  "You missed something.",
  "Before you scroll..."
];

// ──────────────────────────────────────────────────────────────
// Dedup utilities
// ──────────────────────────────────────────────────────────────

const recentAI: string[] = [];
const recentDisrupt: string[] = [];
const recentDecision: string[] = [];
const recentReset: string[] = [];

function pickUnique<T extends string>(pool: T[], recent: T[]): T {
  let available = pool.filter(p => !recent.includes(p));
  if (available.length === 0) {
    recent.length = 0;
    available = [...pool];
  }
  const picked = available[Math.floor(Math.random() * available.length)];
  recent.push(picked);
  if (recent.length > Math.ceil(pool.length / 2)) recent.shift();
  return picked;
}

// ──────────────────────────────────────────────────────────────
// Exports
// ──────────────────────────────────────────────────────────────

export function getAIText(isDeep: boolean = false): { type: string; text: string } {
  let availableCategories = Object.keys(AI_CONTENT) as Array<keyof typeof AI_CONTENT>;

  if (isDeep) {
    availableCategories = ["meta", "uncomfortable", "weird"];
  }

  const randomCategory = availableCategories[Math.floor(Math.random() * availableCategories.length)];
  const phrases = AI_CONTENT[randomCategory];

  let availablePhrases = phrases.filter(p => !recentAI.includes(p));
  if (availablePhrases.length === 0) {
    availablePhrases = phrases;
    recentAI.length = 0;
  }

  const randomText = availablePhrases[Math.floor(Math.random() * availablePhrases.length)];
  recentAI.push(randomText);
  if (recentAI.length > 15) recentAI.shift();

  return { type: randomCategory, text: randomText };
}

export function getDisruptText(): string {
  return pickUnique(DISRUPT_CONTENT, recentDisrupt);
}

export function getDecisionText(): string {
  return pickUnique(DECISION_CONTENT, recentDecision);
}

export function getResetText(): string {
  return pickUnique(RESET_CONTENT, recentReset);
}

const STATIC_FALLBACKS = [
  "Connection lost. Rebuilding reality.",
  "Simulation paused.",
  "Loading dopamine payload...",
  "The void is staring back.",
  "Signal interrupted.",
  "Reality check failed.",
  "Processing your attention...",
  "Buffer overrun. Keep scrolling."
];

export function getStaticFallback(): string {
  return STATIC_FALLBACKS[Math.floor(Math.random() * STATIC_FALLBACKS.length)];
}
