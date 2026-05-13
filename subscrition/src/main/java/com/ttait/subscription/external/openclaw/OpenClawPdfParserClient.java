package com.ttait.subscription.external.openclaw;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ttait.subscription.external.ai.dto.PdfParseResult;
import jakarta.annotation.PostConstruct;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
@EnableConfigurationProperties(OpenClawProperties.class)
public class OpenClawPdfParserClient {

    private static final Logger log = LoggerFactory.getLogger(OpenClawPdfParserClient.class);
    private static final String TOOL_NAME = "lh_pdf_parse_result";

    private final RestClient restClient;
    private final OpenClawProperties properties;
    private final ObjectMapper objectMapper;

    public OpenClawPdfParserClient(RestClient restClient,
                                   OpenClawProperties properties,
                                   ObjectMapper objectMapper) {
        this.restClient = restClient;
        this.properties = properties;
        this.objectMapper = objectMapper;
    }

    public boolean isEnabled() {
        return properties.enabled();
    }

    @PostConstruct
    void logSafeConfig() {
        log.info(
                "OpenClaw config: enabled={}, gatewayUrl={}, tokenConfigured={}, sessionKey={}, maxBytesMb={}, maxPages={}, fallbackToGemini={}",
                properties.enabled(),
                properties.gatewayUrl(),
                properties.gatewayToken() != null && !properties.gatewayToken().isBlank(),
                properties.sessionKey(),
                properties.pdf().maxBytesMb(),
                properties.pdf().maxPages(),
                properties.fallbackToGemini()
        );
    }

    public boolean isFallbackToGeminiEnabled() {
        return properties.fallbackToGemini();
    }

    public OpenClawPdfParseResponse parse(String pdfUrl) {
        if (!properties.enabled()) {
            throw new IllegalStateException("OpenClaw PDF parser is disabled");
        }
        if (pdfUrl == null || pdfUrl.isBlank()) {
            throw new IllegalArgumentException("pdfUrl is blank");
        }
        if (properties.gatewayToken() == null || properties.gatewayToken().isBlank()) {
            throw new IllegalStateException("OPENCLAW_GATEWAY_TOKEN is missing");
        }

        Map<String, Object> request = Map.of(
                "tool", TOOL_NAME,
                "sessionKey", properties.sessionKey(),
                "args", Map.of(
                        "url", pdfUrl,
                        "maxBytesMb", properties.pdf().maxBytesMb(),
                        "maxPages", properties.pdf().maxPages()
                )
        );

        String responseBody = restClient.post()
                .uri(invokeUrl())
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + properties.gatewayToken())
                .contentType(MediaType.APPLICATION_JSON)
                .body(request)
                .retrieve()
                .body(String.class);

        if (responseBody == null || responseBody.isBlank()) {
            throw new IllegalStateException("OpenClaw response is empty");
        }

        try {
            JsonNode root = objectMapper.readTree(responseBody);
            boolean ok = root.path("ok").asBoolean(false);
            if (!ok) {
                String errorMessage = root.path("error").path("message").asText(responseBody);
                throw new IllegalStateException("OpenClaw tool failed: " + errorMessage);
            }

            JsonNode content = root.path("result").path("content");
            if (!content.isArray() || content.isEmpty()) {
                throw new IllegalStateException("OpenClaw response has no result.content");
            }

            String rawPdfParseResultJson = content.get(0).path("text").asText();
            if (rawPdfParseResultJson == null || rawPdfParseResultJson.isBlank()) {
                throw new IllegalStateException("OpenClaw result.content[0].text is empty");
            }

            JsonNode rawPdfParseResult = objectMapper.readTree(rawPdfParseResultJson);
            JsonNode pdfParseResultNode = findPdfParseResultNode(rawPdfParseResult);
            if (pdfParseResultNode == null) {
                throw new IllegalStateException("OpenClaw result.content[0].text has no PdfParseResult fields: "
                        + abbreviate(rawPdfParseResultJson));
            }

            PdfParseResult result = objectMapper.treeToValue(pdfParseResultNode, PdfParseResult.class);
            String normalizedRawJson = objectMapper.writeValueAsString(pdfParseResultNode);
            return new OpenClawPdfParseResponse(result, normalizedRawJson);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to parse OpenClaw PdfParseResult", e);
        }
    }

    private JsonNode findPdfParseResultNode(JsonNode node) {
        if (node == null || node.isMissingNode() || node.isNull()) {
            return null;
        }
        if (node.isTextual()) {
            try {
                return findPdfParseResultNode(objectMapper.readTree(node.asText()));
            } catch (JsonProcessingException e) {
                return null;
            }
        }
        if (hasPdfParseResultField(node)) {
            return node;
        }

        String[] candidateFields = {"result", "data", "pdfParseResult", "parseResult", "details", "json"};
        for (String field : candidateFields) {
            JsonNode candidate = node.get(field);
            JsonNode resolved = findPdfParseResultNode(candidate);
            if (resolved != null) {
                return resolved;
            }
        }

        return null;
    }

    private boolean hasPdfParseResultField(JsonNode node) {
        return node != null
                && node.isObject()
                && (node.has("noticeType")
                || node.has("applicationPeriod")
                || node.has("supplyHouseholdCount")
                || node.has("depositMonthlyRent")
                || node.has("depositAmountManwon")
                || node.has("monthlyRentAmountManwon")
                || node.has("scheduleDetails")
                || node.has("eligibility"));
    }

    private String abbreviate(String text) {
        String compact = text.replaceAll("\\s+", " ").trim();
        if (compact.length() <= 500) {
            return compact;
        }
        return compact.substring(0, 500) + "...";
    }

    private String invokeUrl() {
        String gatewayUrl = properties.gatewayUrl();
        if (gatewayUrl.endsWith("/")) {
            return gatewayUrl + "tools/invoke";
        }
        return gatewayUrl + "/tools/invoke";
    }

    public record OpenClawPdfParseResponse(
            PdfParseResult result,
            String rawJson
    ) {
    }
}
