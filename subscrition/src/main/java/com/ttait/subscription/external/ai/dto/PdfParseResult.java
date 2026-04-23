package com.ttait.subscription.external.ai.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record PdfParseResult(
        Field applicationPeriod,
        Field supplyHouseholdCount,
        Field depositMonthlyRent,
        Field incomeAssetCriteria,
        Field contact,
        Long depositAmountManwon,
        Long monthlyRentAmountManwon,
        Eligibility eligibility
) {
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Field(String value, Double confidence, Integer sourcePage) {

        public boolean hasValue() {
            return value != null && !value.isBlank();
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Eligibility(
            Integer ageMin,
            Integer ageMax,
            String ageRawText,
            String maritalTargetType,
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
            String specialSupplyRaw
    ) {}
}
