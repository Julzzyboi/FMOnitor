package com.FMOnitor_SpringWeb.FMOnitor_WebBE.service;

import javax.mail.MessagingException;
import javax.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;
    private final String fromAddress;
    private final String frontendUrl;

    public EmailService(JavaMailSender mailSender,
                         @Value("${app.mail.from-address}") String fromAddress,
                         @Value("${app.frontend-url}") String frontendUrl) {
        this.mailSender = mailSender;
        this.fromAddress = fromAddress;
        this.frontendUrl = frontendUrl;
    }

    public void sendInvite(String toEmail, String toName, String invitedRole) {
        String plainText =
            "Hi " + toName + ",\n\n"
            + "You've been invited to join FMOnitor as a " + invitedRole + ".\n\n"
            + "Sign in with your Google account to activate your account:\n"
            + frontendUrl + "\n\n"
            + "— FMOnitor";

        String html =
            "<p>Hi " + escapeHtml(toName) + ",</p>"
            + "<p>You've been invited to join FMOnitor as a " + escapeHtml(invitedRole) + ".</p>"
            + "<p><a href=\"" + frontendUrl + "\">Sign in with your Google account to activate your account</a></p>"
            + "<p>— FMOnitor</p>";

        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(toEmail);
            helper.setSubject("You've been invited to FMOnitor");
            helper.setText(plainText, html);
            mailSender.send(mimeMessage);
        } catch (MessagingException e) {
            throw new RuntimeException("Failed to build invite email", e);
        }
    }

    private static String escapeHtml(String value) {
        return value
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace("\"", "&quot;")
            .replace("'", "&#39;");
    }
}
