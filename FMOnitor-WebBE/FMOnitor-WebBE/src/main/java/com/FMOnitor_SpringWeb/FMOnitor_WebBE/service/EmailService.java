package com.FMOnitor_SpringWeb.FMOnitor_WebBE.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;
    private final String fromAddress;
    private final String frontendUrl;

    public EmailService(JavaMailSender mailSender,
                         @Value("${spring.mail.username}") String fromAddress,
                         @Value("${app.frontend-url}") String frontendUrl) {
        this.mailSender = mailSender;
        this.fromAddress = fromAddress;
        this.frontendUrl = frontendUrl;
    }

    public void sendInvite(String toEmail, String toName, String invitedRole) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromAddress);
        message.setTo(toEmail);
        message.setSubject("You've been invited to FMOnitor");
        message.setText(
            "Hi " + toName + ",\n\n"
            + "You've been invited to join FMOnitor as a " + invitedRole + ".\n\n"
            + "Sign in with your Google account to activate your account:\n"
            + frontendUrl + "\n\n"
            + "— FMOnitor"
        );
        mailSender.send(message);
    }
}
