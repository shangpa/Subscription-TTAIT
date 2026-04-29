package com.ttait.subscription.user.service;

import com.ttait.subscription.common.exception.ApiException;
import com.ttait.subscription.user.domain.User;
import com.ttait.subscription.user.domain.UserCategory;
import com.ttait.subscription.user.domain.UserProfile;
import com.ttait.subscription.user.dto.UserProfileRequest;
import com.ttait.subscription.user.dto.UserProfileResponse;
import com.ttait.subscription.user.repository.UserCategoryRepository;
import com.ttait.subscription.user.repository.UserProfileRepository;
import com.ttait.subscription.user.repository.UserRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class UserProfileService {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final UserCategoryRepository userCategoryRepository;

    public UserProfileService(UserRepository userRepository, UserProfileRepository userProfileRepository,
                              UserCategoryRepository userCategoryRepository) {
        this.userRepository = userRepository;
        this.userProfileRepository = userProfileRepository;
        this.userCategoryRepository = userCategoryRepository;
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getMe(Long userId) {
        User user = findUser(userId);
        UserProfile profile = userProfileRepository.findByUserIdAndDeletedFalse(userId).orElse(null);
        List<UserCategory> categories = userCategoryRepository.findByUserId(userId);
        return UserProfileMapper.toResponse(user, profile, categories);
    }

    public UserProfileResponse upsertProfile(Long userId, UserProfileRequest request) {
        User user = findUser(userId);
        UserProfile profile = userProfileRepository.findByUserIdAndDeletedFalse(userId)
                .orElseGet(() -> UserProfile.builder()
                        .user(user)
                        .age(request.age())
                        .maritalStatus(request.maritalStatus())
                        .marriageYears(request.marriageYears())
                        .childrenCount(request.childrenCount())
                        .householdSize(request.householdSize())
                        .homeless(request.isHomeless())
                        .lowIncome(request.isLowIncome())
                        .elderly(request.isElderly())
                        .recipient(request.isRecipient())
                        .nearPoverty(request.isNearPoverty())
                        .singleParentFamily(request.isSingleParentFamily())
                        .monthlyAverageIncome(request.monthlyAverageIncome())
                        .totalAssets(request.totalAssets())
                        .vehicleAssetAmount(request.vehicleAssetAmount())
                        .preferredRegionLevel1(request.preferredRegionLevel1())
                        .preferredRegionLevel2(request.preferredRegionLevel2())
                        .preferredHouseType(request.preferredHouseType())
                        .preferredSupplyType(request.preferredSupplyType())
                        .maxDeposit(request.maxDeposit())
                        .maxMonthlyRent(request.maxMonthlyRent())
                        .build());

        if (profile.getId() != null) {
            profile.update(
                    request.age(),
                    request.maritalStatus(),
                    request.marriageYears(),
                    request.childrenCount(),
                    request.householdSize(),
                    request.isHomeless(),
                    request.isLowIncome(),
                    request.isElderly(),
                    request.isRecipient(),
                    request.isNearPoverty(),
                    request.isSingleParentFamily(),
                    request.monthlyAverageIncome(),
                    request.totalAssets(),
                    request.vehicleAssetAmount(),
                    request.preferredRegionLevel1(),
                    request.preferredRegionLevel2(),
                    request.preferredHouseType(),
                    request.preferredSupplyType(),
                    request.maxDeposit(),
                    request.maxMonthlyRent()
            );
        }
        userProfileRepository.save(profile);

        userCategoryRepository.deleteByUserId(userId);
        if (request.categories() != null) {
            request.categories().forEach(category ->
                    userCategoryRepository.save(UserCategory.builder().user(user).categoryCode(category).build()));
        }

        user.markProfileCompleted();
        return getMe(userId);
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "user not found"));
    }
}
