package com.mesnotescolab.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.from:noreply@mesnotescolab.com}")
    private String fromEmail;

    @Async
    public void sendWelcomeEmail(String toEmail, String userName) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("Bienvenue sur Mes Notes Colab !");
            message.setText(buildWelcomeEmailText(userName));
            
            mailSender.send(message);
            logger.info("Email de bienvenue envoyé à: {}", toEmail);
            
        } catch (Exception e) {
            logger.error("Erreur lors de l'envoi de l'email de bienvenue à {}: {}", toEmail, e.getMessage());
        }
    }

    @Async
    public void sendNotificationEmail(String toEmail, String subject, String content) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject(subject);
            message.setText(content);
            
            mailSender.send(message);
            logger.info("Email de notification envoyé à: {}", toEmail);
            
        } catch (Exception e) {
            logger.error("Erreur lors de l'envoi de l'email de notification à {}: {}", toEmail, e.getMessage());
        }
    }

    @Async
    public void sendNoteInvitation(String toEmail, String inviterName, String noteTitle, Long noteId, String permission) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("Invitation à collaborer sur une note");
            message.setText(buildNoteInvitationText(inviterName, noteTitle, permission));
            
            mailSender.send(message);
            logger.info("Email d'invitation note envoyé à: {}", toEmail);
            
        } catch (Exception e) {
            logger.error("Erreur lors de l'envoi de l'email d'invitation note à {}: {}", toEmail, e.getMessage());
        }
    }

    @Async
    public void sendWorkspaceInvitation(String toEmail, String inviterName, String workspaceName, Long workspaceId, String permission) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("Invitation à collaborer sur un workspace");
            message.setText(buildWorkspaceInvitationText(inviterName, workspaceName, permission));
            
            mailSender.send(message);
            logger.info("Email d'invitation workspace envoyé à: {}", toEmail);
            
        } catch (Exception e) {
            logger.error("Erreur lors de l'envoi de l'email d'invitation workspace à {}: {}", toEmail, e.getMessage());
        }
    }

    @Async
    public void sendFolderInvitation(String toEmail, String inviterName, String folderName, Long folderId, String permission) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("Invitation à collaborer sur un dossier");
            message.setText(buildFolderInvitationText(inviterName, folderName, permission));
            
            mailSender.send(message);
            logger.info("Email d'invitation dossier envoyé à: {}", toEmail);
            
        } catch (Exception e) {
            logger.error("Erreur lors de l'envoi de l'email d'invitation dossier à {}: {}", toEmail, e.getMessage());
        }
    }

    @Async
    public void sendNoteModificationNotification(String toEmail, String modifierName, String noteTitle, Long noteId) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("Note modifiée - " + noteTitle);
            message.setText(buildNoteModificationText(modifierName, noteTitle));
            
            mailSender.send(message);
            logger.info("Email de modification note envoyé à: {}", toEmail);
            
        } catch (Exception e) {
            logger.error("Erreur lors de l'envoi de l'email de modification note à {}: {}", toEmail, e.getMessage());
        }
    }

    private String buildWelcomeEmailText(String userName) {
        return String.format("""
            Bonjour %s,
            
            Bienvenue sur Mes Notes Colab !
            
            Votre compte a été créé avec succès. Vous pouvez maintenant :
            - Créer et organiser vos notes
            - Collaborer avec d'autres utilisateurs
            - Partager vos espaces de travail
            - Synchroniser vos données en temps réel
            
            Commencez dès maintenant en vous connectant à votre espace personnel.
            
            Bonne collaboration !
            
            L'équipe Mes Notes Colab
            """, userName);
    }

    private String buildNoteInvitationText(String inviterName, String noteTitle, String permission) {
        return String.format("""
            Bonjour,
            
            %s vous a invité à collaborer sur la note "%s" avec les permissions "%s".
            
            Connectez-vous à Mes Notes Colab pour commencer la collaboration.
            
            Cordialement,
            L'équipe Mes Notes Colab
            """, inviterName, noteTitle, permission);
    }

    private String buildWorkspaceInvitationText(String inviterName, String workspaceName, String permission) {
        return String.format("""
            Bonjour,
            
            %s vous a invité à collaborer sur le workspace "%s" avec les permissions "%s".
            
            Connectez-vous à Mes Notes Colab pour accéder au workspace.
            
            Cordialement,
            L'équipe Mes Notes Colab
            """, inviterName, workspaceName, permission);
    }

    private String buildFolderInvitationText(String inviterName, String folderName, String permission) {
        return String.format("""
            Bonjour,
            
            %s vous a invité à collaborer sur le dossier "%s" avec les permissions "%s".
            
            Connectez-vous à Mes Notes Colab pour accéder au dossier.
            
            Cordialement,
            L'équipe Mes Notes Colab
            """, inviterName, folderName, permission);
    }

    private String buildNoteModificationText(String modifierName, String noteTitle) {
        return String.format("""
            Bonjour,
            
            %s a modifié la note "%s" sur laquelle vous collaborez.
            
            Connectez-vous à Mes Notes Colab pour voir les modifications.
            
            Cordialement,
            L'équipe Mes Notes Colab
            """, modifierName, noteTitle);
    }
}