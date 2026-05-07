export const EMAIL_SUBJECT =
  "Quick intro — Sentinel, AI-native IDE for secure/legacy codebases";

const VIDEO_URL =
  "https://www.linkedin.com/posts/the-first-ai-ide-for-government-and-regulated-ugcPost-7457091645403103234-pT57/?utm_source=share&utm_medium=member_ios&rcm=ACoAACpFpu8B_2gYejV0rDS_po9et8diIRvSNVQ";

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

export function buildEmailHtml({
  firstName,
  senderName,
}: {
  firstName: string;
  senderName: string;
}): string {
  return `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#000;">
<p>Hi ${firstName},</p>

<p>My name is ${senderName} and I'm the Business Development Specialist at Noah Labs.</p>

<p>We just launched Sentinel, an AI-native IDE built specifically for secure, regulated, and legacy software environments. Think C/C++, Ada, Fortran, COBOL, Rust. The codebases that power critical infrastructure and defense systems.</p>

<p>We were invited to debut it this week at the Department of the Air Force Modeling, Simulation and Analytics Summit in Colorado, and the response has been really strong.</p>

<p>I put together a <a href="${VIDEO_URL}" style="color:#1a73e8;">short video</a> that walks through what Sentinel does and where we're headed. I think it could be relevant to what you're working on and would love to get your take.</p>

<p>Would you be open to a quick call next week?</p>

<p>Best,<br>
${senderName}<br>
Business Development Specialist<br>
Noah Labs</p>
</div>`;
}
