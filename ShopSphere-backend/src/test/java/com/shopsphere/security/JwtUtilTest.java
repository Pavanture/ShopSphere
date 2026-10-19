package com.shopsphere.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;

class JwtUtilTest {

    private JwtUtil jwtUtil;

    @BeforeEach
    void setUp() {
        jwtUtil = new JwtUtil();
        ReflectionTestUtils.setField(jwtUtil, "secret", "test-secret-key-for-unit-tests-must-be-long-enough");
        ReflectionTestUtils.setField(jwtUtil, "expirationMs", 3600000L);
    }

    @Test
    void generateToken_shouldEncodeEmailUserIdAndRole() {
        String token = jwtUtil.generateToken("jane@example.com", 1L, "ROLE_USER");

        assertNotNull(token);
        assertEquals("jane@example.com", jwtUtil.extractEmail(token));
        assertEquals(1L, jwtUtil.extractUserId(token));
        assertEquals("ROLE_USER", jwtUtil.extractRole(token));
    }

    @Test
    void isTokenValid_shouldReturnTrue_forMatchingEmailAndUnexpiredToken() {
        String token = jwtUtil.generateToken("jane@example.com", 1L, "ROLE_USER");
        assertTrue(jwtUtil.isTokenValid(token, "jane@example.com"));
    }

    @Test
    void isTokenValid_shouldReturnFalse_forMismatchedEmail() {
        String token = jwtUtil.generateToken("jane@example.com", 1L, "ROLE_USER");
        assertFalse(jwtUtil.isTokenValid(token, "someone-else@example.com"));
    }
}
