package com.ttait.subscription.external.pdf;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ttait.subscription.external.ai.GeminiClient;
import com.ttait.subscription.external.ai.GeminiRateLimitException;
import com.ttait.subscription.external.ai.dto.PdfParseResult;
import com.ttait.subscription.external.openclaw.OpenClawPdfParserClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class PdfParsingService {

    private static final Logger log = LoggerFactory.getLogger(PdfParsingService.class);
    private static final long GEMINI_CALL_DELAY_MS = 6_000; // 10 RPM safety margin

    private final PdfTextExtractor textExtractor;
    private final GeminiClient geminiClient;
    private final OpenClawPdfParserClient openClawPdfParserClient;
    private final ObjectMapper objectMapper;

    public PdfParsingService(PdfTextExtractor textExtractor,
                             GeminiClient geminiClient,
                             OpenClawPdfParserClient openClawPdfParserClient,
                             ObjectMapper objectMapper) {
        this.textExtractor = textExtractor;
        this.geminiClient = geminiClient;
        this.openClawPdfParserClient = openClawPdfParserClient;
        this.objectMapper = objectMapper;
    }

    public PdfParseResult parse(String pdfUrl) {
        return parseWithRaw(pdfUrl).result();
    }

    public PdfParsingResult parseWithRaw(String pdfUrl) {
        if (pdfUrl == null || pdfUrl.isBlank()) {
            return PdfParsingResult.empty();
        }

        if (openClawPdfParserClient.isEnabled()) {
            PdfParsingResult openClawResult = parseWithOpenClaw(pdfUrl);
            if (openClawResult.result() != null) {
                return openClawResult;
            }
            if (!openClawPdfParserClient.isFallbackToGeminiEnabled()) {
                throw new IllegalStateException("OpenClaw PDF parse failed and Gemini fallback is disabled: " + pdfUrl);
            }
        }

        return parseWithGemini(pdfUrl);
    }

    private PdfParsingResult parseWithOpenClaw(String pdfUrl) {
        if (!openClawPdfParserClient.isEnabled()) {
            return PdfParsingResult.empty();
        }

        try {
            OpenClawPdfParserClient.OpenClawPdfParseResponse response = openClawPdfParserClient.parse(pdfUrl);
            if (response.result() != null) {
                PdfParseResult result = response.result();
                log.info(
                        "OpenClaw PDF parse succeeded: url={}, noticeType={}, supply={}, depositAmountManwon={}, monthlyRentAmountManwon={}, scheduleCount={}, eligibilityPresent={}",
                        pdfUrl,
                        result.noticeType(),
                        valueOf(result.supplyHouseholdCount()),
                        result.depositAmountManwon(),
                        result.monthlyRentAmountManwon(),
                        result.scheduleDetails() == null ? 0 : result.scheduleDetails().size(),
                        result.eligibility() != null
                );
                return new PdfParsingResult(response.result(), response.rawJson());
            }
        } catch (Exception e) {
            if (openClawPdfParserClient.isFallbackToGeminiEnabled()) {
                log.warn("OpenClaw PDF parse failed, falling back to Gemini: url={}, error={}", pdfUrl, e.getMessage());
            } else {
                log.warn("OpenClaw PDF parse failed: url={}, error={}", pdfUrl, e.getMessage());
            }
        }

        return PdfParsingResult.empty();
    }

    private PdfParsingResult parseWithGemini(String pdfUrl) {
        byte[] pdfBytes = textExtractor.downloadBytes(pdfUrl);
        if (pdfBytes != null) {
            log.info("Gemini PDF parse: url={}, bytes={}", pdfUrl, pdfBytes.length);
            sleepForRateLimit();
            try {
                PdfParseResult result = geminiClient.parsePdf(pdfBytes);
                if (result != null) return new PdfParsingResult(result, safeJson(result));
                log.warn("Gemini PDF parse failed, falling back to text: {}", pdfUrl);
            } catch (GeminiRateLimitException e) {
                log.warn("Gemini PDF 429 rate limit exhausted, skipping text fallback to preserve RPD: {}", pdfUrl);
                return PdfParsingResult.empty();
            }
        }

        String text = textExtractor.extract(pdfUrl);
        if (text == null) {
            log.warn("No extractable text from PDF: {}", pdfUrl);
            return PdfParsingResult.empty();
        }
        log.info("Gemini text parse: url={}, textLength={}", pdfUrl, text.length());
        sleepForRateLimit();
        try {
            PdfParseResult result = geminiClient.parseText(text);
            return result == null ? PdfParsingResult.empty() : new PdfParsingResult(result, safeJson(result));
        } catch (GeminiRateLimitException e) {
            log.warn("Gemini text 429 rate limit exhausted: {}", pdfUrl);
            return PdfParsingResult.empty();
        }
    }

    private void sleepForRateLimit() {
        try {
            Thread.sleep(GEMINI_CALL_DELAY_MS);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    private String safeJson(PdfParseResult result) {
        try {
            return objectMapper.writeValueAsString(result);
        } catch (JsonProcessingException e) {
            log.warn("Failed to serialize PDF parse result", e);
            return null;
        }
    }

    private String valueOf(PdfParseResult.Field field) {
        return field == null ? null : field.value();
    }

    public record PdfParsingResult(
            PdfParseResult result,
            String rawJson
    ) {
        public static PdfParsingResult empty() {
            return new PdfParsingResult(null, null);
        }
    }
}
