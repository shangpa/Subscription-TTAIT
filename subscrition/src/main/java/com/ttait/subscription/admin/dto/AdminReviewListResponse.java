package com.ttait.subscription.admin.dto;

import com.ttait.subscription.announcement.domain.AnnouncementEligibility;
import com.ttait.subscription.announcement.domain.ParseReviewStatus;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record AdminReviewListResponse(
        Long announcementId,             // 공고 PK
        String noticeName,               // 공고명
        String providerName,             // 공급 기관명
        String noticeStatus,             // 공고 상태
        String regionLevel1,             // 광역시/도
        String regionLevel2,             // 시/군/구
        String fullAddress,              // 전체 주소
        String complexName,              // 단지명
        LocalDate applicationStartDate,  // 청약 신청 시작일
        LocalDate applicationEndDate,    // 청약 신청 마감일
        String supplyType,               // 공급 유형
        String houseType,                // 주택 유형
        Long depositAmount,              // 보증금 (만원)
        Long monthlyRentAmount,          // 월세 (만원)
        Integer supplyHouseholdCount,    // 공급 세대 수
        Long unitCount,                  // 공급 단위 수
        ParseReviewStatus reviewStatus,  // 검수 상태
        LocalDateTime reviewedAt,        // 검수 처리 시각
        String reviewedBy                // 검수한 관리자 ID
) {
    public static AdminReviewListResponse from(AnnouncementEligibility eligibility, Long unitCount) {
        return new AdminReviewListResponse(
                eligibility.getAnnouncement().getId(),
                eligibility.getAnnouncement().getNoticeName(),
                eligibility.getAnnouncement().getProviderName(),
                eligibility.getAnnouncement().getNoticeStatus().name(),
                eligibility.getAnnouncement().getRegionLevel1(),
                eligibility.getAnnouncement().getRegionLevel2(),
                eligibility.getAnnouncement().getFullAddress(),
                eligibility.getAnnouncement().getComplexName(),
                eligibility.getAnnouncement().getApplicationStartDate(),
                eligibility.getAnnouncement().getApplicationEndDate(),
                eligibility.getAnnouncement().getSupplyTypeNormalized(),
                eligibility.getAnnouncement().getHouseTypeNormalized(),
                eligibility.getAnnouncement().getDepositAmount(),
                eligibility.getAnnouncement().getMonthlyRentAmount(),
                eligibility.getAnnouncement().getSupplyHouseholdCount(),
                unitCount,
                eligibility.getReviewStatus(),
                eligibility.getReviewedAt(),
                eligibility.getReviewedBy()
        );
    }
}
