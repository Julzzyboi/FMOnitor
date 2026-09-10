package com.FMOnitor_SpringWeb.FMOnitor_WebBE.web;

import com.FMOnitor_SpringWeb.FMOnitor_WebBE.repo.tbl_UsersRepo;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.HashMap;
import java.util.Map;

// Serves the browser-facing HTML pages (Thymeleaf views). This is the "Java
// frontend" - separate from the REST controllers in the controller/ package,
// which stay as-is and serve JSON to the mobile app.
//
// Every mapping here just returns a view name; the shared layout
// (fragments/layout.html) builds the sidebar + topbar around it, and
// GlobalModelAttributes supplies ${currentUser}.
@Controller
public class PageController {

    // Maps the ?error=<code> that OAuth2LoginFailureHandler redirects here
    // with onto a human-readable line for the login page to show. Same
    // wording the old React app used.
    private static final Map<String, String> LOGIN_ERROR_MESSAGES = new HashMap<>();
    static {
        LOGIN_ERROR_MESSAGES.put("unauthorized_user",
            "This Google account isn't registered with FMOnitor. Ask an admin to invite you first.");
        LOGIN_ERROR_MESSAGES.put("account_disabled",
            "This account has been disabled or removed. Contact an administrator.");
        LOGIN_ERROR_MESSAGES.put("login_failed", "Sign-in failed. Please try again.");
    }

    private final tbl_UsersRepo usersRepo;

    public PageController(tbl_UsersRepo usersRepo) {
        this.usersRepo = usersRepo;
    }

    @GetMapping("/")
    public String root() {
        // Anything that isn't the login page requires a session (see
        // SecurityConfig), so an unauthenticated hit here bounces to /login
        // automatically; an authenticated one lands on the dashboard.
        return "redirect:/dashboard";
    }

    @GetMapping("/login")
    public String login(@RequestParam(value = "error", required = false) String error, Model model) {
        if (error != null) {
            model.addAttribute("errorMessage",
                LOGIN_ERROR_MESSAGES.getOrDefault(error, LOGIN_ERROR_MESSAGES.get("login_failed")));
        }
        return "login";
    }

    @GetMapping("/dashboard")
    public String dashboard() {
        return "dashboard";
    }

    @GetMapping("/inventory")
    public String inventory() {
        return "inventory";
    }

    @GetMapping("/calendar")
    public String calendar() {
        return "calendar";
    }

    @GetMapping("/campus-map")
    public String campusMap() {
        return "campus-map";
    }

    @GetMapping("/analytics")
    public String analytics() {
        return "analytics";
    }

    @GetMapping("/history")
    public String history() {
        return "history";
    }

    @GetMapping("/profile")
    public String profile() {
        return "profile";
    }

    @GetMapping("/accounts")
    public String accounts(@AuthenticationPrincipal OAuth2User principal) {
        // Superadmin-only, matching the old /accounts route guard and the
        // backend's own isSuperadmin() checks on the account API. A non-
        // Superadmin who somehow reaches this URL is sent back to the
        // dashboard rather than shown the page.
        String email = principal != null ? principal.getAttribute("email") : null;
        String role = email == null ? null
            : usersRepo.findByEmail(email).map(u -> u.getRole()).orElse(null);
        if (!"Superadmin".equals(role)) {
            return "redirect:/dashboard";
        }
        return "accounts";
    }
}
