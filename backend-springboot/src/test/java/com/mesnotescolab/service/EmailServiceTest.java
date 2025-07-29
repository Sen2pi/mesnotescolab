package com.mesnotescolab.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("EmailService Tests")
class EmailServiceTest {

    @Mock
    private JavaMailSender mailSender;

    @InjectMocks
    private EmailService emailService;

    private final String fromEmail = "noreply@mesnotescolab.com";

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(emailService, "fromEmail", fromEmail);
    }

    @Test
    @DisplayName("Should send welcome email successfully")
    void shouldSendWelcomeEmailSuccessfully() {
        // Given
        String toEmail = "user@example.com";
        String userName = "Test User";

        doNothing().when(mailSender).send(any(SimpleMailMessage.class));

        // When
        emailService.sendWelcomeEmail(toEmail, userName);

        // Then
        verify(mailSender).send(any(SimpleMailMessage.class));
    }

    @Test
    @DisplayName("Should handle email sending failure gracefully")
    void shouldHandleEmailSendingFailureGracefully() {
        // Given
        String toEmail = "user@example.com";
        String userName = "Test User";

        doThrow(new RuntimeException("Email sending failed"))
                .when(mailSender).send(any(SimpleMailMessage.class));

        // When & Then (should not throw exception)
        emailService.sendWelcomeEmail(toEmail, userName);

        verify(mailSender).send(any(SimpleMailMessage.class));
    }

    @Test
    @DisplayName("Should send notification email successfully")
    void shouldSendNotificationEmailSuccessfully() {
        // Given
        String toEmail = "user@example.com";
        String subject = "Test Notification";
        String content = "This is a test notification";

        doNothing().when(mailSender).send(any(SimpleMailMessage.class));

        // When
        emailService.sendNotificationEmail(toEmail, subject, content);

        // Then
        verify(mailSender).send(any(SimpleMailMessage.class));
    }


    @Test
    @DisplayName("Should not send email when toEmail is null")
    void shouldNotSendEmailWhenToEmailIsNull() {
        // Given
        String toEmail = null;
        String userName = "Test User";

        // When
        emailService.sendWelcomeEmail(toEmail, userName);

        // Then
        verify(mailSender, never()).send(any(SimpleMailMessage.class));
    }

    @Test
    @DisplayName("Should not send email when toEmail is empty")
    void shouldNotSendEmailWhenToEmailIsEmpty() {
        // Given
        String toEmail = "";
        String userName = "Test User";

        // When
        emailService.sendWelcomeEmail(toEmail, userName);

        // Then
        verify(mailSender, never()).send(any(SimpleMailMessage.class));
    }

    @Test
    @DisplayName("Should send email with correct content structure")
    void shouldSendEmailWithCorrectContentStructure() {
        // Given
        String toEmail = "user@example.com";
        String userName = "Test User";

        // When
        emailService.sendWelcomeEmail(toEmail, userName);

        // Then
        verify(mailSender).send(argThat(message -> {
            SimpleMailMessage mail = (SimpleMailMessage) message;
            return mail.getTo()[0].equals(toEmail) &&
                   mail.getFrom().equals(fromEmail) &&
                   mail.getSubject().contains("Bienvenue") &&
                   mail.getText().contains(userName);
        }));
    }
}