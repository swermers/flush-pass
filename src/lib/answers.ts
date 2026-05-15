// Oracle answers, all bathroom-themed. Every answer is a yes/no/wild
// verdict followed by a short plumbing/stall/flush flavored riff.
//
// getRandomAnswer() day-weights the pool: weekday-energy answers only
// roll Mon–Thu, Friday-energy answers only roll on Friday. Core pack is
// always eligible. Wildcards roll any day when includeWild is on.

export type AnswerKind = 'yes' | 'no' | 'wild';

export interface Answer {
  text: string;
  kind: AnswerKind;
}

interface RawEntry {
  text: string;
  kind: AnswerKind;
}

// =============================================================
// CORE — always eligible
// =============================================================
const CORE: readonly RawEntry[] = [
  // ----- yes -----
  { text: 'Yes. The stall is yours.', kind: 'yes' },
  { text: 'Yes. Flush granted.', kind: 'yes' },
  { text: 'Yes. The porcelain throne awaits.', kind: 'yes' },
  { text: 'Yes. Hall pass approved — go.', kind: 'yes' },
  { text: 'Yes. The plumbing is ready.', kind: 'yes' },
  { text: 'Yes. The urinal is calling your name.', kind: 'yes' },
  { text: 'Yes. The toilet seat is warmed for you.', kind: 'yes' },
  { text: 'Yes. Soap is stocked. Proceed.', kind: 'yes' },
  { text: 'Yes. Permission flushed through.', kind: 'yes' },
  { text: 'Yes. The bowl approves.', kind: 'yes' },
  { text: 'Yes. Stall two is open.', kind: 'yes' },
  { text: 'Yes. The tile is ready for your footsteps.', kind: 'yes' },
  { text: 'Yes. The pipes have spoken.', kind: 'yes' },
  { text: 'Yes. The hand dryer is humming for you.', kind: 'yes' },
  { text: 'Yes. The drain blesses your journey.', kind: 'yes' },
  { text: 'Yes. The TP is fully stocked. Go.', kind: 'yes' },
  { text: 'Yes. The faucet says go.', kind: 'yes' },
  { text: 'Yes. Approved by the porcelain council.', kind: 'yes' },
  { text: 'Yes. The water runs in your favor.', kind: 'yes' },
  { text: 'Yes. The stall door is unlocked.', kind: 'yes' },
  { text: 'Yes. The mirror nods.', kind: 'yes' },
  { text: 'Yes. Even the bidet agrees.', kind: 'yes' },
  { text: 'Yes. The plumber gives a thumbs up.', kind: 'yes' },
  { text: 'Yes. The toilet brush bows.', kind: 'yes' },
  { text: 'Yes. Air freshener engaged.', kind: 'yes' },
  { text: 'Yes. The bowl said let it flow.', kind: 'yes' },
  { text: 'Yes. Permission to wash hands granted.', kind: 'yes' },
  { text: 'Yes. The S-bend says go.', kind: 'yes' },
  { text: 'Yes. Toilet paper rolled in your favor.', kind: 'yes' },
  { text: 'Yes. The urinal cake concurs.', kind: 'yes' },
  { text: 'Yes. The tank has refilled.', kind: 'yes' },
  { text: 'Yes. The flush handle is begging for you.', kind: 'yes' },
  { text: 'Yes. The seat is down and ready.', kind: 'yes' },
  { text: 'Yes. The cistern is full of grace.', kind: 'yes' },
  { text: 'Yes. The bathroom welcomes you.', kind: 'yes' },
  { text: 'Yes. The two-ply blesses this run.', kind: 'yes' },
  { text: 'Yes. The plunger rests easy.', kind: 'yes' },
  { text: 'Yes. The hand soap foams in approval.', kind: 'yes' },
  { text: 'Yes. The motion sensor is on your side.', kind: 'yes' },
  { text: 'Yes. The flapper opens for you.', kind: 'yes' },

  // ----- no -----
  { text: 'No. The stall is closed.', kind: 'no' },
  { text: 'No. The plumbing is backed up.', kind: 'no' },
  { text: 'No. The toilet is occupied.', kind: 'no' },
  { text: 'No. Out of order.', kind: 'no' },
  { text: 'No. Hold it.', kind: 'no' },
  { text: 'No. The bowl said clog.', kind: 'no' },
  { text: 'No. The faucet runs dry on this one.', kind: 'no' },
  { text: 'No. The pipes are frozen on this request.', kind: 'no' },
  { text: 'No. The plunger disagrees.', kind: 'no' },
  { text: 'No. The hand dryer blew it off.', kind: 'no' },
  { text: 'No. The flush failed.', kind: 'no' },
  { text: 'No. The seat is up. Try later.', kind: 'no' },
  { text: 'No. Out of TP.', kind: 'no' },
  { text: 'No. The porcelain rejects you.', kind: 'no' },
  { text: 'No. The sink swallowed your request.', kind: 'no' },
  { text: 'No. The drain has spoken.', kind: 'no' },
  { text: 'No. The bidet is unimpressed.', kind: 'no' },
  { text: 'No. The S-bend says otherwise.', kind: 'no' },
  { text: 'No. The tank is empty.', kind: 'no' },
  { text: 'No. The bathroom is closed for cleaning.', kind: 'no' },
  { text: 'No. The mirror will not even look.', kind: 'no' },
  { text: 'No. The soap dispenser is dry.', kind: 'no' },
  { text: 'No. The auto-flush triggered too early.', kind: 'no' },
  { text: 'No. The toilet brush stands in your way.', kind: 'no' },
  { text: 'No. The plumbing protests.', kind: 'no' },
  { text: 'No. Wet floor sign blocks the way.', kind: 'no' },
  { text: 'No. The urinal divider has ruled.', kind: 'no' },
  { text: 'No. The tile says no.', kind: 'no' },
  { text: 'No. The flush valve sticks.', kind: 'no' },
  { text: 'No. The flapper rebels.', kind: 'no' },
  { text: 'No. The toilet seat slammed shut.', kind: 'no' },
  { text: 'No. The stall graffiti reads: denied.', kind: 'no' },
  { text: 'No. The drain caught your hopes.', kind: 'no' },
  { text: 'No. The bathroom queue is too long.', kind: 'no' },
  { text: 'No. The hand soap said scrub off.', kind: 'no' },
  { text: 'No. The flush handle did not even budge.', kind: 'no' },
  { text: 'No. The cistern hisses no.', kind: 'no' },
  { text: 'No. The bathroom is haunted today.', kind: 'no' },
  { text: 'No. The motion sensor refuses to trigger.', kind: 'no' },
  { text: 'No. The paper towel dispenser is jammed.', kind: 'no' },
];

