const { Resend } = require('resend');

// ─── Resend Email Transport ───────────────────────────────────────────────────
const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_NAME = 'JobVault';
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

/**
 * Send an email via Resend.
 * Returns the Resend response on success, or null on failure (fails gracefully).
 */
const sendEmail = async ({ to, subject, html, text }) => {
    if (!process.env.RESEND_API_KEY) {
        console.warn('⚠️  RESEND_API_KEY not set — email not sent. Set it in your .env file.');
        return null;
    }

    try {
        const { data, error } = await resend.emails.send({
            from: `${FROM_NAME} <${FROM_EMAIL}>`,
            to: [to],
            subject,
            html,
            ...(text && { text }),
        });

        if (error) {
            console.error('Resend API error:', error);
            return null;
        }

        console.log('✅ Email sent via Resend:', data?.id);
        return data;
    } catch (err) {
        console.error('Email send error:', err.message);
        // Don't throw — email failure shouldn't crash the request
        return null;
    }
};

module.exports = { sendEmail };
