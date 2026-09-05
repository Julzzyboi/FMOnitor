package com.FMOnitor_SpringWeb.FMOnitor_WebBE.config;

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
            // This is a JSON API consumed by a separate SPA, not server-rendered forms -
            // CSRF protection is meant for the latter. CORS above already restricts which
            // origins can call these endpoints at all. Without this, every POST/PUT/DELETE
            // gets a generic 403 from Spring's default CSRF filter before reaching any controller.
            .csrf(AbstractHttpConfigurer::disable)
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(PathPatternRequestMatcher.pathPattern("/api/products")).permitAll()
                // Not session/JWT-authenticated like everything else here - its own auth
                // check is the httpOnly refresh cookie, validated inside the controller
                // itself (that's the whole point: it has to keep working after the
                // access token has expired and the session may be long gone too).
                .requestMatchers(PathPatternRequestMatcher.pathPattern(HttpMethod.POST, "/api/auth/refresh")).permitAll()
                // Mobile's equivalent of the web oauth2Login redirect - its own auth
                // check is verifying the Google ID token itself, inside the controller.
                .requestMatchers(PathPatternRequestMatcher.pathPattern(HttpMethod.POST, "/api/auth/mobile/google")).permitAll()
                .anyRequest().authenticated())
            .exceptionHandling(ex -> ex.defaultAuthenticationEntryPointFor(
                new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED),
                PathPatternRequestMatcher.pathPattern("/api/**")))
            .oauth2Login(oauth2 -> oauth2
                .userInfoEndpoint(userInfo -> userInfo.oidcUserService(customOAuth2UserService))
                .successHandler(new JwtAuthenticationSuccessHandler(jwtService, refreshTokenService, usersRepo, FRONTEND_URL, secureCookie))
                .failureHandler(new OAuth2LoginFailureHandler(FRONTEND_URL)))
            .logout(logout -> logout
                .logoutRequestMatcher(PathPatternRequestMatcher.pathPattern(HttpMethod.GET, "/logout"))
                .logoutSuccessHandler(new LogoutLogHandler(loginLogsRepo, usersRepo, refreshTokenService, FRONTEND_URL, secureCookie))
                .deleteCookies("JSESSIONID"))
            // Runs before the session-based login machinery, so a request carrying a
            // Bearer token gets checked (and its expiration enforced) independently
            // of whether a session cookie is also present.
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    private CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of(FRONTEND_URL));
        // PATCH: /api/accounts/{id}/status. DELETE: /api/accounts/{id} (permanent
        // delete). CORS blocks the browser's preflight for any method not listed
        // here, before the request ever reaches a controller - curl/native clients
        // aren't subject to this at all, which is exactly why testing an endpoint
        // with curl alone doesn't catch a missing entry here. Learned this the
        // hard way once already today; not repeating it for DELETE too.
        configuration.setAllowedMethods(List.of("GET", "POST", "PATCH", "DELETE"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
