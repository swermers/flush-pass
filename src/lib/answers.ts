// Oracle answers, all bathroom-themed. Every answer is a clean yes or no
// verdict followed by a short plumbing/stall/flush flavored riff.
//
// getRandomAnswer() day-weights the pool: weekday-energy answers only
// roll Mon–Thu, Friday-energy answers only roll on Friday. Core pack
// is always eligible.

// =============================================================
// CORE — always eligible
// =============================================================
const CORE: readonly string[] = [
  // ----- yes -----
  'Yes. The stall is yours.',
  'Yes. Flush granted.',
  'Yes. The porcelain throne awaits.',
  'Yes. Hall pass approved — go.',
  'Yes. The plumbing is ready.',
  'Yes. The urinal is calling your name.',
  'Yes. The toilet seat is warmed for you.',
  'Yes. Soap is stocked. Proceed.',
  'Yes. Permission flushed through.',
  'Yes. The bowl approves.',
  'Yes. Stall two is open.',
  'Yes. The tile is ready for your footsteps.',
  'Yes. The pipes have spoken.',
  'Yes. The hand dryer is humming for you.',
  'Yes. The drain blesses your journey.',
  'Yes. The TP is fully stocked. Go.',
  'Yes. The faucet says go.',
  'Yes. Approved by the porcelain council.',
  'Yes. The water runs in your favor.',
  'Yes. The stall door is unlocked.',
  'Yes. The mirror nods.',
  'Yes. Even the bidet agrees.',
  'Yes. The plumber gives a thumbs up.',
  'Yes. The toilet brush bows.',
  'Yes. Air freshener engaged.',
  'Yes. The bowl said let it flow.',
  'Yes. Permission to wash hands granted.',
  'Yes. The S-bend says go.',
  'Yes. Toilet paper rolled in your favor.',
  'Yes. The urinal cake concurs.',
  'Yes. The tank has refilled.',
  'Yes. The flush handle is begging for you.',
  'Yes. The seat is down and ready.',
  'Yes. The cistern is full of grace.',
  'Yes. The bathroom welcomes you.',
  'Yes. The two-ply blesses this run.',
  'Yes. The plunger rests easy.',
  'Yes. The hand soap foams in approval.',
  'Yes. The motion sensor is on your side.',
  'Yes. The flapper opens for you.',

  // ----- no -----
  'No. The stall is closed.',
  'No. The plumbing is backed up.',
  'No. The toilet is occupied.',
  'No. Out of order.',
  'No. Hold it.',
  'No. The bowl said clog.',
  'No. The faucet runs dry on this one.',
  'No. The pipes are frozen on this request.',
  'No. The plunger disagrees.',
  'No. The hand dryer blew it off.',
  'No. The flush failed.',
  'No. The seat is up. Try later.',
  'No. Out of TP.',
  'No. The porcelain rejects you.',
  'No. The sink swallowed your request.',
  'No. The drain has spoken.',
  'No. The bidet is unimpressed.',
  'No. The S-bend says otherwise.',
  'No. The tank is empty.',
  'No. The bathroom is closed for cleaning.',
  'No. The mirror will not even look.',
  'No. The soap dispenser is dry.',
  'No. The auto-flush triggered too early.',
  'No. The toilet brush stands in your way.',
  'No. The plumbing protests.',
  'No. Wet floor sign blocks the way.',
  'No. The urinal divider has ruled.',
  'No. The tile says no.',
  'No. The flush valve sticks.',
  'No. The flapper rebels.',
  'No. The toilet seat slammed shut.',
  'No. The stall graffiti reads: denied.',
  'No. The drain caught your hopes.',
  'No. The bathroom queue is too long.',
  'No. The hand soap said scrub off.',
  'No. The flush handle did not even budge.',
  'No. The cistern hisses no.',
  'No. The bathroom is haunted today.',
  'No. The motion sensor refuses to trigger.',
  'No. The paper towel dispenser is jammed.',
];

// =============================================================
// WEEKDAY ENERGY — only rolls Mon–Thu
// Bias: leans no.
// =============================================================
const WEEKDAY_ENERGY: readonly string[] = [
  // yes
  'Yes. Monday survival flush granted.',
  'Yes. Tuesday earned a stall break.',
  'Yes. Wednesday is a Wednesday. Use the bathroom.',
  'Yes. Thursday gets a pity flush.',
  'Yes. The week is long. The bowl is patient.',

  // no
  "No. It's Tuesday. Hold it.",
  'No. Wednesday plumbing math says no.',
  'No. The week has not earned a flush yet.',
  'No. Monday pipes are still warming up.',
  'No. The hump has not humped.',
  'No. The bowl is closed until further notice.',
  'No. The flush quota for today is spent.',
  'No. The stall is reserved for someone with worse timing.',
  'No. The drain says try again tomorrow.',
  'No. The bathroom is mid-mop.',
];

// =============================================================
// FRIDAY ENERGY — only rolls on Friday
// Bias: leans yes.
// =============================================================
const FRIDAY_ENERGY: readonly string[] = [
  // yes
  "Yes. It's Friday. The bathroom is yours.",
  'Yes. End-of-week flush amnesty.',
  'Yes. Last bell, last flush. Go.',
  'Yes. The janitor has already given up. Go.',
  'Yes. Friday plumbing override engaged.',
  'Yes. The urinals are practically empty.',
  'Yes. The stall is ready for a long weekend.',
  'Yes. The hand dryer is feeling generous.',
  'Yes. The bowl is in a good mood.',
  'Yes. Pre-weekend pee pass granted.',
  'Yes. The pipes are coasting. So can you.',
  'Yes. The bathroom is dissociating. Join it.',

  // no
  'No. Even Friday has stall rules.',
  'No. The bathroom is closed for early dismissal.',
  'No. The substitute janitor said no.',
];

// Full export — handy for tests, counts, or manual browsing.
export const ANSWERS: readonly string[] = [
  ...CORE,
  ...WEEKDAY_ENERGY,
  ...FRIDAY_ENERGY,
];

export function getRandomAnswer(): string {
  // 0 = Sun, 1 = Mon, ..., 5 = Fri, 6 = Sat (user's local time)
  const day = new Date().getDay();
  const pool: string[] = [...CORE];
  if (day >= 1 && day <= 4) pool.push(...WEEKDAY_ENERGY);
  if (day === 5) pool.push(...FRIDAY_ENERGY);
  return pool[Math.floor(Math.random() * pool.length)];
}
