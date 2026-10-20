package com.shopsphere.config;

import com.shopsphere.security.JwtAuthEntryPoint;
import com.shopsphere.security.JwtAuthenticationFilter;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;

class SecurityConfigTest {

    @Test
    void corsAllowedOriginsShouldTrimWhitespace() {
        SecurityConfig securityConfig = new SecurityConfig(
                mock(UserDetailsService.class),
                mock(JwtAuthenticationFilter.class),
                mock(JwtAuthEntryPoint.class));
        ReflectionTestUtils.setField(securityConfig, "allowedOrigins",
                "https://store.example, https://admin.example ");

        CorsConfigurationSource source = securityConfig.corsConfigurationSource();
        CorsConfiguration corsConfiguration =
                source.getCorsConfiguration(new MockHttpServletRequest("GET", "/api/products"));

        assertEquals(
                java.util.List.of("https://store.example", "https://admin.example"),
                corsConfiguration.getAllowedOrigins());
    }
}
