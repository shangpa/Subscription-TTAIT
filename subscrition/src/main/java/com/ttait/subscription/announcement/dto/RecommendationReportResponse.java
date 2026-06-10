package com.ttait.subscription.announcement.dto;

import java.util.List;

public record RecommendationReportResponse(
        Long announcementId,
        String noticeName,
        String providerName,
        int matchScore,
        RecommendationReportSummaryStatus summaryStatus,
        String summaryMessage,
        List<String> existingMatchReasons,
        RecommendationFactorCountsResponse factorCounts,
        List<RecommendationFactorResponse> factors,
        String sourceNoticeUrl,
        String disclaimer
) {
}
