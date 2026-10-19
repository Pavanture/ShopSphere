package com.shopsphere.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Component
public class JwtUtil {

    @Value("${app.jwt.secret}")
    private String secret;

    @Value("${app.jwt.expiration-ms}")
    private long expirationMs;


    // =========================================================
    // Generate signing key
    // =========================================================
    private SecretKey getSigningKey() {

        // Convert normal text secret into bytes
        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);

        // HS256 requires minimum 32 bytes (256 bits)
        if (keyBytes.length < 32) {
            keyBytes = Arrays.copyOf(keyBytes, 32);
        }

        return Keys.hmacShaKeyFor(keyBytes);
    }


    // =========================================================
    // Generate JWT Token
    // =========================================================
    public String generateToken(String email, Long userId, String role) {

        Map<String, Object> claims = new HashMap<>();

        claims.put("userId", userId);
        claims.put("role", role);

        return buildToken(claims, email);
    }


    // =========================================================
    // Build Token
    // =========================================================
    private String buildToken(
            Map<String, Object> claims,
            String subject) {

        Date now = new Date();

        Date expiry = new Date(
                now.getTime() + expirationMs
        );

        return Jwts.builder()
                .claims(claims)
                .subject(subject)
                .issuedAt(now)
                .expiration(expiry)
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }


    // =========================================================
    // Extract Email
    // =========================================================
    public String extractEmail(String token) {

        return extractClaim(
                token,
                Claims::getSubject
        );
    }


    // =========================================================
    // Extract User ID
    // =========================================================
    public Long extractUserId(String token) {

        Claims claims = extractAllClaims(token);

        return claims.get("userId", Long.class);
    }


    // =========================================================
    // Extract Role
    // =========================================================
    public String extractRole(String token) {

        Claims claims = extractAllClaims(token);

        return claims.get("role", String.class);
    }


    // =========================================================
    // Extract Expiration
    // =========================================================
    public Date extractExpiration(String token) {

        return extractClaim(
                token,
                Claims::getExpiration
        );
    }


    // =========================================================
    // Get Expiration Time
    // =========================================================
    public long getExpirationMs() {

        return expirationMs;
    }


    // =========================================================
    // Validate Token
    // =========================================================
    public boolean isTokenValid(
            String token,
            String email) {

        try {

            String tokenEmail = extractEmail(token);

            return tokenEmail.equals(email)
                    && !isTokenExpired(token);

        } catch (Exception e) {

            return false;
        }
    }


    // =========================================================
    // Check Token Expired
    // =========================================================
    private boolean isTokenExpired(String token) {

        return extractExpiration(token)
                .before(new Date());
    }


    // =========================================================
    // Extract Claim
    // =========================================================
    private <T> T extractClaim(
            String token,
            Function<Claims, T> claimsResolver) {

        Claims claims = extractAllClaims(token);

        return claimsResolver.apply(claims);
    }


    // =========================================================
    // Extract All Claims
    // =========================================================
    private Claims extractAllClaims(String token) {

        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}