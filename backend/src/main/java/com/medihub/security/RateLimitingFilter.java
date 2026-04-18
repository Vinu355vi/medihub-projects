// backend/src/main/java/com/medihub/security/RateLimitingFilter.java
package com.medihub.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Bucket4j;
import io.github.bucket4j.Refill;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RateLimitingFilter extends OncePerRequestFilter {
    
    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();
    
    @Override
    protected void doFilterInternal(HttpServletRequest request, 
                                   HttpServletResponse response, 
                                   FilterChain filterChain) 
            throws ServletException, IOException {
        
        String clientIp = getClientIP(request);
        String requestPath = request.getRequestURI();
        
        // Different rate limits for different endpoints
        Bandwidth limit = getBandwidthForPath(requestPath);
        Bucket bucket = buckets.computeIfAbsent(clientIp, k -> createNewBucket(limit));
        
        if (bucket.tryConsume(1)) {
            filterChain.doFilter(request, response);
        } else {
            response.setStatus(429); // Too Many Requests
            response.setContentType("application/json");
            response.getWriter().write("{\"error\": \"Too many requests. Please try again later.\"}");
        }
    }
    
    private Bandwidth getBandwidthForPath(String path) {
        if (path.contains("/api/auth/")) {
            // Stricter limits for auth endpoints - increased for dev/testing usability
            return Bandwidth.classic(20, Refill.intervally(20, Duration.ofMinutes(1)));
        } else if (path.contains("/api/pharmacy/")) {
            // Moderate limits for pharmacy
            return Bandwidth.classic(50, Refill.intervally(50, Duration.ofMinutes(1)));
        } else {
            // Default limits
            return Bandwidth.classic(100, Refill.intervally(100, Duration.ofMinutes(1)));
        }
    }
    
    private Bucket createNewBucket(Bandwidth limit) {
        return Bucket4j.builder().addLimit(limit).build();
    }
    
    private String getClientIP(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader != null) {
            return xfHeader.split(",")[0];
        }
        return request.getRemoteAddr();
    }
}