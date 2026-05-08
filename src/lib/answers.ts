// 150 oracle answers across themed packs. Every answer leads with a
// clear verdict (yes / granted / approved / cleared / bet / signs
// point to yes / verily / affirmative — vs no / denied / hard no /
// negative / permission revoked / nay) so the ruling is unambiguous;
// the riff carries the flavor.
//
// getRandomAnswer() day-weights the pool: weekday-energy answers only
// roll Mon-Thu, Friday-energy answers only roll on Friday. Core pack
// is always eligible.

// =============================================================
// CORE — always eligible (120)
// =============================================================
const CORE: readonly string[] = [
  // ----- Gen Z, yes (40) -----
  'Yes. You ate this prompt.',
  'Bet. Go off, bestie.',
  'Yes. The bowl said periodt.',
  'Granted. Your aura is bussin today.',
  'Yes. You understood the assignment.',
  'Approved. Slay responsibly.',
  'Yes. The plumbing is lowkey rooting for you.',
  'Cleared. Main character energy detected.',
  'Yes. The toilet said no cap — go.',
  'Granted. +1000 aura points.',
  "Yes. It's giving hall pass.",
  'Bet. The bowl approves of your rizz.',
  'Yes. Lock in and go.',
  "Approved. Don't be sus about it.",
  'Yes. The flush is your hype man.',
  "Granted. You're in your hallway era.",
  'Yes fr fr. Walk it out.',
  'Approved. The toilet caught your vibes in 4K.',
  'Yes. The drain stans you.',
  'Cleared. Touch grass on the way back.',
  "Yes. The bowl is giving green flag.",
  'Permission granted. Go be demure.',
  "Yes. The pipes said 'real.'",
  'Granted. Make it a canon event.',
  'Yes. Ate. Left no crumbs. Go.',
  'Bet. Energy is immaculate.',
  'Yes. Mother is mothering.',
  'Granted. The bowl said say less.',
  'Yes. Vibe check: passed.',
  'Approved. Glow up out there.',
  'Yes. Manifested. Confirmed.',
  'Bet. You cooked. Go.',
  'Yes. The drain is in its supportive era.',
  'Granted. Caught in 4K being valid.',
  'Yes. Gatekeep nothing. Go.',
  'Approved. The toilet stans your strut.',
  'Yes. Pass acquired. No notes.',
  'Bet. The pipes are quietly gagged.',
  "Yes. You're so for real.",
  'Granted. Locked in. Cleared.',

  // ----- Gen Z, no (40) -----
  "No. That's giving NPC behavior.",
  'Hard no. -500 aura points.',
  'Denied. The flush is so over you.',
  'No. The bowl said cap.',
  "Negative. You're lowkey crashing out.",
  'No. The toilet is not the vibe today.',
  'Hard no. Sit down. Be humble.',
  'Denied. The pipes are chronically over it.',
  'No. The drain caught the ick.',
  'Permission revoked. That was sus.',
  'No. The bowl said bffr.',
  "Hard no. The flush ratio'd you.",
  'Denied. Bestie. No.',
  "No. You're yapping. Sit down.",
  'Negative. The toilet does not stan.',
  "No. The graffiti L'd you.",
  'Denied. That request was so mid.',
  'No. The hand dryer side-eyed you.',
  'Hard no. The plumbing has receipts.',
  'No. Read the room. The bowl said L.',
  'Denied. Your rizz is not rizzing.',
  'No. Lock in at your desk.',
  'Negative. The toilet is not delulu.',
  'No. Touch grass. Mentally. From your seat.',
  'Denied. Skibidi. No.',
  'No. That ask was so cheugy.',
  'Hard no. Caught in 4K being annoying.',
  'Denied. Big mid energy.',
  'No. Vibes are off.',
  'Negative. The audacity.',
  'No. The toilet wants you to bffr.',
  "Hard no. We don't do that here.",
  'Denied. The water is not entertaining this.',
  'No. Brain rot detected.',
  'Permission revoked. Cringe.',
  "No. The bowl ratio'd your essence.",
  'Hard no. Stop yapping.',
  'Denied. -2000 aura. Sit.',
  "No. That's so npc-coded.",
  'Negative. The toilet has standards.',

  // ----- Variation packs (20: 4 each × 5) -----

  // Shakespearean
  'Forsooth, the bowl doth grant thee passage. Yes.',
  'Nay. The porcelain hath denied thee.',
  'Yea, verily — go thee and pee.',
  'Hark! The flush sayeth no.',

  // Corporate / HR speak
  'Per our records: approved. Yes.',
  'We regret to inform you: no.',
  'Circling back — the bowl has cleared this. Yes.',
  'Looping in the toilet. Verdict: hard no.',

  // Movie trailer voice
  'In a world... where one student dared to ask... the answer is yes.',
  'One bell. One pass. One verdict: no.',
  'From the makers of patience: permission granted.',
  'Coming this hallway: hard no.',

  // Magic 8-ball classic / prophetic
  'Signs point to yes.',
  'The omens are dark. Denied.',
  'The stars say go. Yes.',
  'It is foretold. Hard no.',

  // Texting chaos / lowercase
  'yea go go go',
  'lol no',
  'omg yes',
  'no lmao sit down',

  // ----- Teacher's Edition (20: eye-rolly slang awareness) -----

  // yes (10)
  "Yes. (I had to look up 'rizz' for this.) Go.",
  "Granted. I am aware that 'bet' means yes now.",
  'Approved. I will allow the sigma walk just this once.',
  'Yes. Touch grass — that one I do understand.',
  'Granted. Flush quietly please.',
  'Yes. The bell is the real authority and it likes you.',
  'Approved. Use complete sentences in the hallway.',
  'Yes. Try to come back before the next slang cycle.',
  "Granted. I marked this in my gradebook as 'go.'",
  "Yes. (Yes, I know what 'mid' means. I have been told.)",

  // no (10)
  "No. Stop saying 'cooked.'",
  "Hard no. And it is pronounced 'periodt' apparently.",
  "Denied. You did not, in fact, 'ate.'",
  "No. Save the 'crashout' for the bell.",
  'Hard no. Brain rot tax: five minutes of silence.',
  "Denied. We are not doing 'bestie' in here.",
  'Permission revoked. The grading rubric agrees.',
  'No. Re-read the question. Also, sit.',
  "Hard no. I do not accept 'bet' as an academic argument.",
  'Denied. I have a meeting and you have a chair.',
];

