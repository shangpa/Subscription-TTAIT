package com.ttait.subscription.user.repository;

import com.ttait.subscription.user.domain.UserCategory;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserCategoryRepository extends JpaRepository<UserCategory, Long> {
    List<UserCategory> findByUserId(Long userId);
    void deleteByUserId(Long userId);
}
