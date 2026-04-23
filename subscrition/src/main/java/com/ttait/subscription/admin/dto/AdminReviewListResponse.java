package com.ttait.subscription.admin.dto;

import com.ttait.subscription.announcement.domain.AnnouncementEligibility;
import com.ttait.subscription.announcement.domain.ParseReviewStatus;
import java.time.LocalDateTime;

public record AdminReviewListResponse(
        Long announcementId,
        String noticeName,
        String regionLevel1,
        ParseReviewStatus reviewStatus,
        LocalDateTime reviewedAt,
        String reviewedBy
) {
    public static AdminReviewListResponse from(AnnouncementEligibility eligibility) {
        return new AdminReviewListResponse(
                eligibility.getAnnouncement().getId(),
                eligibility.getAnnouncement().getNoticeName(),
                eligibility.getAnnouncement().getRegionLevel1(),
                eligibility.getReviewStatus(),
                eligibility.getReviewedAt(),
                eligibility.getReviewedBy()
        );
    }
}
