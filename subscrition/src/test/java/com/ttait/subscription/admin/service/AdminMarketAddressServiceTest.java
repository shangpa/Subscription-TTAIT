package com.ttait.subscription.admin.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.then;

import com.ttait.subscription.admin.dto.AddressNormalizationResponse;
import com.ttait.subscription.admin.dto.LawdCodeMappingUpsertRequest;
import com.ttait.subscription.admin.dto.LawdCodeMappingUpsertResponse;
import com.ttait.subscription.common.exception.ApiException;
import com.ttait.subscription.external.service.AnnouncementUnitAddressEnrichmentService;
import com.ttait.subscription.market.domain.LawdCodeMapping;
import com.ttait.subscription.market.repository.LawdCodeMappingRepository;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AdminMarketAddressServiceTest {

    @Mock
    private LawdCodeMappingRepository lawdCodeMappingRepository;
    @Mock
    private AnnouncementUnitAddressEnrichmentService addressEnrichmentService;

    private AdminMarketAddressService service;

    @BeforeEach
    void setUp() {
        service = new AdminMarketAddressService(lawdCodeMappingRepository, addressEnrichmentService);
    }

    @Test
    void upsertLawdCodeMappingsInsertsNewAndUpdatesExistingMappings() {
        LawdCodeMapping existing = LawdCodeMapping.builder()
                .regionLevel1("인천광역시")
                .regionLevel2("부평구")
                .legalDongName("부평동")
                .legalDongCode("2823710100")
                .active(true)
                .build();
        given(lawdCodeMappingRepository.findFirstByRegionLevel2AndLegalDongNameAndLegalDongCode(
                "김포시", "마산동", "4157010900"))
                .willReturn(Optional.empty());
        given(lawdCodeMappingRepository.findFirstByRegionLevel2AndLegalDongNameAndLegalDongCode(
                "부평구", "부평동", "2823710100"))
                .willReturn(Optional.of(existing));

        LawdCodeMappingUpsertResponse response = service.upsertLawdCodeMappings(new LawdCodeMappingUpsertRequest(List.of(
                new LawdCodeMappingUpsertRequest.Item(" 경기도 ", " 김포시 ", " 마산동 ", "4157010900", true),
                new LawdCodeMappingUpsertRequest.Item("인천광역시", "부평구", "부평동", "2823710100", false)
        )));

        assertThat(response.requestedCount()).isEqualTo(2);
        assertThat(response.insertedCount()).isEqualTo(1);
        assertThat(response.updatedCount()).isEqualTo(1);
        assertThat(existing.isActive()).isFalse();
        then(lawdCodeMappingRepository).should().save(any(LawdCodeMapping.class));
    }

    @Test
    void upsertLawdCodeMappingsRejectsInvalidLegalDongCode() {
        LawdCodeMappingUpsertRequest request = new LawdCodeMappingUpsertRequest(List.of(
                new LawdCodeMappingUpsertRequest.Item("경기도", "김포시", "마산동", "41570", true)
        ));

        assertThatThrownBy(() -> service.upsertLawdCodeMappings(request))
                .isInstanceOf(ApiException.class)
                .hasMessage("legalDongCode must be 10 digits");
    }

    @Test
    void normalizeAnnouncementUnitsDelegatesToAddressEnrichmentService() {
        given(addressEnrichmentService.enrichUnits(1L, true))
                .willReturn(new AnnouncementUnitAddressEnrichmentService.AddressEnrichmentResult(1L, 3, 2, 0, 1));

        AddressNormalizationResponse response = service.normalizeAnnouncementUnits(1L, true);

        assertThat(response.announcementId()).isEqualTo(1L);
        assertThat(response.processedCount()).isEqualTo(3);
        assertThat(response.successCount()).isEqualTo(2);
        assertThat(response.noLawdCodeCount()).isEqualTo(1);
        then(addressEnrichmentService).should().enrichUnits(1L, true);
    }
}
