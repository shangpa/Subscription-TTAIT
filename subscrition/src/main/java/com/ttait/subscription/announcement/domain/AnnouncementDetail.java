package com.ttait.subscription.announcement.domain;

import com.ttait.subscription.common.entity.SoftDeleteBaseEntity;
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
import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "announcement_detail")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AnnouncementDetail extends SoftDeleteBaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "announcement_id", nullable = false, unique = true)
    private Announcement announcement;

    @Column(name = "application_datetime_text", length = 255)
    private String applicationDatetimeText;

    @Column(name = "document_submit_start_date")
    private LocalDate documentSubmitStartDate;

    @Column(name = "document_submit_end_date")
    private LocalDate documentSubmitEndDate;

    @Column(name = "contract_start_date")
    private LocalDate contractStartDate;

    @Column(name = "contract_end_date")
    private LocalDate contractEndDate;

    @Column(name = "complex_name", length = 255)
    private String complexName;

    @Column(name = "complex_address", length = 255)
    private String complexAddress;

    @Column(name = "complex_detail_address", length = 255)
    private String complexDetailAddress;

    @Column(name = "household_count")
    private Integer householdCount;

    @Column(name = "heating_type", length = 100)
    private String heatingType;

    @Column(name = "exclusive_area_text", length = 100)
    private String exclusiveAreaText;

    @Column(name = "exclusive_area_value", precision = 10, scale = 2)
    private BigDecimal exclusiveAreaValue;

    @Column(name = "move_in_expected_ym", length = 20)
    private String moveInExpectedYm;

    @Column(name = "guide_text", columnDefinition = "TEXT")
    private String guideText;

    @Column(name = "contact_phone", length = 50)
    private String contactPhone;

    @Column(name = "contact_address", length = 255)
    private String contactAddress;

    @Column(name = "contact_guide_text", columnDefinition = "TEXT")
    private String contactGuideText;

    @Column(name = "supply_household_count_raw", columnDefinition = "TEXT")
    private String supplyHouseholdCountRaw;

    @Column(name = "supply_household_count_basis", columnDefinition = "TEXT")
    private String supplyHouseholdCountBasis;

    @Enumerated(EnumType.STRING)
    @Column(name = "supply_household_count_confidence", length = 10)
    private ConfidenceLevel supplyHouseholdCountConfidence;

    @Column(name = "deposit_monthly_rent_raw", columnDefinition = "TEXT")
    private String depositMonthlyRentRaw;

    @Column(name = "income_asset_criteria_raw", columnDefinition = "TEXT")
    private String incomeAssetCriteriaRaw;

    @Column(name = "contact_raw", columnDefinition = "TEXT")
    private String contactRaw;

    @Column(name = "eligibility_raw", columnDefinition = "TEXT")
    private String eligibilityRaw;

    @Builder
    public AnnouncementDetail(Announcement announcement, String applicationDatetimeText,
                              LocalDate documentSubmitStartDate, LocalDate documentSubmitEndDate,
                              LocalDate contractStartDate, LocalDate contractEndDate, String complexName,
                              String complexAddress, String complexDetailAddress, Integer householdCount,
                              String heatingType, String exclusiveAreaText, BigDecimal exclusiveAreaValue,
                              String moveInExpectedYm, String guideText, String contactPhone,
                              String contactAddress, String contactGuideText) {
        this.announcement = announcement;
        this.applicationDatetimeText = applicationDatetimeText;
        this.documentSubmitStartDate = documentSubmitStartDate;
        this.documentSubmitEndDate = documentSubmitEndDate;
        this.contractStartDate = contractStartDate;
        this.contractEndDate = contractEndDate;
        this.complexName = complexName;
        this.complexAddress = complexAddress;
        this.complexDetailAddress = complexDetailAddress;
        this.householdCount = householdCount;
        this.heatingType = heatingType;
        this.exclusiveAreaText = exclusiveAreaText;
        this.exclusiveAreaValue = exclusiveAreaValue;
        this.moveInExpectedYm = moveInExpectedYm;
        this.guideText = guideText;
        this.contactPhone = contactPhone;
        this.contactAddress = contactAddress;
        this.contactGuideText = contactGuideText;
    }

    public void updateFromImport(String applicationDatetimeText, LocalDate documentSubmitStartDate,
                                 LocalDate documentSubmitEndDate, LocalDate contractStartDate, LocalDate contractEndDate,
                                 String complexName, String complexAddress, String complexDetailAddress,
                                 Integer householdCount, String heatingType, String exclusiveAreaText,
                                 BigDecimal exclusiveAreaValue, String moveInExpectedYm, String guideText,
                                 String contactPhone, String contactAddress, String contactGuideText) {
        this.applicationDatetimeText = applicationDatetimeText;
        this.documentSubmitStartDate = documentSubmitStartDate;
        this.documentSubmitEndDate = documentSubmitEndDate;
        this.contractStartDate = contractStartDate;
        this.contractEndDate = contractEndDate;
        this.complexName = complexName;
        this.complexAddress = complexAddress;
        this.complexDetailAddress = complexDetailAddress;
        this.householdCount = householdCount;
        this.heatingType = heatingType;
        this.exclusiveAreaText = exclusiveAreaText;
        this.exclusiveAreaValue = exclusiveAreaValue;
        this.moveInExpectedYm = moveInExpectedYm;
        this.guideText = guideText;
        this.contactPhone = contactPhone;
        this.contactAddress = contactAddress;
        this.contactGuideText = contactGuideText;
    }

    public void updateEligibilityRaw(String eligibilityRaw) {
        if (eligibilityRaw != null) this.eligibilityRaw = eligibilityRaw;
    }

    public void updatePdfParseResult(String supplyHouseholdCountRaw, String supplyHouseholdCountBasis,
                                     ConfidenceLevel supplyHouseholdCountConfidence, String depositMonthlyRentRaw,
                                     String incomeAssetCriteriaRaw, String contactRaw, String eligibilityRaw) {
        if (supplyHouseholdCountRaw != null) this.supplyHouseholdCountRaw = supplyHouseholdCountRaw;
        if (supplyHouseholdCountBasis != null) this.supplyHouseholdCountBasis = supplyHouseholdCountBasis;
        if (supplyHouseholdCountConfidence != null) this.supplyHouseholdCountConfidence = supplyHouseholdCountConfidence;
        if (depositMonthlyRentRaw != null) this.depositMonthlyRentRaw = depositMonthlyRentRaw;
        if (incomeAssetCriteriaRaw != null) this.incomeAssetCriteriaRaw = incomeAssetCriteriaRaw;
        if (contactRaw != null) this.contactRaw = contactRaw;
        if (eligibilityRaw != null) this.eligibilityRaw = eligibilityRaw;
    }
}
