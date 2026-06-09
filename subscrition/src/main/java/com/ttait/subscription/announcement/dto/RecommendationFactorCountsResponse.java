package com.ttait.subscription.announcement.dto;

public record RecommendationFactorCountsResponse(
        long strongMatch,
        long partialMatch,
        long needsVerification,
        long notMatched,
        long unknown
) {
}
