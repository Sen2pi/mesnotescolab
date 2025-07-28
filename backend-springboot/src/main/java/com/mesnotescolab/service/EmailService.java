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
}