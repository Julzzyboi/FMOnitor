package com.FMOnitor_SpringWeb.FMOnitor_WebBE.config;

import java.util.Arrays;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.servlet.util.matcher.PathPatternRequestMatcher;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.FMOnitor_SpringWeb.FMOnitor_WebBE.repo.tbl_LoginLogsRepo;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.repo.tbl_UsersRepo;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.security.CustomOAuth2UserService;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.security.JwtAuthenticationFilter;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.security.JwtAuthenticationSuccessHandler;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.security.JwtService;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.security.LogoutLogHandler;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.security.OAuth2LoginFailureHandler;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.security.RefreshTokenService;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private static final String FRONTEND_URL = "http://localhost:5173";

    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final CustomOAuth2UserService customOAuth2UserService;
    private final tbl_LoginLogsRepo loginLogsRepo;
    private final tbl_UsersRepo usersRepo;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final boolean secureCookie;

    public SecurityConfig(JwtService jwtService, RefreshTokenService refreshTokenService,
                           CustomOAuth2UserService customOAuth2UserService,
                           tbl_LoginLogsRepo loginLogsRepo, tbl_UsersRepo usersRepo,
                           JwtAuthenticationFilter jwtAuthenticationFilter,
                           @Value("${app.cookie.secure}") boolean secureCookie) {
        this.jwtService = jwtService;
        this.refreshTokenService = refreshTokenService;
        this.customOAuth2UserService = customOAuth2UserService;
        this.loginLogsRepo = loginLogsRepo;
        this.usersRepo = usersRepo;
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.secureCookie = secureCookie;
    }

    @Bean
    public SecurityFilterChain defaultSecurityFilterChain(HttpSecurity http) throws Exception{

        http.cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(AbstractHttpConfigurer::disable)
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/products").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/auth/refresh").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/auth/mobile/google").permitAll()
                .anyRequest().authenticated())
            .exceptionHandling(ex -> ex.defaultAuthenticationEntryPointFor(
                new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED),
                PathPatternRequestMatcher.withDefaults().matcher("/api/**")))
            .oauth2Login(oauth2 -> oauth2
                .userInfoEndpoint(userInfo -> userInfo.oidcUserService(customOAuth2UserService))
                .successHandler(new JwtAuthenticationSuccessHandler(jwtService, refreshTokenService, usersRepo, FRONTEND_URL, secureCookie))
                .failureHandler(new OAuth2LoginFailureHandler(FRONTEND_URL)))
            .logout(logout -> logout
                .logoutRequestMatcher(PathPatternRequestMatcher.withDefaults().matcher(HttpMethod.GET, "/logout"))
                .logoutSuccessHandler(new LogoutLogHandler(loginLogsRepo, usersRepo, refreshTokenService, FRONTEND_URL, secureCookie))
                .deleteCookies("JSESSIONID"))
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    private CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList(FRONTEND_URL));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PATCH", "DELETE"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
