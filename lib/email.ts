const FROM = "North Legends FC <noreply@elcucho.dev>";

function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

async function send(to: string, subject: string, html: string): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: false, error: "Email not configured" };

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to: [to], subject, html }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    return { ok: false, error: `Resend error ${res.status}: ${body}` };
  }
  return { ok: true };
}

export async function sendParentPasswordReset(to: string, token: string) {
  const url = `${getBaseUrl()}/parent/reset?token=${token}`;
  return send(
    to,
    "Reset your North Legends FC password",
    `<!DOCTYPE html><html><body style="font-family:sans-serif;background:#0a1628;color:#fff;padding:40px 20px;margin:0">
      <div style="max-width:480px;margin:0 auto;background:#111827;border-radius:16px;padding:32px;border:1px solid rgba(255,255,255,0.1)">
        <img src="${getBaseUrl()}/logo.jpg" width="64" height="64" style="border-radius:50%;border:3px solid #c9a24b;margin-bottom:20px" alt="North Legends FC"/>
        <h1 style="color:#fff;font-size:22px;margin:0 0 8px">Reset your password</h1>
        <p style="color:#9ca3af;font-size:14px;margin:0 0 24px">Click the button below to set a new password for your parent account. This link expires in 1 hour.</p>
        <a href="${url}" style="display:inline-block;background:#c9a24b;color:#0a1628;font-weight:700;padding:14px 28px;border-radius:10px;text-decoration:none;font-size:15px">Reset Password</a>
        <p style="color:#6b7280;font-size:12px;margin:24px 0 0">If you didn't request this, you can safely ignore this email.</p>
      </div>
    </body></html>`
  );
}

export async function sendAdminPasswordReset(to: string, token: string) {
  const url = `${getBaseUrl()}/admin/reset?token=${token}`;
  return send(
    to,
    "Reset your North Legends FC admin password",
    `<!DOCTYPE html><html><body style="font-family:sans-serif;background:#1c1c1e;color:#fff;padding:40px 20px;margin:0">
      <div style="max-width:480px;margin:0 auto;background:#18181b;border-radius:16px;padding:32px;border:1px solid rgba(255,255,255,0.08)">
        <img src="${getBaseUrl()}/logo.jpg" width="64" height="64" style="border-radius:50%;border:3px solid #c9a24b;margin-bottom:20px" alt="North Legends FC"/>
        <h1 style="color:#fff;font-size:22px;margin:0 0 8px">Reset your admin password</h1>
        <p style="color:#9ca3af;font-size:14px;margin:0 0 24px">Click the button below to set a new password for your coach account. This link expires in 1 hour.</p>
        <a href="${url}" style="display:inline-block;background:#c9a24b;color:#1c1c1e;font-weight:700;padding:14px 28px;border-radius:10px;text-decoration:none;font-size:15px">Reset Password</a>
        <p style="color:#6b7280;font-size:12px;margin:24px 0 0">If you didn't request this, you can safely ignore this email.</p>
      </div>
    </body></html>`
  );
}
