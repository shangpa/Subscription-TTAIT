package com.ttait.subscription.admin.dto;

import com.ttait.subscription.announcement.domain.Announcement;
import com.ttait.subscription.announcement.domain.AnnouncementDetail;
import com.ttait.subscription.announcement.domain.AnnouncementEligibility;
import com.ttait.subscription.announcement.domain.ConfidenceLevel;
import com.ttait.subscription.announcement.domain.MaritalTargetType;
import com.ttait.subscription.announcement.domain.ParseReviewStatus;
import java.time.LocalDateTime;

public record AdminReviewDetailResponse(
        Long announcementId,
        String noticeName,
        String providerName,
        String regionLevel1,

        Long depositAmount,
        Long monthlyRentAmount,
        Integer supplyHouseholdCount,

        String depositMonthlyRentRaw,
        String supplyHouseholdCountRaw,
        String supplyHouseholdCountBasis,
        ConfidenceLevel supplyHouseholdCountConfidence,

        Integer ageMin,
        Integer ageMax,
        String ageRawText,
        MaritalTargetType maritalTargetType,
        Integer marriageYearLimit,
        String maritalRawText,
        Integer childrenMinCount,
        String childrenRawText,
        Boolean homelessRequired,
        String homelessRawText,
        Boolean lowIncomeRequired,
        String incomeAssetCriteriaRaw,
        Boolean elderlyRequired,
        Integer elderlyAgeMin,
        String elderlyRawText,
        String eligibilityRaw,
        String specialSupplyRaw,

        ParseReviewStatus reviewStatus,
        String reviewedBy,
        LocalDateTime reviewedAt,
        String reviewNote
) {
    public static AdminReviewDetailResponse from(Announcement announcement, AnnouncementDetail detail,
                                                  AnnouncementEligibility eligibility) {
        return new AdminReviewDetailResponse(
                announcement.getId(),
                announcement.getNoticeName(),
                announcement.getProviderName(),
                announcement.getRegionLevel1(),

                announcement.getDepositAmount(),
                announcement.getMonthlyRentAmount(),
                announcement.getSupplyHouseholdCount(),

                detail != null ? detail.getDepositMonthlyRentRaw() : null,
                detail != null ? detail.getSupplyHouseholdCountRaw() : null,
                detail != null ? detail.getSupplyHouseholdCountBasis() : null,
                detail != null ? detail.getSupplyHouseholdCountConfidence() : null,

                eligibility.getAgeMin(),
                eligibility.getAgeMax(),
                eligibility.getAgeRawText(),
                eligibility.getMaritalTargetType(),
                eligibility.getMarriageYearLimit(),
                eligibility.getMaritalRawText(),
                eligibility.getChildrenMinCount(),
                eligibility.getChildrenRawText(),
                eligibility.getHomelessRequired(),
                eligibility.getHomelessRawText(),
                eligibility.getLowIncomeRequired(),
                eligibility.getIncomeAssetCriteriaRaw(),
                eligibility.getElderlyRequired(),
                eligibility.getElderlyAgeMin(),
                eligibility.getElderlyRawText(),
                eligibility.getEligibilityRaw(),
                eligibility.getSpecialSupplyRaw(),

                eligibility.getReviewStatus(),
                eligibility.getReviewedBy(),
                eligibility.getReviewedAt(),
                eligibility.getReviewNote()
        );
    }
}