// =============================================================
// WILDCARDS — granted with a string attached
// =============================================================
const WILDCARDS: readonly RawEntry[] = [
  { text: 'Wildcard. Pass granted — after one silent lap of the classroom.', kind: 'wild' },
  { text: 'Wildcard. Yes, but you must compliment the next person you see.', kind: 'wild' },
  { text: 'Wildcard. Granted — return with a fun fact about anything.', kind: 'wild' },
  { text: 'Wildcard. Yes. Mime washing your hands before you sit back down.', kind: 'wild' },
  { text: 'Wildcard. Pass approved — walk there in slow motion.', kind: 'wild' },
  { text: 'Wildcard. Granted, but everyone at your table gets a high five first.', kind: 'wild' },
  { text: 'Wildcard. Yes. Bring back the cleanest joke you can think of.', kind: 'wild' },
  { text: 'Wildcard. Pass granted — answer one quiz question on the way out.', kind: 'wild' },
  { text: 'Wildcard. Yes, on the condition you remember someone’s middle name.', kind: 'wild' },
  { text: 'Wildcard. Cleared. Walk back in like you are entering a press conference.', kind: 'wild' },
  { text: 'Wildcard. Granted — make your way there using only side-steps.', kind: 'wild' },
  { text: 'Wildcard. Yes, but you must hum the school song faintly.', kind: 'wild' },
];

