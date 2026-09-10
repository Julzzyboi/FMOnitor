package com.FMOnitor_SpringWeb.FMOnitor_WebBE.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.LoginUrlAuthenticationEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;
import org.springframework.security.web.util.matcher.AnyRequestMatcher;

import com.FMOnitor_SpringWeb.FMOnitor_WebBE.repo.tbl_LoginLogsRepo;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.repo.tbl_UsersRepo;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.security.CustomOAuth2UserService;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.security.JwtAuthenticationFilter;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.security.LogoutLogHandler;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.security.OAuth2LoginFailureHandler;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.security.RefreshTokenService;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final RefreshTokenService refreshTokenService;
    private final CustomOAuth2UserService customOAuth2UserService;
    private final tbl_LoginLogsRepo loginLogsRepo;
    private final tbl_UsersRepo usersRepo;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final boolean secureCookie;

    public SecurityConfig(RefreshTokenService refreshTokenService,
                           CustomOAuth2UserService customOAuth2UserService,
                           tbl_LoginLogsRepo loginLogsRepo, tbl_UsersRepo usersRepo,
                           JwtAuthenticationFilter jwtAuthenticationFilter,
                           @Value("${app.cookie.secure}") boolean secureCookie) {
        this.refreshTokenService = refreshTokenService;
        this.customOAuth2UserService = customOAuth2UserService;
        this.loginLogsRepo = loginLogsRepo;
        this.usersRepo = usersRepo;
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.secureCookie = secureCookie;
    }

    @Bean
    public SecurityFilterChain defaultSecurityFilterChain(HttpSecurity http) throws Exception{

        // No CORS config any more - the frontend is server-rendered from this
        // same app (same origin), and the mobile app is a native HTTP client,
        // not a browser, so CORS never applied to it.
        //
        // CSRF is disabled: the mobile API (/api/**) is stateless Bearer JWT
        // (CSRF doesn't apply), and it's left off for the browser side too
        // while the server-rendered pages are being built out - re-enable it
        // there (Thymeleaf auto-injects the hidden token into <form>s) once
        // those pages have real POST forms.
        http.csrf(AbstractHttpConfigurer::disable)
            .authorizeHttpRequests(auth -> auth
                // Spring Security 5.7's authorizeHttpRequests() only takes
                // RequestMatcher varargs here, not a plain String pattern
                // (that convenience overload came in a later version) -
                // AntPathRequestMatcher is the Java-8-era way to express one.
                .requestMatchers(new AntPathRequestMatcher("/api/products")).permitAll()
                // Not session/JWT-authenticated like everything else here - its own auth
                // check is the httpOnly refresh cookie, validated inside the controller
                // itself (that's the whole point: it has to keep working after the
                // access token has expired and the session may be long gone too).
                .requestMatchers(new AntPathRequestMatcher("/api/auth/refresh", "POST")).permitAll()
                // Mobile's equivalent of the web oauth2Login redirect - its own auth
                // check is verifying the Google ID token itself, inside the controller.
                .requestMatchers(new AntPathRequestMatcher("/api/auth/mobile/google", "POST")).permitAll()
                // The server-rendered login page + its static assets - reachable
                // without a session (that's the whole point).
                .requestMatchers(new AntPathRequestMatcher("/login")).permitAll()
                .requestMatchers(new AntPathRequestMatcher("/css/**")).permitAll()
                .requestMatchers(new AntPathRequestMatcher("/js/**")).permitAll()
                .requestMatchers(new AntPathRequestMatcher("/images/**")).permitAll()
                .requestMatchers(new AntPathRequestMatcher("/fontawesome/**")).permitAll()
                .requestMatchers(new AntPathRequestMatcher("/favicon.ico")).permitAll()
                .requestMatchers(new AntPathRequestMatcher("/error")).permitAll()
                .anyRequest().authenticated())
            .exceptionHandling(ex -> ex
                // The mobile API is a plain HTTP client: an unauthenticated call
                // should get a bare 401, never an HTML login redirect.
                .defaultAuthenticationEntryPointFor(
                    new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED),
                    new AntPathRequestMatcher("/api/**"))
                // Everything else is a browser hitting a server-rendered page -
                // bounce an unauthenticated request to our /login page. Without
                // this explicit catch-all, registering the /api/** entry point
                // above leaves 401 as the fallback for page requests too, so
                // /dashboard would 401 instead of redirecting to sign in.
                .defaultAuthenticationEntryPointFor(
                    new LoginUrlAuthenticationEntryPoint("/login"),
                    AnyRequestMatcher.INSTANCE))
            .oauth2Login(oauth2 -> oauth2
                // Unauthenticated browser hits now land on our own Thymeleaf
                // login page, not Spring Security's generated one.
                .loginPage("/login")
                .userInfoEndpoint(userInfo -> userInfo.oidcUserService(customOAuth2UserService))
                // Web auth is the Spring Security session (JSESSIONID) now that
                // the frontend is served from this same app - no token-in-URL
                // hand-off to a separate SPA any more. The mobile app still gets
                // its own JWT/refresh tokens via MobileAuthController.
                .defaultSuccessUrl("/dashboard", true)
                .failureHandler(new OAuth2LoginFailureHandler()))
            .logout(logout -> logout
                .logoutRequestMatcher(new AntPathRequestMatcher("/logout", "GET"))
                .logoutSuccessHandler(new LogoutLogHandler(loginLogsRepo, usersRepo, refreshTokenService, secureCookie))
                .deleteCookies("JSESSIONID"))
            // Runs before the session-based login machinery, so a request carrying a
            // Bearer token gets checked (and its expiration enforced) independently
            // of whether a session cookie is also present.
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}
