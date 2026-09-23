package com.FMOnitor_SpringWeb.FMOnitor_WebBE.security;

import com.FMOnitor_SpringWeb.FMOnitor_WebBE.model.tbl_LoginLogs;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.model.tbl_Users;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.repo.tbl_LoginLogsRepo;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.repo.tbl_UsersRepo;

import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
public class UserProvisioningService {

    private static final String DEFAULT_ROLE = "Requestor";
    private static final String STATUS_ACTIVE = "Active";
    private static final String STATUS_UNREGISTERED = "Unregistered";
    private static final String STATUS_DISABLED = "Disabled";
    private static final String STATUS_DELETED = "Deleted";

    private final tbl_UsersRepo usersRepo;
    private final tbl_LoginLogsRepo loginLogsRepo;

    public UserProvisioningService(tbl_UsersRepo usersRepo, tbl_LoginLogsRepo loginLogsRepo) {
        this.usersRepo = usersRepo;
        this.loginLogsRepo = loginLogsRepo;
    }

    public tbl_Users provisionFromGoogle(String googleSub, String email, String name, String pictureUrl) {
        tbl_Users user = usersRepo.findByGoogleSub(googleSub).orElse(null);
        if (user == null) {
            user = usersRepo.findByEmail(email).orElse(null);
        }

        if (user == null) {
            throw new OAuth2AuthenticationException(new OAuth2Error("unauthorized_user"),
                "No FMOnitor account exists for " + email);
        }

        if (STATUS_DISABLED.equals(user.getStatus()) || STATUS_DELETED.equals(user.getStatus())) {
            throw new OAuth2AuthenticationException(new OAuth2Error("account_disabled"),
                "Account " + email + " is " + user.getStatus().toLowerCase());
        }

        user.setGoogleSub(googleSub);
        user.setEmail(email);
        user.setName(name);
        user.setPictureUrl(pictureUrl);
        if (user.getRole() == null) {
            user.setRole(DEFAULT_ROLE);
        }
        if (STATUS_UNREGISTERED.equals(user.getStatus())) {
            user.setStatus(STATUS_ACTIVE);
        }
        usersRepo.save(user);

        loginLogsRepo.save(new tbl_LoginLogs(null, email, name, pictureUrl, user.getRole(), "LOGGED IN", Instant.now()));

        return user;
    }
}
