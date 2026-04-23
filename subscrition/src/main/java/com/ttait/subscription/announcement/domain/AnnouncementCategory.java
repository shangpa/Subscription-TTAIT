package com.ttait.subscription.announcement.domain;

import com.ttait.subscription.user.domain.enums.CategoryCode;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "announcement_category",
        uniqueConstraints = @UniqueConstraint(columnNames = {"announcement_id", "category_code"}))
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AnnouncementCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "announcement_id", nullable = false)
    private Announcement announcement;

    @Enumerated(EnumType.STRING)
    @Column(name = "category_code", nullable = false, length = 20)
    private CategoryCode categoryCode;

    @Enumerated(EnumType.STRING)
    @Column(name = "match_source", nullable = false, length = 10)
    private MatchSource matchSource;

    @Column(name = "match_reason", columnDefinition = "TEXT")
    private String matchReason;

    @Column(name = "score")
    private Integer score;

    @Builder
    public AnnouncementCategory(Announcement announcement, CategoryCode categoryCode,
                                MatchSource matchSource, String matchReason, Integer score) {
        this.announcement = announcement;
        this.categoryCode = categoryCode;
        this.matchSource = matchSource;
        this.matchReason = matchReason;
        this.score = score;
    }
}
