package com.ttait.subscription.external.ai;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.given;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ttait.subscription.external.ai.dto.PdfParseResult;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.web.client.RestClient;

@ExtendWith(MockitoExtension.class)
class OpenAiClientTest {

    @Mock private RestClient restClient;
    @Mock private RestClient.RequestBodyUriSpec uriSpec;
    @Mock private RestClient.RequestBodySpec bodySpec;
    @Mock private RestClient.ResponseSpec responseSpec;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private OpenAiClient client;

    @BeforeEach
    void setUp() {
        var properties = new OpenAiProperties("test-key", "gpt-4o-mini", "https://api.openai.com/v1");
        client = new OpenAiClient(restClient, properties, objectMapper);
    }

    /** OpenAI 응답 구조에 맞는 JsonNode 생성. 모든 필드 null인 최소 JSON. */
    private JsonNode buildOpenAiResponse() throws Exception {
        String innerContent = """
                {
                  "applicationPeriod": null,
                  "supplyHouseholdCount": null,
                  "depositMonthlyRent": null,
                  "depositAmountManwon": null,
                  "monthlyRentAmountManwon": null,
                  "incomeAssetCriteria": null,
                  "contact": null,
                  "eligibility": null
                }
                """;
        Map<String, Object> response = Map.of(
                "choices", List.of(Map.of("message", Map.of("content", innerContent))));
        return objectMapper.valueToTree(response);
    }

    @SuppressWarnings("unchecked")
    private void stubRestClientChain(ArgumentCaptor<Object> bodyCaptor, JsonNode responseNode) {
        given(restClient.post()).willReturn(uriSpec);
        given(uriSpec.uri(anyString())).willReturn(bodySpec);
        given(bodySpec.header(anyString(), any(String[].class))).willReturn(bodySpec);
        given(bodySpec.contentType(any(MediaType.class))).willReturn(bodySpec);
        given(bodySpec.body(bodyCaptor.capture())).willReturn(bodySpec);
        given(bodySpec.retrieve()).willReturn(responseSpec);
        given(responseSpec.body(JsonNode.class)).willReturn(responseNode);
    }

    @SuppressWarnings("unchecked")
    private void stubRestClientToThrow(RuntimeException ex) {
        given(restClient.post()).willReturn(uriSpec);
        given(uriSpec.uri(anyString())).willReturn(bodySpec);
        given(bodySpec.header(anyString(), any(String[].class))).willReturn(bodySpec);
        given(bodySpec.contentType(any(MediaType.class))).willReturn(bodySpec);
        given(bodySpec.body(any())).willReturn(bodySpec);
        given(bodySpec.retrieve()).willReturn(responseSpec);
        given(responseSpec.body(JsonNode.class)).willThrow(ex);
    }

    @SuppressWarnings("unchecked")
    private String extractSentContent(ArgumentCaptor<Object> bodyCaptor) {
        Map<String, Object> sentBody = (Map<String, Object>) bodyCaptor.getValue();
        List<Map<String, Object>> messages = (List<Map<String, Object>>) sentBody.get("messages");
        return (String) messages.get(1).get("content");
    }

    @Nested
    @DisplayName("텍스트 길이 제한 처리")
    class TextLengthHandling {

        @Test
        @DisplayName("200,000자 초과 텍스트는 잘라서 OpenAI에 전송한다")
        void parse_whenTextExceedsLimit_truncatesTo200K() throws Exception {
            // Arrange — 250,000자 생성 (한도 200,000자 초과)
            String oversizedText = "가".repeat(250_000);
            ArgumentCaptor<Object> bodyCaptor = ArgumentCaptor.forClass(Object.class);
            stubRestClientChain(bodyCaptor, buildOpenAiResponse());

            // Act
            client.parse(oversizedText);

            // Assert — OpenAI에 전송된 user 메시지가 정확히 200,000자인지 확인
            String sentContent = extractSentContent(bodyCaptor);
            assertThat(sentContent).hasSize(200_000);
            assertThat(sentContent).isEqualTo("가".repeat(200_000));
        }

        @Test
        @DisplayName("200,000자 이하 텍스트는 잘리지 않고 원본 그대로 전송된다")
        void parse_whenTextWithinLimit_sendsFullText() throws Exception {
            // Arrange — 100,000자 생성 (한도 이하)
            String normalText = "나".repeat(100_000);
            ArgumentCaptor<Object> bodyCaptor = ArgumentCaptor.forClass(Object.class);
            stubRestClientChain(bodyCaptor, buildOpenAiResponse());

            // Act
            client.parse(normalText);

            // Assert — 원본 그대로 전송됐는지 확인
            String sentContent = extractSentContent(bodyCaptor);
            assertThat(sentContent).hasSize(100_000);
            assertThat(sentContent).isEqualTo(normalText);
        }

        @Test
        @DisplayName("정확히 200,000자 텍스트는 잘리지 않고 그대로 전송된다")
        void parse_whenTextExactlyAtLimit_sendsFullText() throws Exception {
            // Arrange — 경계값: 정확히 200,000자
            String boundaryText = "다".repeat(200_000);
            ArgumentCaptor<Object> bodyCaptor = ArgumentCaptor.forClass(Object.class);
            stubRestClientChain(bodyCaptor, buildOpenAiResponse());

            // Act
            client.parse(boundaryText);

            // Assert — 그대로 전송
            String sentContent = extractSentContent(bodyCaptor);
            assertThat(sentContent).hasSize(200_000);
        }
    }

    @Nested
    @DisplayName("OpenAI API 오류 처리")
    class ApiErrorHandling {

        @Test
        @DisplayName("context_length_exceeded 오류 시 null을 반환하고 예외를 던지지 않는다")
        void parse_whenContextLengthExceeded_returnsNull() {
            // Arrange — context_length_exceeded 메시지를 포함한 예외
            stubRestClientToThrow(new RuntimeException(
                    "400 Bad Request: context_length_exceeded - maximum context length is 128000"));

            // Act
            PdfParseResult result = client.parse("테스트".repeat(10_000));

            // Assert
            assertThat(result).isNull();
        }

        @Test
        @DisplayName("maximum context length 오류 시 null을 반환하고 예외를 던지지 않는다")
        void parse_whenMaximumContextLength_returnsNull() {
            // Arrange — OpenAI가 반환하는 또 다른 컨텍스트 초과 메시지 형태
            stubRestClientToThrow(new RuntimeException(
                    "This model's maximum context length is 128000 tokens"));

            // Act
            PdfParseResult result = client.parse("테스트");

            // Assert
            assertThat(result).isNull();
        }

        @Test
        @DisplayName("인증 오류 등 일반 API 오류 시에도 null을 반환하고 예외를 던지지 않는다")
        void parse_whenGenericApiError_returnsNull() {
            // Arrange — 401 Unauthorized
            stubRestClientToThrow(new RuntimeException("401 Unauthorized"));

            // Act
            PdfParseResult result = client.parse("테스트");

            // Assert
            assertThat(result).isNull();
        }
    }
}
