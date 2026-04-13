const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '465'),
    secure: true, // Forced secure for Gmail over 465
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false
    }
});

/**
 * Send an email to a conventionne partner when a reclamation is assigned
 * @param {string} to - Partner email
 * @param {object} reclamation - Reclamation details
 * @param {object} partner - Partner details (nom)
 */
const sendAssignmentEmail = async (to, reclamation, partner) => {
    const mailOptions = {
        from: process.env.EMAIL_FROM || '"OTIC Admin" <noreply@otic.tn>',
        to: to,
        subject: `[OTIC] Nouvelle Réclamation Affectée : ${reclamation.trackingCode}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                <div style="background-color: #1e3a8a; color: white; padding: 20px; text-align: center;">
                    <h2 style="margin: 0;">Nouvelle Affectation</h2>
                </div>
                <div style="padding: 20px; color: #334155; line-height: 1.6;">
                    <p>Bonjour <strong>${partner.nom}</strong>,</p>
                    <p>Une nouvelle réclamation vient de vous être affectée sur la plateforme OTIC.</p>
                    <div style="background-color: #f8fafc; border-radius: 6px; padding: 15px; margin: 20px 0;">
                        <h3 style="margin-top: 0; color: #1e3a8a; font-size: 16px;">Détails de la Réclamation :</h3>
                        <p style="margin: 5px 0;"><strong>Code :</strong> ${reclamation.trackingCode}</p>
                        <p style="margin: 5px 0;"><strong>Type :</strong> ${reclamation.type}</p>
                        <p style="margin: 5px 0;"><strong>Secteur :</strong> ${reclamation.secteur}</p>
                        <p style="margin: 5px 0;"><strong>Opérateur :</strong> ${reclamation.operateur || 'Non spécifié'}</p>
                        <p style="margin: 15px 0 5px 0;"><strong>Description :</strong></p>
                        <p style="margin: 0; font-style: italic; color: #64748b;">"${reclamation.description || 'Pas de description'}"</p>
                    </div>
                    <p>Veuillez vous connecter à votre espace partenaire pour traiter ce dossier dès que possible.</p>
                </div>
                <div style="background-color: #f1f5f9; padding: 15px; text-align: center; color: #94a3b8; font-size: 12px;">
                    © 2026 Organisation Tunisienne pour l'Information du Consommateur (OTIC)
                </div>
            </div>
        `
    };

    try {
        console.log(`[EmailService] Attempting to send assignment email to ${to}`);
        const info = await transporter.sendMail(mailOptions);
        console.log('[EmailService] Email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('[EmailService] Error sending email:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Send a welcome email to a new consumer
 * @param {string} to - Consumer email
 * @param {object} user - User details (nom, prenom)
 */
const sendWelcomeEmail = async (to, user) => {
    const mailOptions = {
        from: process.env.EMAIL_FROM || '"OTIC Support" <noreply@otic.tn>',
        to: to,
        subject: 'Bienvenue chez OTIC - Votre compte a été créé avec succès',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                <div style="background-color: #1e3a8a; color: white; padding: 25px; text-align: center;">
                    <h2 style="margin: 0;">Bienvenue chez OTIC !</h2>
                </div>
                <div style="padding: 25px; color: #334155; line-height: 1.6;">
                    <p>Bonjour <strong>${user.prenom} ${user.nom}</strong>,</p>
                    <p>Nous sommes ravis de vous accueillir sur la plateforme de l'<strong>Organisation Tunisienne pour l'Information du Consommateur (OTIC)</strong>.</p>
                    <p>Votre compte a été créé avec succès. Vous pouvez désormais :</p>
                    <ul style="color: #475569;">
                        <li>Déposer vos réclamations en ligne</li>
                        <li>Suivre l'état d'avancement de vos dossiers en temps réel</li>
                        <li>Accéder à des informations et conseils pour les consommateurs</li>
                        <li>Contacter nos conseillers directement</li>
                    </ul>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${process.env.FRONTEND_URL || 'http://localhost:4200'}/login" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Accéder à mon espace</a>
                    </div>
                    <p>Si vous n'êtes pas à l'origine de cette inscription, veuillez ignorer cet email ou contacter notre support.</p>
                    <p>À bientôt,<br>L'équipe OTIC</p>
                </div>
                <div style="background-color: #f1f5f9; padding: 15px; text-align: center; color: #94a3b8; font-size: 12px;">
                    © 2026 Organisation Tunisienne pour l'Information du Consommateur (OTIC)<br>
                    Tunis, Tunisie
                </div>
            </div>
        `
    };

    try {
        console.log(`[EmailService] Attempting to send welcome email to ${to}`);
        const info = await transporter.sendMail(mailOptions);
        console.log('[EmailService] Welcome email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('[EmailService] Error sending welcome email:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Send a reset password link to a user
 * @param {string} to - User email
 * @param {string} link - Reset URL
 */
const sendResetLinkEmail = async (to, link) => {
    const mailOptions = {
        from: process.env.EMAIL_FROM || '"OTIC Sécurité" <noreply@otic.tn>',
        to: to,
        subject: '[OTIC] Réinitialisation de votre mot de passe',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                <div style="background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%); color: white; padding: 40px 20px; text-align: center;">
                    <h2 style="margin: 0; font-size: 24px;">Réinitialisation du compte</h2>
                </div>
                <div style="padding: 40px; color: #334155; line-height: 1.6;">
                    <p style="font-size: 16px;">Bonjour,</p>
                    <p style="font-size: 16px;">Vous avez demandé à réinitialiser votre mot de passe pour votre compte OTIC. Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe :</p>
                    
                    <div style="text-align: center; margin: 40px 0;">
                        <a href="${link}" style="background-color: #2563eb; color: white; padding: 16px 32px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.2);">Réinitialiser mon mot de passe</a>
                    </div>
                    
                    <p style="color: #64748b; font-size: 14px; text-align: center;">Ce bouton est valable pendant 1 heure. Si vous n'avez pas demandé ce changement, vous pouvez ignorer cet email.</p>
                </div>
                <div style="background-color: #f8fafc; padding: 20px; text-align: center; color: #94a3b8; font-size: 12px; border-top: 1px solid #f1f5f9;">
                    © 2026 Organisation Tunisienne pour l'Information du Consommateur (OTIC)
                </div>
            </div>
        `
    };

    try {
        console.log(`[EmailService] Sending reset link to ${to}`);
        const info = await transporter.sendMail(mailOptions);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('[EmailService] Error sending reset link email:', error);
        return { success: false, error: error.message };
    }
};

module.exports = {
    sendAssignmentEmail,
    sendWelcomeEmail,
    sendResetLinkEmail
};
