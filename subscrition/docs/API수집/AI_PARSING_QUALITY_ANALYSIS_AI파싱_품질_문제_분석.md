# AI 파싱 품질 문제 분석

## 발생 현상

`announcement_detail` 테이블 id=7 (효천LH천년나무2단지 잔여세대 분양전환 공고, 2026-02-25)의
파싱 결과 주요 필드가 비어있음. 동일 PDF를 Gemini로 분석하면 아래 정보를 정확히 추출함:

| Gemini 추출 결과 | 우리 시스템 결과 |
|----------------|---------------|
| 분양가격: 1억8000만~2억1850만원 | null (필드 없음) |
| 청약신청: 2026.03.10~03.12 | 불명확 또는 null |
| 순번추첨: 2026.03.18 | 누락 |
| 사전개방: 2026.03.19~03.20 | 누락 |
| 계약체결: 2026.03.25~03.26 | 누락 |
| 상시계약: 2026.04.01~ | 누락 |
| 공급규모: 총 10호 | 불명확 |
| 계약금 10%, 잔금 60일 | 필드 없음 |
| 필수 유의사항 3개 항목 | 필드 없음 |

---

## 근본 원인 분석

### 원인 1: PDFBox 텍스트 추출 품질 문제 (핵심)

**파일**: `external/pdf/PdfTextExtractor.java:42`

```java
PDFTextStripper stripper = new PDFTextStripper();
String text = stripper.getText(document);  // 기본 텍스트 스트리퍼만 사용
```

`PDFTextStripper`는 PDF 텍스트를 **좌→우, 위→아래 선형**으로 읽음.
LH 공고 PDF는 아래 레이아웃을 빈번하게 사용하는데 PDFBox가 이를 처리 못함:

| PDF 구조 | PDFBox 결과 |
|---------|-----------|
| 일정표 (표 형태) | 행/열이 뒤섞인 의미없는 텍스트 |
| 가격표 (2~3컬럼) | 컬럼 내용이 합쳐져서 순서 파괴 |
| 절대 좌표 텍스트 | 렌더링 순서와 추출 순서 불일치 |

**Gemini와의 차이**:
- Gemini: PDF를 **이미지(Vision)** 로 처리 → 표를 시각적으로 인식 → 정확한 추출
- 우리 시스템: 텍스트만 추출 → 표 구조 파괴 → AI에게 깨진 텍스트 전달 → 파싱 실패

표 구조가 포함된 LH 공고 PDF에서 이 문제가 가장 자주 발생하며, 분양전환·잔여세대
공고처럼 가격표와 일정표가 복잡한 경우 특히 심각함.

---

### 원인 2: 시스템 프롬프트가 임대(賃貸) 전용으로 설계됨

**파일**: `external/ai/OpenAiClient.java:22` (SYSTEM_PROMPT)
**파일**: `external/ai/dto/PdfParseResult.java`

현재 `PdfParseResult`에 존재하는 금액 필드:

```java
Long depositAmountManwon;      // 보증금 (임대 전용)
Long monthlyRentAmountManwon;  // 월세 (임대 전용)
```

id=7 공고는 **분양전환** 공고라 핵심 정보가 분양가격(1억8천~2억1천만원)인데,
이를 저장할 필드가 없음 → AI가 추출해도 어디에도 저장되지 않고 버려짐.

시스템 프롬프트 `Rules` 에도 분양가 추출 지침이 없어, AI 자체가 분양가를 무시하는 경향.

#### 단일 일정 필드 문제

현재 구조:
```json
"applicationPeriod": {"value": "string"}  ← 단일 string
```

LH 공고에는 복수의 독립된 일정이 존재:
- 청약신청 기간
- 순번추첨일
- 사전주택개방 기간
- 동·호 지정 및 계약체결일
- 상시계약 시작일

단일 string에 이 모두를 넣으려 하니 AI가 하나만 선택하거나 생략함.

---

### 원인 3: gpt-4o-mini 모델 한계

현재 사용 모델: `gpt-4o-mini` (텍스트 전용)

| 항목 | gpt-4o-mini | Gemini 1.5/2.0 |
|------|------------|----------------|
| Vision 지원 | 없음 (텍스트 전용) | 있음 (PDF 이미지 직접 처리) |
| 깨진 표 텍스트 재조합 | 제한적 | 시각적으로 직접 인식해 불필요 |
| 긴 문서 컨텍스트 이해 | 128K (절삭 발생) | 1M+ 토큰 |

`gpt-4o-mini`는 PDFBox가 깨뜨린 텍스트에서 원래 표 구조를 역추론하기 어려움.

---

## 개선 방향

### Phase 1 — 시스템 프롬프트 & DTO 개선 (단기, 코드 수정 필요)

**`PdfParseResult.java` 추가 필드:**

```java
// 공고 유형 (임대/분양/분양전환/기타 자동 판별)
String noticeType;

// 분양가격 범위 (만원 단위)
Long salePriceMinManwon;
Long salePriceMaxManwon;
String salePriceRaw;  // 원문 그대로

// 세부 일정 (복수)
List<ScheduleItem> scheduleDetails;
// ScheduleItem { String scheduleType, String startDate, String endDate }

// 유의사항
Field importantNotes;
```

**SYSTEM_PROMPT 수정 방향:**
- `noticeType` 판별 규칙 추가 (키워드: "분양전환", "잔여세대", "임대", "분양")
- `salePriceRange` 추출 규칙 추가
- `scheduleDetails` 배열로 복수 일정 분리 추출
- `importantNotes` 추출 규칙 추가
- 기존 `depositAmountManwon`/`monthlyRentAmountManwon` 은 임대(noticeType=임대) 공고에만 유효하다고 명시

**DB 변경:**
- `announcement_detail` 에 `notice_type`, `sale_price_raw`, `schedule_details_json` 컬럼 추가

---

### Phase 2 — PDF → 이미지 → Vision API 전환 (중기, 구조 변경 필요)

PDFBox 텍스트 추출을 **PDF 이미지 렌더링 + Vision API** 방식으로 전환:

```
PDF 다운로드
    ↓
PDFBox PDFRenderer → 각 페이지 PNG 이미지 렌더링
    ↓
이미지 base64 인코딩
    ↓
OpenAI gpt-4o (vision) 또는 Gemini API에 이미지로 전송
    ↓
표·다단 레이아웃을 시각적으로 인식 → 정확한 파싱
```

**단기 대안:** 모델을 `gpt-4o-mini` → `gpt-4o`로 업그레이드
(Vision 없이도 텍스트 이해력이 대폭 향상)

---

## 관련 파일

| 파일 | 문제 연관성 |
|------|-----------|
| `external/pdf/PdfTextExtractor.java` | PDFBox 텍스트 추출 (원인 1) |
| `external/ai/OpenAiClient.java` | SYSTEM_PROMPT, 모델 설정 (원인 2, 3) |
| `external/ai/dto/PdfParseResult.java` | 파싱 결과 DTO (원인 2) |
| `external/service/NoticeImportPersistenceService.java` | DB 저장 매핑 |
