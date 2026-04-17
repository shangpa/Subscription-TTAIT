package com.ttait.subscription.user.dto;

import com.ttait.subscription.user.domain.enums.CategoryCode;
import com.ttait.subscription.user.domain.enums.MaritalStatus;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record UserProfileRequest(
        @NotNull @Min(0) @Max(120) Integer age,
        @NotNull MaritalStatus maritalStatus,
        @NotNull @Min(0) Integer childrenCount,
        boolean isHomeless,
        boolean isLowIncome,
        boolean isElderly,
        String preferredRegionLevel1,
        String preferredRegionLevel2,
        String preferredHouseType,
        String preferredSupplyType,
        Long maxDeposit,
        Long maxMonthlyRent,
        List<CategoryCode> categories
) {
}
