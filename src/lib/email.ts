import { Resend } from 'resend';

// Lazy-init to avoid build-time crash when RESEND_API_KEY is not set.
// Resets if the key changes or is removed between calls.
let _resend: Resend | null = null;
let _resendKey: string | undefined;

function getApiKeyError(): string | null {
    if (!process.env.RESEND_API_KEY) {
        console.error('[email] RESEND_API_KEY is not configured');
        return 'Email service is not configured. Contact your administrator.';
    }
    return null;
}

function getResend(): Resend {
    const currentKey = process.env.RESEND_API_KEY;
    if (!_resend || currentKey !== _resendKey) {
        _resend = new Resend(currentKey);
        _resendKey = currentKey;
    }
    return _resend;
}

export async function sendInviteEmail({
    to,
    inviteToken,
    fundName,
    inviterName,
    orgSlug,
}: {
    to: string;
    inviteToken: string;
    fundName: string;
    inviterName: string;
    orgSlug?: string;
}): Promise<{ success: boolean; error?: string }> {
    const keyError = getApiKeyError();
    if (keyError) return { success: false, error: keyError };

    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    let acceptUrl: string;
    if (orgSlug) {
        const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || process.env.ROOT_DOMAIN || 'blackgem.ai';
        const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
        acceptUrl = `${protocol}://${orgSlug}.${rootDomain}/accept-invite?token=${inviteToken}`;
    } else {
        acceptUrl = `${baseUrl}/accept-invite?token=${inviteToken}`;
    }

    try {
        const { error: sendError } = await getResend().emails.send({
            from: process.env.RESEND_FROM_EMAIL || 'BlackGem <noreply@blackgem.app>',
            to,
            subject: `You've been invited to ${fundName} on BlackGem`,
            html: `
                <div style="font-family: 'Inter', system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background-color: #11141D; padding: 32px; text-align: center;">
                        <h1 style="color: #F8FAFC; font-size: 25px; margin: 0; font-family: Georgia, 'Times New Roman', serif;">
                            <span style="font-weight: 400; letter-spacing: -0.01em;">Black</span><span style="font-weight: 600; letter-spacing: 0.03em;">Gem</span>
                        </h1>
                    </div>
                    <div style="padding: 32px; background-color: #F9FAFB;">
                        <h2 style="color: #11141D; font-size: 20px; margin-bottom: 16px;">
                            You've been invited to access ${fundName}
                        </h2>
                        <p style="color: #475569; font-size: 15px; line-height: 1.6;">
                            ${inviterName} has invited you to the ${fundName} investor portal on BlackGem.
                            Click the button below to set up your account and access your investment information.
                        </p>
                        <div style="text-align: center; margin: 32px 0;">
                            <a href="${acceptUrl}"
                               style="display: inline-block; background-color: #3E5CFF; color: white; padding: 12px 32px;
                                      text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 15px;">
                                Accept Invitation
                            </a>
                        </div>
                        <p style="color: #94A3B8; font-size: 13px; line-height: 1.5;">
                            This invitation expires in 7 days. If you did not expect this invitation,
                            you can safely ignore this email.
                        </p>
                    </div>
                    <div style="padding: 16px 32px; background-color: #F1F5F9; text-align: center;">
                        <p style="color: #94A3B8; font-size: 12px; margin: 0; font-family: Georgia, 'Times New Roman', serif;">
                            BlackGem — Institutional excellence from day one
                        </p>
                    </div>
                </div>
            `,
        });

        if (sendError) {
            console.error('[email] Resend API error (invite):', sendError);
            return { success: false, error: `Email delivery failed: ${sendError.message ?? 'Unknown error'}` };
        }

        return { success: true };
    } catch (error) {
        console.error('[email] Failed to send invite email:', error);
        return { success: false, error: 'Failed to send invitation email' };
    }
}

