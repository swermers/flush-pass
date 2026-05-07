export const ANSWERS: readonly string[] = [
  // Affirmative (~40%)
  'Permission granted.',
  'The bowl says yes.',
  'Lucky flush — go.',
  'Granted, but make it quick.',
  'Today is your day.',
  'Go forth.',
  'The plumbing approves.',
  "Yes. Don't dawdle.",
  'Cleared for takeoff.',
  'Pass granted.',
  'The porcelain has spoken: yes.',
  "Approved — you've earned it.",
  'Flush successful. Proceed.',
  'Green light. Go.',
  'Yes, but you owe me one.',

  // Negative (~35%)
  'Hard no.',
  'Today is not your day.',
  'Hold it.',
  'The plumbing has spoken: no.',
  'Denied.',
  'Try again at the next bell.',
  'Not happening.',
  'The bowl is not in your favor.',
  'No. Sit down.',
  'The toilet gods say no.',
  'Permission revoked.',
  'Negative.',
  'Try again tomorrow.',
  'The flush failed you.',

  // Maybe / deferred (~15%)
  'Try again in 3 minutes.',
  'Ask again after the bell.',
  'Reply hazy, ask the janitor.',
  'Outlook unclear. Flush twice.',
  'The bowl is thinking...',
  'Maybe. The water is unsure.',
  'Pending review by the custodian.',

  // Chaos (~10%)
  'The toilet refuses to acknowledge you.',
  'Ask the vending machine instead.',
  'Bold of you to assume.',
  'Have you tried not asking?',
  'The answer was inside you all along. (No.)',
  'The bowl is empty. So is your hope.',
  '404: bathroom not found.',
  'The school board must convene.',
  'Insufficient karma.',
  'Permission... pending... permission...',
  'ERROR: too much hubris detected.',
  'The water has filed a restraining order.',
  'Permission granted. (Just kidding.)',
  'The toilet is on a coffee break.',
  'Have you considered holding it forever?',
] as const;

export function getRandomAnswer(): string {
  return ANSWERS[Math.floor(Math.random() * ANSWERS.length)];
}
