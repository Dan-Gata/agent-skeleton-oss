/**
 * EmailAgent - Sous-agent spécialisé dans l'envoi d'emails
 */

class EmailAgent {
    constructor(config = {}) {
        this.config = {
            smtpHost: config.smtpHost || process.env.SMTP_HOST,
            smtpPort: config.smtpPort || process.env.SMTP_PORT || 587,
            smtpUser: config.smtpUser || process.env.SMTP_USER,
            smtpPass: config.smtpPass || process.env.SMTP_PASS,
            fromEmail: config.fromEmail || process.env.FROM_EMAIL || 'noreply@kaussan-air.org'
        };
        
        console.log('📧 [EmailAgent] Initialisé');
    }

    /**
     * Envoyer un email
     */
    async sendEmail(params) {
        console.log(`📤 [EmailAgent] Envoi email à: ${params.to}`);
        
        if (!params.to) {
            throw new Error('Adresse email destinataire requise');
        }
        
        // TODO: Intégrer vraie bibliothèque SMTP (nodemailer)
        // Pour l'instant, simulation
        
        const emailData = {
            from: this.config.fromEmail,
            to: params.to,
            subject: params.subject || 'Message de votre assistant IA',
            body: params.content || params.body,
            sentAt: new Date().toISOString()
        };
        
        console.log(`✅ [EmailAgent] Email simulé envoyé`);
        
        return {
            status: 'sent',
            message: `Email envoyé à ${params.to} (simulation)`,
            emailData,
            note: 'Configurez SMTP_HOST, SMTP_USER, SMTP_PASS pour envoi réel'
        };
    }

    /**
     * Envoyer un email HTML
     */
    async sendHTMLEmail(to, subject, htmlContent) {
        console.log(`📤 [EmailAgent] Envoi email HTML à: ${to}`);
        
        return await this.sendEmail({
            to,
            subject,
            content: htmlContent,
            html: true
        });
    }

    /**
     * Envoyer un email avec pièce jointe
     */
    async sendEmailWithAttachment(to, subject, content, attachment) {
        console.log(`📤 [EmailAgent] Envoi email avec PJ à: ${to}`);
        
        return {
            status: 'sent',
            message: `Email avec PJ envoyé à ${to} (simulation)`,
            attachment: attachment.filename,
            note: 'Implémentation complète nécessite configuration SMTP'
        };
    }
}

module.exports = EmailAgent;
