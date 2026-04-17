package com.ttait.subscription.auth.domain;

public record AuthenticatedUser(
        Long userId,
        String loginId
) {
}
