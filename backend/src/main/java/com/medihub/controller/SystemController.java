package com.medihub.controller;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.mvc.method.RequestMappingInfo;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;
import org.springframework.web.servlet.mvc.condition.PatternsRequestCondition;

@RestController
@RequestMapping("/api/system")
public class SystemController {

    @Autowired
    private RequestMappingHandlerMapping handlerMapping;

    @GetMapping("/routes")
    public ResponseEntity<?> listRoutes() {
        List<Map<String, Object>> routes = handlerMapping.getHandlerMethods()
            .entrySet()
            .stream()
            .map(this::toRouteEntry)
            .filter(entry -> {
                String path = String.valueOf(entry.get("path"));
                return path.startsWith("/api/") || path.startsWith("/auth/") || path.startsWith("/pharmacy/");
            })
            .sorted(Comparator.comparing(entry -> String.valueOf(entry.get("path"))))
            .collect(Collectors.toList());

        return ResponseEntity.ok(Map.of(
            "timestamp", Instant.now().toString(),
            "count", routes.size(),
            "routes", routes
        ));
    }

    private Map<String, Object> toRouteEntry(Map.Entry<RequestMappingInfo, HandlerMethod> entry) {
        RequestMappingInfo mappingInfo = entry.getKey();
        HandlerMethod handlerMethod = entry.getValue();

        String methods = mappingInfo.getMethodsCondition().getMethods().isEmpty()
            ? "ANY"
            : mappingInfo.getMethodsCondition().getMethods()
                .stream()
                .map(Enum::name)
                .sorted()
                .collect(Collectors.joining(","));

        String path = resolvePath(mappingInfo);

        return Map.of(
            "path", path,
            "methods", methods,
            "handler", handlerMethod.getBeanType().getSimpleName() + "#" + handlerMethod.getMethod().getName()
        );
    }

    private String resolvePath(RequestMappingInfo mappingInfo) {
        if (mappingInfo.getPathPatternsCondition() != null
                && !mappingInfo.getPathPatternsCondition().getPatterns().isEmpty()) {
            return mappingInfo.getPathPatternsCondition()
                .getPatterns()
                .stream()
                .map(Object::toString)
                .sorted()
                .collect(Collectors.joining(" | "));
        }

        PatternsRequestCondition patterns = mappingInfo.getPatternsCondition();
        if (patterns != null && !patterns.getPatterns().isEmpty()) {
            return patterns.getPatterns()
                .stream()
                .sorted()
                .collect(Collectors.joining(" | "));
        }

        return "";
    }
}
