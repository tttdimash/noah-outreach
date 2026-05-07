export const EMAIL_SUBJECT =
  "Quick intro — Sentinel, AI-native IDE for secure/legacy codebases";

export function buildEmailBody({
  firstName,
  senderName,
}: {
  firstName: string;
  senderName: string;
}): string {
  return `Hi ${firstName},

My name is ${senderName} and I'm the Business Development Specialist at Noah Labs.

We just launched Sentinel, an AI-native IDE built specifically for secure, regulated, and legacy software environments. Think C/C++, Ada, Fortran, COBOL, Rust. The codebases that power critical infrastructure and defense systems.

We were invited to debut it this week at the Department of the Air Force Modeling, Simulation and Analytics Summit in Colorado, and the response has been really strong.

I put together a short video that walks through what Sentinel does and where we're headed. I think it could be relevant to what you're working on and would love to get your take.

Would you be open to a quick call next week?

Best,
${senderName}
Business Development Specialist
Noah Labs`;
}
