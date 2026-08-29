package com.FMOnitor_SpringWeb.FMOnitor_WebBE.config;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.servlet.util.matcher.PathPatternRequestMatcher;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.FMOnitor_SpringWeb.FMOnitor_WebBE.repo.tbl_LoginLogsRepo;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.repo.tbl_UsersRepo;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.security.CustomOAuth2UserService;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.security.JwtAuthenticationSuccessHandler;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.security.JwtService;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.security.LogoutLogHandler;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private static final String FRONTEND_URL = "http://localhost:5173";

    private final JwtService jwtService;
    private final CustomOAuth2UserService customOAuth2UserService;
    private final tbl_LoginLogsRepo loginLogsRepo;
    private final tbl_UsersRepo usersRepo;

    public SecurityConfig(JwtService jwtService, CustomOAuth2UserService customOAuth2UserService,
                           tbl_LoginLogsRepo loginLogsRepo, tbl_UsersRepo usersRepo) {
        this.jwtService = jwtService;
        this.customOAuth2UserService = customOAuth2UserService;
        this.loginLogsRepo = loginLogsRepo;
        this.usersRepo = usersRepo;
    }

    @Bean
    public SecurityFilterChain defaultSecurityFilterChain(HttpSecurity http) throws Exception{

        http.cors(cors -> cors.configurationSource(corsConfigurationSource()))
            // This is a JSON API consumed by a separate SPA, not server-rendered forms -
            // CSRF protection is meant for the latter. CORS above already restricts which
            // origins can call these endpoints at all. Without this, every POST/PUT/DELETE
            // gets a generic 403 from Spring's default CSRF filter before reaching any controller.
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(PathPatternRequestMatcher.pathPattern("/api/products")).permitAll()
                .anyRequest().authenticated())
            .exceptionHandling(ex -> ex.defaultAuthenticationEntryPointFor(
                new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED),
                PathPatternRequestMatcher.pathPattern("/api/**")))
            .oauth2Login(oauth2 -> oauth2
                .userInfoEndpoint(userInfo -> userInfo.oidcUserService(customOAuth2UserService))
                .successHandler(new JwtAuthenticationSuccessHandler(jwtService, FRONTEND_URL)))
            .logout(logout -> logout
                .logoutRequestMatcher(PathPatternRequestMatcher.pathPattern(HttpMethod.GET, "/logout"))
                .logoutSuccessHandler(new LogoutLogHandler(loginLogsRepo, usersRepo, FRONTEND_URL))
                .deleteCookies("JSESSIONID"));
        return http.build();
    }

    private CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of(FRONTEND_URL));
        configuration.setAllowedMethods(List.of("GET", "POST"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
