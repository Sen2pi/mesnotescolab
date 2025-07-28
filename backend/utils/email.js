const nodemailer = require('nodemailer');

// Configuration du transporteur email
const createTransporter = () => {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Template email de bienvenue
const welcomeEmailTemplate = (nom, email) => ({
  subject: 'Bienvenue sur Mes Notes Colab ! 🎉',
  html: `
    <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Mes Notes Colab</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Collaboration simplifiée</p>
      </div>
      
      <div style="padding: 40px 20px; background: #f8f9fa;">
        <h2 style="color: #333; margin-bottom: 20px;">Bonjour ${nom} ! 👋</h2>
        
        <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
          Bienvenue dans votre espace de collaboration pour notes ! Vous pouvez maintenant :
        </p>
        
        <ul style="color: #666; line-height: 1.8;">
          <li>📝 Créer et éditer des notes en Markdown</li>
          <li>👥 Collaborer en temps réel avec d'autres utilisateurs</li>
          <li>🔗 Partager vos notes facilement</li>
          <li>🏷️ Organiser avec des étiquettes</li>
          <li>🔔 Recevoir des notifications de modifications</li>
        </ul>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.CLIENT_URL}" 
             style="background: #667eea; color: white; padding: 12px 30px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            Commencer à utiliser l'application
          </a>
        </div>
        
        <p style="color: #999; font-size: 14px; text-align: center;">
          Si vous avez des questions, n'hésitez pas à nous contacter.
        </p>
      </div>
    </div>
  `
});

// Template email d'invitation à une note
const noteInvitationTemplate = (invitedBy, noteTitle, noteId, permission) => ({
  subject: `${invitedBy} vous a invité à collaborer sur "${noteTitle}"`,
  html: `
    <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Invitation à collaborer</h1>
      </div>
      
      <div style="padding: 30px 20px; background: #f8f9fa;">
        <h2 style="color: #333; margin-bottom: 20px;">Nouvelle invitation ! 🤝</h2>
        
        <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
          <strong>${invitedBy}</strong> vous a invité à collaborer sur la note :
        </p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #333;">${noteTitle}</h3>
          <p style="margin: 0; color: #666; font-size: 14px;">
            Permission accordée : <strong>${permission}</strong>
          </p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.CLIENT_URL}/notes/${noteId}" 
             style="background: #667eea; color: white; padding: 12px 30px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            Voir la note
          </a>
        </div>
      </div>
    </div>
  `
});

// Template email de notification de modification
const noteModificationTemplate = (modifiedBy, noteTitle, noteId) => ({
  subject: `"${noteTitle}" a été modifiée`,
  html: `
    <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
      <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 30px 20px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Note modifiée</h1>
      </div>
      
      <div style="padding: 30px 20px; background: #f8f9fa;">
        <h2 style="color: #333; margin-bottom: 20px;">Mise à jour ! ✏️</h2>
        
        <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
          <strong>${modifiedBy}</strong> a apporté des modifications à la note :
        </p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #28a745; margin: 20px 0;">
          <h3 style="margin: 0; color: #333;">${noteTitle}</h3>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.CLIENT_URL}/notes/${noteId}" 
             style="background: #28a745; color: white; padding: 12px 30px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            Voir les modifications
          </a>
        </div>
      </div>
    </div>
  `
});

// Fonction pour envoyer un email
const sendEmail = async (to, template) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"Mes Notes Colab" <${process.env.EMAIL_USER}>`,
      to,
      subject: template.subject,
      html: template.html
    };
    
    const result = await transporter.sendMail(mailOptions);
    console.log('Email envoyé avec succès:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Erreur envoi email:', error);
    return { success: false, error: error.message };
  }
};

// Fonctions utilitaires
const sendWelcomeEmail = (email, nom) => {
  return sendEmail(email, welcomeEmailTemplate(nom, email));
};

const sendNoteInvitation = (email, invitedBy, noteTitle, noteId, permission) => {
  return sendEmail(email, noteInvitationTemplate(invitedBy, noteTitle, noteId, permission));
};

const sendNoteModificationNotification = (email, modifiedBy, noteTitle, noteId) => {
  return sendEmail(email, noteModificationTemplate(modifiedBy, noteTitle, noteId));
};

// Template email d'invitation à un workspace
const workspaceInvitationTemplate = (invitedBy, workspaceName, workspaceId, permission) => ({
  subject: `Invitation à collaborer sur le workspace "${workspaceName}"`,
  html: `
    <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Invitation workspace</h1>
      </div>
      
      <div style="padding: 30px 20px; background: #f8f9fa;">
        <h2 style="color: #333; margin-bottom: 20px;">Nouvelle invitation ! 🏢</h2>
        
        <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
          <strong>${invitedBy}</strong> vous a invité à collaborer sur le workspace :
        </p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #333;">${workspaceName}</h3>
          <p style="margin: 0; color: #666; font-size: 14px;">
            Permission accordée : <strong>${permission}</strong>
          </p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.CLIENT_URL}/workspaces/${workspaceId}" 
             style="background: #667eea; color: white; padding: 12px 30px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            Accéder au workspace
          </a>
        </div>
      </div>
    </div>
  `
});

// Template email d'invitation à un dossier
const folderInvitationTemplate = (invitedBy, folderName, folderId, permission) => ({
  subject: `Invitation à collaborer sur le dossier "${folderName}"`,
  html: `
    <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
      <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px 20px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Invitation dossier</h1>
      </div>
      
      <div style="padding: 30px 20px; background: #f8f9fa;">
        <h2 style="color: #333; margin-bottom: 20px;">Nouvelle invitation ! 📁</h2>
        
        <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
          <strong>${invitedBy}</strong> vous a invité à collaborer sur le dossier :
        </p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #333;">${folderName}</h3>
          <p style="margin: 0; color: #666; font-size: 14px;">
            Permission accordée : <strong>${permission}</strong>
          </p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.CLIENT_URL}/folders/${folderId}" 
             style="background: #10b981; color: white; padding: 12px 30px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            Accéder au dossier
          </a>
        </div>
      </div>
    </div>
  `
});

const sendWorkspaceInvitation = (email, invitedBy, workspaceName, workspaceId, permission) => {
  return sendEmail(email, workspaceInvitationTemplate(invitedBy, workspaceName, workspaceId, permission));
};

const sendFolderInvitation = (email, invitedBy, folderName, folderId, permission) => {
  return sendEmail(email, folderInvitationTemplate(invitedBy, folderName, folderId, permission));
};

module.exports = {
  sendWelcomeEmail,
  sendNoteInvitation,
  sendNoteModificationNotification,
  sendWorkspaceInvitation,
  sendFolderInvitation,
  sendEmail
};