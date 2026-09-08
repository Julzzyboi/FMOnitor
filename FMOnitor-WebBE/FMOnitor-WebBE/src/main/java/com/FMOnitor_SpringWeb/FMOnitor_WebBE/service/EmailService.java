package com.FMOnitor_SpringWeb.FMOnitor_WebBE.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;
    private final String fromAddress;
    private final String frontendUrl;

    // Deliberately a separate property from spring.mail.username: that one is
    // the SMTP *login* Brevo authenticates the connection with (an
    // auto-generated address like "b76a5f001@smtp-brevo.com"), not something
    // a recipient should see as who the invite is "from" - this is the
    // actual verified sender address configured in Brevo's dashboard.
    public EmailService(JavaMailSender mailSender,
                         @Value("${app.mail.from-address}") String fromAddress,
                         @Value("${app.frontend-url}") String frontendUrl) {
        this.mailSender = mailSender;
        this.fromAddress = fromAddress;
        this.frontendUrl = frontendUrl;
    }

    public void sendInvite(String toEmail, String toName, String invitedRole) {
        // Plain SimpleMailMessage only ever sends text/plain - most mail clients
        // auto-linkify a bare URL in that, but not reliably all of them. A real
        // multipart message (HTML with a text/plain fallback) makes the invite
        // link an actual clickable <a>, and still degrades gracefully for any
        // client that only renders plain text.
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
            // Same failure shape as before (RuntimeException) so the try/catch
            // around the call site in AccountController still catches it and
            // keeps the account row instead of failing the whole invite.
            throw new RuntimeException("Failed to build invite email", e);
        }
    }

    // toName/invitedRole ultimately come from admin input (email local-part or
    // a typed name, and a role string) - escape before splicing into HTML so
    // neither can break the markup or inject anything into the email body.
    private static String escapeHtml(String value) {
        return value
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace("\"", "&quot;")
            .replace("'", "&#39;");
    }
}
