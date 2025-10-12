// Module d'intégration Email avec Nodemailer
const nodemailer = require('nodemailer');
const { logAction } = require('./database');

// Configuration du transporteur email
let transporter = null;

function initEmailTransporter() {
    if (process.env.EMAIL_HOST && process.env.EMAIL_USER) {
        transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: parseInt(process.env.EMAIL_PORT || '587'),
            secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        });
        
        console.log('✅ Email transporter initialized');
    } else {
        console.log('⚠️  Email not configured (set EMAIL_HOST, EMAIL_USER, EMAIL_PASSWORD in .env)');
    }
}

// Initialiser au démarrage
initEmailTransporter();

/**
 * Envoyer un email simple
 */
async function sendEmail(userId, to, subject, htmlContent, textContent = null) {
    if (!transporter) {
        throw new Error('Email service not configured');
    }
    
    try {
        console.log(`[${new Date().toISOString()}] [email] Envoi vers ${to}: ${subject}`);
        
        const info = await transporter.sendMail({
            from: `"Agent Skeleton OSS" <${process.env.EMAIL_USER}>`,
            to: to,
            subject: subject,
            text: textContent || subject,
            html: htmlContent
        });
        
        // Logger l'action
        if (userId) {
            logAction.run(userId, 'email_sent', JSON.stringify({
                to: to,
                subject: subject,
                messageId: info.messageId
            }), true, null);
        }
        
        console.log(`[${new Date().toISOString()}] [email] ✅ Email envoyé: ${info.messageId}`);
        
        return {
            success: true,
            messageId: info.messageId
        };
        
    } catch (error) {
        console.error(`[${new Date().toISOString()}] [email] ❌ Erreur:`, error.message);
        
        // Logger l'erreur
        if (userId) {
            logAction.run(userId, 'email_sent', JSON.stringify({
                to: to,
                subject: subject,
                error: error.message
            }), false, error.message);
        }
        
        throw error;
    }
}

/**
 * Envoyer un email de bienvenue
 */
async function sendWelcomeEmail(userId, userEmail, userName) {
    const subject = '🎉 Bienvenue sur Agent Skeleton OSS !';
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .feature { background: white; padding: 15px; margin: 10px 0; border-left: 4px solid #667eea; border-radius: 5px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🤖 Bienvenue ${userName} !</h1>
                <p>Votre Agent IA est prêt à vous servir</p>
            </div>
            <div class="content">
                <p>Bonjour <strong>${userName}</strong>,</p>
                <p>Merci de rejoindre <strong>Agent Skeleton OSS</strong> ! Votre compte est maintenant actif et vous avez accès à toutes nos fonctionnalités :</p>
                
                <div class="feature">
                    <h3>💬 Chat IA avec 60+ Modèles</h3>
                    <p>GPT-4, Claude, Gemini, Qwen et bien d'autres modèles à votre disposition.</p>
                </div>
                
                <div class="feature">
                    <h3>📁 Upload et Analyse de Fichiers</h3>
                    <p>Analysez vos documents PDF, Word, textes et images automatiquement.</p>
                </div>
                
                <div class="feature">
                    <h3>🔄 Workflows n8n</h3>
                    <p>Automatisez la création de contenu et la publication sur les réseaux sociaux.</p>
                </div>
                
                <div class="feature">
                    <h3>📱 Publication Multi-Plateformes</h3>
                    <p>YouTube, TikTok, Instagram, X, LinkedIn, Pinterest, Threads.</p>
                </div>
                
                <a href="${process.env.APP_URL || 'http://localhost:3000'}" class="button">🚀 Commencer maintenant</a>
                
                <p>Si vous avez des questions, n'hésitez pas à nous contacter.</p>
                
                <p>Bonne découverte !<br>L'équipe Agent Skeleton OSS</p>
            </div>
            <div class="footer">
                <p>Cet email a été envoyé à ${userEmail}</p>
                <p>Agent Skeleton OSS - Votre assistant IA intelligent</p>
            </div>
        </div>
    </body>
    </html>
    `;
    
    return await sendEmail(userId, userEmail, subject, html);
}

/**
 * Envoyer une notification d'activité
 */
async function sendActivityNotification(userId, userEmail, activityType, activityDetails) {
    const subject = `🔔 Nouvelle activité: ${activityType}`;
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; }
            .content { background: white; padding: 20px; border-radius: 10px; }
            .activity { background: #e7f3ff; padding: 15px; border-left: 4px solid #2196F3; margin: 15px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="content">
                <h2>🔔 Nouvelle Activité</h2>
                <div class="activity">
                    <strong>Type:</strong> ${activityType}<br>
                    <strong>Détails:</strong> ${activityDetails}<br>
                    <strong>Date:</strong> ${new Date().toLocaleString('fr-FR')}
                </div>
                <p><a href="${process.env.APP_URL || 'http://localhost:3000'}">Voir dans le dashboard</a></p>
            </div>
        </div>
    </body>
    </html>
    `;
    
    return await sendEmail(userId, userEmail, subject, html);
}

/**
 * Envoyer un rapport de contenu généré
 */
async function sendContentReport(userId, userEmail, contentType, contentDetails) {
    const subject = `✅ Votre contenu ${contentType} est prêt !`;
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #56ab2f 0%, #a8e063 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: white; padding: 30px; border-radius: 0 0 10px 10px; }
            .report { background: #f0f8f0; padding: 20px; border-radius: 10px; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>✅ Contenu Généré !</h1>
            </div>
            <div class="content">
                <p>Votre contenu <strong>${contentType}</strong> a été généré avec succès !</p>
                <div class="report">
                    ${contentDetails}
                </div>
                <p><a href="${process.env.APP_URL || 'http://localhost:3000'}">Voir le résultat</a></p>
            </div>
        </div>
    </body>
    </html>
    `;
    
    return await sendEmail(userId, userEmail, subject, html);
}

/**
 * Vérifier la configuration email
 */
async function verifyEmailConfig() {
    if (!transporter) {
        return {
            configured: false,
            verified: false
        };
    }
    
    try {
        await transporter.verify();
        return {
            configured: true,
            verified: true
        };
    } catch (error) {
        return {
            configured: true,
            verified: false,
            error: error.message
        };
    }
}

module.exports = {
    sendEmail,
    sendWelcomeEmail,
    sendActivityNotification,
    sendContentReport,
    verifyEmailConfig
};
