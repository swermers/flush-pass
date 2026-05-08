// 50 oracle answers. Each resolves to a clear yes or no — the comedy is
// in what comes after the verdict. Roughly 50/50 split.

export const ANSWERS: readonly string[] = [
  // ----- Yes (25) -----
  'Yes. Go.',
  'Permission granted. Walk casually.',
  'Yes. The bowl approves of your vibe.',
  'Cleared for takeoff. Yes.',
  'Yes. The plumbing has a soft spot for you today.',
  "Approved. Don't make eye contact with the principal.",
  'Yes. Briefly. Mysteriously.',
  'Granted. The drain is rooting for you.',
  'Yes. Today the porcelain smiles.',
  'Yes — and take your time. Reflect.',
  'Permission stamped by the sewer council. Yes.',
  'Yes. May the vending machine bless your journey.',
  'Yes. The bowl ate your sins. Go.',
  "Approved. Check the second stall — it's the lucky one.",
  'Yes, but return before the universe collapses.',
  'Granted. Limp slightly for sympathy.',
  'Yes. The toilet gods have nothing else going on today.',
  'Permission granted. Hydrate, soldier.',
  'Yes. Make it weird out there.',
  "Yes. Don't befriend the hand dryer.",
  'Approved. The mirror is proud of you.',
  'Yes. The flush has been a fan all year.',
  'Yes. The pipes are quietly cheering.',
  "Granted. Bring back a survivor's tale.",
  'Yes. The water just told a joke. Go laugh.',

  // ----- No (25) -----
  'No. Sit. Suffer.',
  'Hard no. The flush is in a mood.',
  'Denied. Read your book to it.',
  'No. The bowl saw your homework.',
  'Negative. Hold it. Build character.',
  'No. The toilet is not accepting walk-ins.',
  'Hard no. Try again at the next bell.',
  'Denied. The pipes filed a complaint.',
  'No. Your aura smells like Cheez-Its.',
  'Permission revoked. Mid-thought.',
  'No. The water is in a meeting.',
  'Hard no. The flush has trust issues.',
  'Denied. The custodian remembers.',
  'No. Try suffering quietly at your desk.',
  'Negative. The bowl is fasting today.',
  'No. The graffiti voted against you.',
  'Denied. Have you tried being someone else?',
  'No. Even the hand dryer disapproves.',
  'Hard no. The toilet has filed a restraining order.',
  'No. Today the porcelain is feudal.',
  "Denied. Sewer council requires three business days' notice.",
  'No. Sit back down before I tell on you.',
  'Negative. The plumbing senses weakness.',
  'No. Try meditating at your desk instead.',
  'Denied. The toilet has bigger things to deny today.',
] as const;

export function getRandomAnswer(): string {
  return ANSWERS[Math.floor(Math.random() * ANSWERS.length)];
}
