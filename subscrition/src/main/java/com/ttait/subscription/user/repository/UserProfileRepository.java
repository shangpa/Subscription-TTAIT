package com.ttait.subscription.user.repository;

import com.ttait.subscription.user.domain.UserProfile;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserProfileRepository extends JpaRepository<UserProfile, Long> {
    Optional<UserProfile> findByUserIdAndDeletedFalse(Long userId);
}
