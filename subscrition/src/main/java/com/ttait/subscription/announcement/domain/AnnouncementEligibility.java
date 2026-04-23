package com.ttait.subscription.announcement.domain;

import com.ttait.subscription.common.entity.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "announcement_eligibility")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AnnouncementEligibility extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "announcement_id", nullable = false, unique = true)
    private Announcement announcement;

    @Column(name = "age_min")
    private Integer ageMin;

    @Column(name = "age_max")
    private Integer ageMax;

    @Column(name = "age_raw_text", columnDefinition = "TEXT")
    private String ageRawText;

    @Enumerated(EnumType.STRING)
    @Column(name = "marital_target_type", length = 20)
    private MaritalTargetType maritalTargetType;

    @Column(name = "marriage_year_limit")
    private Integer marriageYearLimit;

    @Column(name = "marital_raw_text", columnDefinition = "TEXT")
    private String maritalRawText;

    @Column(name = "children_min_count")
    private Integer childrenMinCount;

    @Column(name = "children_raw_text", columnDefinition = "TEXT")
    private String childrenRawText;

    @Column(name = "homeless_required")
    private Boolean homelessRequired;

    @Column(name = "homeless_raw_text", columnDefinition = "TEXT")
    private String homelessRawText;

    @Column(name = "low_income_required")
    private Boolean lowIncomeRequired;

    @Column(name = "income_asset_criteria_raw", columnDefinition = "TEXT")
    private String incomeAssetCriteriaRaw;

    @Column(name = "elderly_required")
    private Boolean elderlyRequired;

    @Column(name = "elderly_age_min")
    private Integer elderlyAgeMin;

    @Column(name = "elderly_raw_text", columnDefinition = "TEXT")
    private String elderlyRawText;

    @Column(name = "eligibility_raw", columnDefinition = "TEXT")
    private String eligibilityRaw;

    @Column(name = "special_supply_raw", columnDefinition = "TEXT")
    private String specialSupplyRaw;

    @Enumerated(EnumType.STRING)
    @Column(name = "review_status", nullable = false, length = 20, columnDefinition = "VARCHAR(20) NOT NULL DEFAULT 'PENDING'")
    private ParseReviewStatus reviewStatus;

    @Column(name = "reviewed_by", length = 100)
    private String reviewedBy;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @Column(name = "review_note", columnDefinition = "TEXT")
    private String reviewNote;

    @Builder
    public AnnouncementEligibility(Announcement announcement, Integer ageMin, Integer ageMax, String ageRawText,
                                   MaritalTargetType maritalTargetType, Integer marriageYearLimit, String maritalRawText,
                                   Integer childrenMinCount, String childrenRawText,
                                   Boolean homelessRequired, String homelessRawText,
                                   Boolean lowIncomeRequired, String incomeAssetCriteriaRaw,
                                   Boolean elderlyRequired, Integer elderlyAgeMin, String elderlyRawText,
                                   String eligibilityRaw, String specialSupplyRaw) {
        this.announcement = announcement;
        this.ageMin = ageMin;
        this.ageMax = ageMax;
        this.ageRawText = ageRawText;
        this.maritalTargetType = maritalTargetType;
        this.marriageYearLimit = marriageYearLimit;
        this.maritalRawText = maritalRawText;
        this.childrenMinCount = childrenMinCount;
        this.childrenRawText = childrenRawText;
        this.homelessRequired = homelessRequired;
        this.homelessRawText = homelessRawText;
        this.lowIncomeRequired = lowIncomeRequired;
        this.incomeAssetCriteriaRaw = incomeAssetCriteriaRaw;
        this.elderlyRequired = elderlyRequired;
        this.elderlyAgeMin = elderlyAgeMin;
        this.elderlyRawText = elderlyRawText;
        this.eligibilityRaw = eligibilityRaw;
        this.specialSupplyRaw = specialSupplyRaw;
        this.reviewStatus = ParseReviewStatus.PENDING;
    }

    public void update(Integer ageMin, Integer ageMax, String ageRawText,
                       MaritalTargetType maritalTargetType, Integer marriageYearLimit, String maritalRawText,
                       Integer childrenMinCount, String childrenRawText,
                       Boolean homelessRequired, String homelessRawText,
                       Boolean lowIncomeRequired, String incomeAssetCriteriaRaw,
                       Boolean elderlyRequired, Integer elderlyAgeMin, String elderlyRawText,
                       String eligibilityRaw, String specialSupplyRaw) {
        this.ageMin = ageMin;
        this.ageMax = ageMax;
        this.ageRawText = ageRawText;
        this.maritalTargetType = maritalTargetType;
        this.marriageYearLimit = marriageYearLimit;
        this.maritalRawText = maritalRawText;
        this.childrenMinCount = childrenMinCount;
        this.childrenRawText = childrenRawText;
        this.homelessRequired = homelessRequired;
        this.homelessRawText = homelessRawText;
        this.lowIncomeRequired = lowIncomeRequired;
        this.incomeAssetCriteriaRaw = incomeAssetCriteriaRaw;
        this.elderlyRequired = elderlyRequired;
        this.elderlyAgeMin = elderlyAgeMin;
        this.elderlyRawText = elderlyRawText;
        this.eligibilityRaw = eligibilityRaw;
        this.specialSupplyRaw = specialSupplyRaw;
    }

    public void approve(String reviewerLoginId) {
        this.reviewStatus = ParseReviewStatus.APPROVED;
        this.reviewedBy = reviewerLoginId;
        this.reviewedAt = LocalDateTime.now();
    }

    public void correct(String reviewerLoginId, String note,
                        Integer ageMin, Integer ageMax, MaritalTargetType maritalTargetType,
                        Integer marriageYearLimit, Integer childrenMinCount,
                        Boolean homelessRequired, Boolean lowIncomeRequired,
                        Boolean elderlyRequired, Integer elderlyAgeMin) {
        if (ageMin != null) this.ageMin = ageMin;
        if (ageMax != null) this.ageMax = ageMax;
        if (maritalTargetType != null) this.maritalTargetType = maritalTargetType;
        if (marriageYearLimit != null) this.marriageYearLimit = marriageYearLimit;
        if (childrenMinCount != null) this.childrenMinCount = childrenMinCount;
        if (homelessRequired != null) this.homelessRequired = homelessRequired;
        if (lowIncomeRequired != null) this.lowIncomeRequired = lowIncomeRequired;
        if (elderlyRequired != null) this.elderlyRequired = elderlyRequired;
        if (elderlyAgeMin != null) this.elderlyAgeMin = elderlyAgeMin;
        this.reviewStatus = ParseReviewStatus.CORRECTED;
        this.reviewedBy = reviewerLoginId;
        this.reviewedAt = LocalDateTime.now();
        this.reviewNote = note;
    }

    public void reject(String reviewerLoginId, String note) {
        this.reviewStatus = ParseReviewStatus.REJECTED;
        this.reviewedBy = reviewerLoginId;
        this.reviewedAt = LocalDateTime.now();
        this.reviewNote = note;
    }

    public void resetToPending() {
        this.reviewStatus = ParseReviewStatus.PENDING;
        this.reviewedBy = null;
        this.reviewedAt = null;
        this.reviewNote = null;
    }
}
