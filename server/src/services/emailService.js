const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async ({ to, subject, html, text }) => {
    try {
        const { data, error } = await resend.emails.send({
            from: process.env.FROM_EMAIL || 'GoJob <noreply@gojob.app>',
            to,
            subject,
            html,
            text,
        });
        if (error) throw new Error(error.message);
        return data;
    } catch (err) {
        console.error('Email send error:', err.message);
        // Don't throw — email failure shouldn't crash the request
        return null;
    }
};

module.exports = { sendEmail };
