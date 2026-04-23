package com.ttait.subscription.admin.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record AdminReviewRequest(
        String action,
        String note,
        Corrections corrections
) {
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Corrections(
            Long depositAmount,
            Long monthlyRentAmount,
            Integer supplyHouseholdCount,
            Integer ageMin,
            Integer ageMax,
            String maritalTargetType,
            Integer marriageYearLimit,
            Integer childrenMinCount,
            Boolean homelessRequired,
            Boolean lowIncomeRequired,
            Boolean elderlyRequired,
            Integer elderlyAgeMin
    ) {}
}
