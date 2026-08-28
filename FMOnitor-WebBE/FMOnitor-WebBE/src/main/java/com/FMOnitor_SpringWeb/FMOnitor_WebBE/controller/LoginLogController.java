package com.FMOnitor_SpringWeb.FMOnitor_WebBE.controller;

import com.FMOnitor_SpringWeb.FMOnitor_WebBE.model.tbl_LoginLogs;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.repo.tbl_LoginLogsRepo;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

// No @Bean/permitAll here - falls under SecurityConfig's default
// ".anyRequest().authenticated()" rule, same as /api/user.
@RestController
@RequestMapping("/api/login-logs")
public class LoginLogController {

    private final tbl_LoginLogsRepo loginLogsRepo;

    public LoginLogController(tbl_LoginLogsRepo loginLogsRepo) {
        this.loginLogsRepo = loginLogsRepo;
    }

    @GetMapping
    public List<tbl_LoginLogs> getLoginLogs() {
        return loginLogsRepo.findAllByOrderByActionAtDesc();
    }
}
