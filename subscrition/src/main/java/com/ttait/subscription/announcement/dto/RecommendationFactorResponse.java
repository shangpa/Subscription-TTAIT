package com.ttait.subscription.announcement.dto;

public record RecommendationFactorResponse(
        String key,
        String group,
        String label,
        RecommendationFactorStatus status,
        String scoreImpactLabel,
        String reason,
        String userValue,
        String announcementValue,
        String actionLabel,
        String actionTarget
) {
}