// =============================================================
// WEEKDAY ENERGY — only rolls Mon–Thu (leans no)
// =============================================================
const WEEKDAY_ENERGY: readonly RawEntry[] = [
  { text: 'Yes. Monday survival flush granted.', kind: 'yes' },
  { text: 'Yes. Tuesday earned a stall break.', kind: 'yes' },
  { text: 'Yes. Wednesday is a Wednesday. Use the bathroom.', kind: 'yes' },
  { text: 'Yes. Thursday gets a pity flush.', kind: 'yes' },
  { text: 'Yes. The week is long. The bowl is patient.', kind: 'yes' },

  { text: "No. It's Tuesday. Hold it.", kind: 'no' },
  { text: 'No. Wednesday plumbing math says no.', kind: 'no' },
  { text: 'No. The week has not earned a flush yet.', kind: 'no' },
  { text: 'No. Monday pipes are still warming up.', kind: 'no' },
  { text: 'No. The hump has not humped.', kind: 'no' },
  { text: 'No. The bowl is closed until further notice.', kind: 'no' },
  { text: 'No. The flush quota for today is spent.', kind: 'no' },
  { text: 'No. The stall is reserved for someone with worse timing.', kind: 'no' },
  { text: 'No. The drain says try again tomorrow.', kind: 'no' },
  { text: 'No. The bathroom is mid-mop.', kind: 'no' },
];

// =============================================================
// FRIDAY ENERGY — only rolls on Friday (leans yes)
// =============================================================
const FRIDAY_ENERGY: readonly RawEntry[] = [
  { text: "Yes. It's Friday. The bathroom is yours.", kind: 'yes' },
  { text: 'Yes. End-of-week flush amnesty.', kind: 'yes' },
  { text: 'Yes. Last bell, last flush. Go.', kind: 'yes' },
  { text: 'Yes. The janitor has already given up. Go.', kind: 'yes' },
  { text: 'Yes. Friday plumbing override engaged.', kind: 'yes' },
  { text: 'Yes. The urinals are practically empty.', kind: 'yes' },
  { text: 'Yes. The stall is ready for a long weekend.', kind: 'yes' },
  { text: 'Yes. The hand dryer is feeling generous.', kind: 'yes' },
  { text: 'Yes. The bowl is in a good mood.', kind: 'yes' },
  { text: 'Yes. Pre-weekend pee pass granted.', kind: 'yes' },
  { text: 'Yes. The pipes are coasting. So can you.', kind: 'yes' },
  { text: 'Yes. The bathroom is dissociating. Join it.', kind: 'yes' },

  { text: 'No. Even Friday has stall rules.', kind: 'no' },
  { text: 'No. The bathroom is closed for early dismissal.', kind: 'no' },
  { text: 'No. The substitute janitor said no.', kind: 'no' },
];

export const ANSWERS: readonly Answer[] = [
  ...CORE,
  ...WEEKDAY_ENERGY,
  ...FRIDAY_ENERGY,
  ...WILDCARDS,
];

export interface GetAnswerOptions {
  includeWild?: boolean;
}

export function getRandomAnswer(options: GetAnswerOptions = {}): Answer {
  const { includeWild = true } = options;
  const day = new Date().getDay();
  const pool: RawEntry[] = [...CORE];
  if (day >= 1 && day <= 4) pool.push(...WEEKDAY_ENERGY);
  if (day === 5) pool.push(...FRIDAY_ENERGY);
  if (includeWild) {
    // Wildcards are rare-ish — ~12% of the pool. Duplicate them less
    // than core so they feel like a special outcome.
    pool.push(...WILDCARDS);
  }
  const pick = pool[Math.floor(Math.random() * pool.length)];
  return { text: pick.text, kind: pick.kind };
}

// Short blurbs that flash by during a spin to build anticipation.
export const TEASERS: readonly string[] = [
  'maybe…',
  'hmm',
  'depends',
  'the pipes are thinking',
  'consulting…',
  'wait',
  'one sec',
  'checking',
  'hmmm…',
  '…',
  'almost',
  'reading the room',
  'fr?',
  'the bowl knows',
  'just a sec',
  'processing',
  'tilts head',
  'flushing thought',
  'consulting plumbing',
  'cross-referencing',
  'asking the drain',
];