export async function sendWelcomeEmail({
    to,
    userName,
    fundName,
    orgSlug,
}: {
    to: string;
    userName: string;
    fundName: string;
    orgSlug: string;
}): Promise<{ success: boolean; error?: string }> {
    const keyError = getApiKeyError();
    if (keyError) return { success: false, error: keyError };

    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || process.env.ROOT_DOMAIN || 'blackgem.ai';
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const dashboardUrl = process.env.NODE_ENV === 'production'
        ? `${protocol}://${orgSlug}.${rootDomain}/dashboard`
        : `http://localhost:3002/dashboard`;

    try {
        const { error: sendError } = await getResend().emails.send({
            from: process.env.RESEND_FROM_EMAIL || 'BlackGem <noreply@blackgem.app>',
            to,
            subject: 'Welcome to BlackGem — Your fund is ready',
            html: `
                <div style="font-family: 'Inter', system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background-color: #11141D; padding: 32px; text-align: center;">
                        <h1 style="color: #F8FAFC; font-size: 25px; margin: 0; font-family: Georgia, 'Times New Roman', serif;">
                            <span style="font-weight: 400; letter-spacing: -0.01em;">Black</span><span style="font-weight: 600; letter-spacing: 0.03em;">Gem</span>
                        </h1>
                    </div>
                    <div style="padding: 32px; background-color: #F9FAFB;">
                        <h2 style="color: #11141D; font-size: 20px; margin-bottom: 16px;">
                            Welcome, ${userName}
                        </h2>
                        <p style="color: #475569; font-size: 15px; line-height: 1.6;">
                            Your fund <strong>${fundName}</strong> is set up and ready to go.
                        </p>
                        <div style="text-align: center; margin: 32px 0;">
                            <a href="${dashboardUrl}"
                               style="display: inline-block; background-color: #3E5CFF; color: white; padding: 12px 32px;
                                      text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 15px;">
                                Go to Dashboard
                            </a>
                        </div>
                        <p style="color: #475569; font-size: 14px; line-height: 1.6; margin-top: 24px;">
                            <strong>Next steps:</strong>
                        </p>
                        <ul style="color: #475569; font-size: 14px; line-height: 1.8; padding-left: 20px;">
                            <li>Configure your fund settings</li>
                            <li>Add your first deal</li>
                            <li>Invite your investors</li>
                        </ul>
                    </div>
                    <div style="padding: 16px 32px; background-color: #F1F5F9; text-align: center;">
                        <p style="color: #94A3B8; font-size: 12px; margin: 0; font-family: Georgia, 'Times New Roman', serif;">
                            BlackGem — Institutional excellence from day one
                        </p>
                    </div>
                </div>
            `,
        });

        if (sendError) {
            console.error('[email] Resend API error (welcome):', sendError);
            return { success: false, error: `Email delivery failed: ${sendError.message ?? 'Unknown error'}` };
        }

        return { success: true };
    } catch (error) {
        console.error('[email] Failed to send welcome email:', error);
        return { success: false, error: 'Failed to send welcome email' };
    }
}

export async function sendInvestorEmail({
    to,
    subject,
    investorName,
    message,
}: {
    to: string;
    subject: string;
    investorName: string;
    message: string;
}): Promise<{ success: boolean; error?: string }> {
    const keyError = getApiKeyError();
    if (keyError) return { success: false, error: keyError };

    try {
        const { error: sendError } = await getResend().emails.send({
            from: process.env.RESEND_FROM_EMAIL || 'BlackGem <noreply@blackgem.app>',
            to,
            subject,
            html: `
                <div style="font-family: 'Inter', system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background-color: #11141D; padding: 32px; text-align: center;">
                        <h1 style="color: #F8FAFC; font-size: 25px; margin: 0; font-family: Georgia, 'Times New Roman', serif;">
                            <span style="font-weight: 400; letter-spacing: -0.01em;">Black</span><span style="font-weight: 600; letter-spacing: 0.03em;">Gem</span>
                        </h1>
                    </div>
                    <div style="padding: 32px; background-color: #F9FAFB;">
                        <p style="color: #475569; font-size: 15px; line-height: 1.6; margin-bottom: 8px;">
                            Dear ${investorName},
                        </p>
                        <div style="color: #11141D; font-size: 15px; line-height: 1.7; white-space: pre-wrap;">
${message}
                        </div>
                    </div>
                    <div style="padding: 16px 32px; background-color: #F1F5F9; text-align: center;">
                        <p style="color: #94A3B8; font-size: 12px; margin: 0; font-family: Georgia, 'Times New Roman', serif;">
                            BlackGem — Institutional excellence from day one
                        </p>
                    </div>
                </div>
            `,
        });

        if (sendError) {
            console.error('[email] Resend API error (investor):', sendError);
            return { success: false, error: `Email delivery failed: ${sendError.message ?? 'Unknown error'}` };
        }

        return { success: true };
    } catch (error) {
        console.error('[email] Failed to send investor email:', error);
        return { success: false, error: 'Failed to send email' };
    }
}