// =============================================================
// WEEKDAY ENERGY — only rolls Mon–Thu (15)
// Bias: leans no. The week has not earned much.
// =============================================================
const WEEKDAY_ENERGY: readonly string[] = [
  // yes (5)
  'Yes. Monday survival bonus.',
  'Granted. Thursday gets a pity yes.',
  'Yes. Wednesday is a Wednesday. Fine.',
  'Approved. Tuesday earned this one.',
  'Yes. The week is hard. Be free.',

  // no (10)
  "No. It's Tuesday. Sit.",
  'Hard no. Wednesday math.',
  'Denied. The week has not earned a pass yet.',
  'No. Tuesday says no.',
  'Hard no. We are fourteen percent into the week.',
  'Denied. The week is still loading.',
  'No. Monday energy. Grind mode.',
  "Negative. It's not even noon.",
  'Hard no. Three more days exist.',
  'Denied. The hump has not humped.',
];

// =============================================================
// FRIDAY ENERGY — only rolls on Friday (15)
// Bias: leans yes. End-of-week amnesty.
// =============================================================
const FRIDAY_ENERGY: readonly string[] = [
  // yes (12)
  "YES. It's Friday. Go forth.",
  'Approved. Pre-break amnesty granted.',
  'Yes. Last bell energy.',
  'Granted. The school is dissociating, so are you.',
  'Yes. Even the principal is checked out.',
  'Bet. Friday after lunch is a free-for-all.',
  'Approved. Take your time. The year is over emotionally.',
  'Yes. The hallway is yours, bestie.',
  'Granted. End-of-week absolution.',
  'Yes. We have all stopped pretending.',
  'Approved. May your snack run be blessed.',
  'Yes. Friday energy override engaged.',

  // no (3)
  'Hard no. Even Friday has rules.',
  'Denied. Friday before a long weekend, my brain says no.',
  'No. Substitute teacher logic: no.',
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
