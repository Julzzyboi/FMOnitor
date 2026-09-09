package com.FMOnitor_SpringWeb.FMOnitor_WebBE.model;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Table;

import java.time.Instant;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

// One row per LOGIN or LOGOUT - written by CustomOAuth2UserService (login) and
// LogoutLogHandler (logout), which both already run at exactly those moments.
@Entity
@Table(name = "tbl_login_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class tbl_LoginLogs {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String email;

    private String name;

    @Column(name = "picture_url")
    private String pictureUrl;

    @Column(nullable = false)
    private String role;

    // "LOGIN" or "LOGOUT"
    @Column(nullable = false)
    private String action;

    @Column(name = "action_at", nullable = false)
    private Instant actionAt;

}
