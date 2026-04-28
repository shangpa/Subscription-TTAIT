package com.ttait.subscription.user.dto;

import com.ttait.subscription.user.domain.enums.CategoryCode;
import com.ttait.subscription.user.domain.enums.MaritalStatus;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record UserProfileRequest(
        @NotNull @Min(19) @Max(120) Integer age,
        @NotNull MaritalStatus maritalStatus,
        @Min(0) @Max(100) Integer marriageYears,
        @NotNull @Min(0) Integer childrenCount,
        @Min(1) @Max(7) Integer householdSize,
        boolean isHomeless,
        boolean isLowIncome,
        boolean isElderly,
        boolean isRecipient,
        boolean isNearPoverty,
        boolean isSingleParentFamily,
        @Min(0) Long monthlyAverageIncome,
        @Min(0) Long totalAssets,
        @Min(0) Long vehicleAssetAmount,
        String preferredRegionLevel1,
        String preferredRegionLevel2,
        String preferredHouseType,
        String preferredSupplyType,
        @Min(0) Long maxDeposit,
        @Min(0) Long maxMonthlyRent,
        List<CategoryCode> categories
) {
}
