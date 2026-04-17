package com.ttait.subscription.user.dto;

import com.ttait.subscription.user.domain.enums.CategoryCode;
import com.ttait.subscription.user.domain.enums.MaritalStatus;
import java.util.List;

public record UserProfileResponse(
        Long userId,
        String loginId,
        String email,
        String phone,
        Integer age,
        MaritalStatus maritalStatus,
        Integer childrenCount,
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
