package com.ttait.subscription.user.domain;

import com.ttait.subscription.common.entity.SoftDeleteBaseEntity;
import com.ttait.subscription.user.domain.enums.Role;
import com.ttait.subscription.user.domain.enums.UserStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "users")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class User extends SoftDeleteBaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "login_id", nullable = false, unique = true, length = 50)
    private String loginId;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(nullable = false, length = 30)
    private String phone;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private UserStatus status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10, columnDefinition = "VARCHAR(10) NOT NULL DEFAULT 'USER'")
    private Role role;

    @Builder
    public User(String loginId, String passwordHash, String phone, String email, UserStatus status, Role role) {
        this.loginId = loginId;
        this.passwordHash = passwordHash;
        this.phone = phone;
        this.email = email;
        this.status = status;
        this.role = role != null ? role : Role.USER;
    }
}
