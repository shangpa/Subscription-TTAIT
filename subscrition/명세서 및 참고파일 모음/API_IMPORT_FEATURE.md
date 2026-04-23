# LH 공고 수집 + PDF AI 파싱 기능 명세

## 기능 개요

LH 외부 API에서 공공임대 공고를 수집하고, 공고에 첨부된 PDF를 AI로 파싱하여 DB에 저장하는 기능.
매일 새벽 2시 자동 실행되며, 관리자 API로 수동 실행도 가능.

---

## 처리 흐름

```
[관리자 API / 스케줄러]
        ↓
LH 목록 API 호출 (페이지 단위)
        ↓
각 공고별 처리 (REQUIRES_NEW 트랜잭션)
        ↓
  ┌─────────────────────────────┐
  │ 1. Announcement upsert      │  ← LH 기본 공고 저장
  │ 2. LH 상세 API 호출          │
  │ 3. PDF URL 추출 (dsAhflInfo) │
  │ 4. PDF 다운로드 → 텍스트 추출 │  ← PDFBox
  │ 5. OpenAI GPT 파싱          │  ← gpt-4o-mini
  │ 6. AnnouncementDetail 저장  │  ← raw 필드 포함
  │ 7. AnnouncementParseRaw 저장│  ← API JSON, PDF AI JSON
  │ 8. AnnouncementCategory 저장│  ← 키워드 기반 카테고리
  └─────────────────────────────┘
```

---

## API 엔드포인트

### POST /api/admin/import/lh

LH 공고를 수동으로 수집합니다.

**권한**: 로그인 필요 (authenticated)

**Query Parameters**

| 파라미터 | 타입 | 기본값 | 설명 |
|---------|------|--------|------|
| page | int | 1 | LH API 페이지 번호 |
| size | int | 10 | 한 번에 수집할 공고 수 |

**Response**

```json
{
  "imported": 8,
  "failed": 2
}
```

| 필드 | 설명 |
|------|------|
| imported | 성공적으로 저장된 공고 수 |
| failed | 처리 중 오류가 발생한 공고 수 |

**예시**

```bash
# 로그인 후 JWT 토큰 획득
curl -X POST /api/auth/login -d '{"loginId":"admin","password":"..."}'

# 공고 수집 (1페이지, 10건)
curl -X POST "/api/admin/import/lh?page=1&size=10" \
  -H "Authorization: Bearer {JWT_TOKEN}"
```

---

## DB 테이블 변경 내역

### 기존 테이블 변경

#### announcement_detail — 추가 컬럼

| 컬럼명 | 타입 | Null | 설명 |
|--------|------|------|------|
| supply_household_count_raw | TEXT | Y | 공급호수 원문 (PDF 추출) |
| supply_household_count_basis | TEXT | Y | 공급호수 판단 근거 문장 |
| supply_household_count_confidence | VARCHAR(10) | Y | 판단 신뢰도: HIGH/MEDIUM/LOW |
| deposit_monthly_rent_raw | TEXT | Y | 보증금/월세 원문 |
| income_asset_criteria_raw | TEXT | Y | 소득/자산 기준 원문 |
| contact_raw | TEXT | Y | 문의처 원문 |
| eligibility_raw | TEXT | Y | 신청자격 원문 |

### 신규 테이블

#### announcement_category

공고의 유저 카테고리 매칭 정보. 한 공고가 여러 카테고리를 가질 수 있음.

| 컬럼명 | 타입 | Null | 설명 |
|--------|------|------|------|
| id | BIGINT | N | PK |
| announcement_id | BIGINT | N | FK → announcement |
| category_code | VARCHAR(20) | N | YOUTH/NEWLYWED/HOMELESS/ELDERLY/LOW_INCOME/MULTI_CHILD |
| match_source | VARCHAR(10) | N | RULE/AI/MANUAL |
| match_reason | TEXT | Y | 판별 근거 키워드 |
| score | INT | Y | 매칭 점수 (키워드 수) |

제약: UNIQUE(announcement_id, category_code)

#### announcement_parse_raw

API 응답 및 AI 파싱 원본 데이터 보관.

| 컬럼명 | 타입 | Null | 설명 |
|--------|------|------|------|
| id | BIGINT | N | PK |
| announcement_id | BIGINT | N | FK → announcement |
| raw_type | VARCHAR(30) | N | API_JSON / PDF_AI_JSON |
| raw_text | LONGTEXT | N | 원본 JSON 문자열 |
| collected_at | DATETIME | N | 수집 시각 |

---

## 카테고리 감지 기준

키워드 매칭 방식 (MatchSource = RULE):

| 카테고리 | 감지 키워드 |
|---------|-----------|
| YOUTH | 청년, 만 19, 만19, 대학생, 사회초년생, 청년매입, 청년전용 |
| NEWLYWED | 신혼부부, 예비신혼부부, 혼인 7년, 혼인7년, 신혼, 신생아 |
| HOMELESS | 무주택, 무주택세대구성원 |
| ELDERLY | 고령자, 만 65세, 만65세, 고령, 노인 |
| LOW_INCOME | 기초생활수급자, 차상위, 저소득, 기초수급 |
| MULTI_CHILD | 다자녀, 미성년 자녀 3인, 미성년자녀3인, 다자녀가구 |

감지 대상 텍스트: 공고명 + 공급유형 + guide_text + eligibility_raw + income_asset_criteria_raw

---

## 공급호수 파싱 규칙

| 패턴 | 신뢰도 | 예시 |
|------|--------|------|
| "총 N호", "N호 공급", "공급호수 N" | HIGH | 총 52호 → 52 |
| "N세대 모집" | HIGH | 22세대 모집 → 22 |
| 단순 "N호" (호실 번호 제외) | LOW | 56호 → 56 |
| 판단 불가 | LOW | count=null로 저장 |

HIGH 신뢰도일 때만 announcement.supply_household_count 업데이트.

---

## 에러 처리 정책

| 상황 | 처리 |
|------|------|
| PDF URL 없음 | PDF 파싱 건너뜀, 공고는 정상 저장 |
| PDF 다운로드 실패 | 로그 경고, PDF 파싱 건너뜀, 공고는 정상 저장 |
| 스캔본 PDF (텍스트 200자 미만) | PDF 파싱 건너뜀, 공고는 정상 저장 |
| OpenAI API 실패 | 로그 에러, raw 필드 null로 저장, 공고는 정상 저장 |
| 개별 공고 처리 실패 | 해당 공고만 failed 카운트, 나머지 계속 처리 |
| LH 목록 API 실패 | 전체 중단, 로그 에러 |

---

## 스케줄러

```
실행 시각: 매일 새벽 2시 (cron: "0 0 2 * * *")
수집 범위: 최대 10페이지 × 100건 = 최대 1,000건
중단 조건: 응답 건수가 0이면 다음 페이지 조회 중단
```

---

## 신규 파일 목록

```
external/
├── config/
│   ├── ExternalApiProperties.java
│   └── ExternalApiConfig.java
├── lh/
│   └── LhApiClient.java
├── ai/
│   ├── OpenAiProperties.java
│   ├── OpenAiClient.java
│   └── dto/PdfParseResult.java
├── pdf/
│   ├── PdfTextExtractor.java
│   └── PdfParsingService.java
├── support/
│   ├── AnnouncementNormalizer.java
│   ├── DateParsers.java
│   ├── CategoryDetector.java
│   └── SupplyCountParser.java
├── service/
│   ├── NoticeImportPersistenceService.java
│   └── NoticeImportOrchestrator.java
└── controller/
    └── ImportController.java
schedule/
└── NoticeCollectionScheduler.java
announcement/domain/
├── AnnouncementCategory.java
├── AnnouncementParseRaw.java
├── ConfidenceLevel.java
└── MatchSource.java
announcement/repository/
├── AnnouncementCategoryRepository.java
└── AnnouncementParseRawRepository.java
```

---

## 향후 추가 예정

- `announcement_eligibility` 테이블: AI 파싱 결과를 정형화한 자격조건 (나이 범위, 혼인 조건, 소득 기준 등)
- MyHome API PDF 연동: 현재 웹페이지 URL만 제공, 크롤링 방식 검토 필요
- 카카오톡 알림 연동: MessageSender 인터페이스 구현체 추가

---

## 테스트 결과 (2026-04-23)

### 환경
- 서버: Spring Boot 8080 포트, MySQL localhost:3306
- 테스트 계정: testadmin (일반 회원)

### 테스트 케이스

#### TC-1. 회원가입 / 로그인
| 항목 | 결과 |
|------|------|
| POST /api/auth/signup | ✅ 정상 (이미 존재 시 409 반환) |
| POST /api/auth/login | ✅ JWT accessToken 정상 발급 |

#### TC-2. LH 공고 수집 (page=1, size=3)
```
POST /api/admin/import/lh?page=1&size=3
응답: {"imported": 3, "failed": 0}
```
| 항목 | 결과 |
|------|------|
| LH 목록 API 호출 | ✅ 정상 |
| LH 상세 API 호출 | ✅ 정상 |
| PDF URL 추출 (dsAhflInfo) | ✅ 3건 모두 PDF URL 확인 |
| PDF 다운로드 + 텍스트 추출 | ✅ 정상 (52,203 / 33,688 / 36,537 chars) |
| OpenAI GPT 파싱 | ❌ 401 Unauthorized — API 키 만료 |
| 공고 DB 저장 | ✅ 3건 저장 (OpenAI 실패해도 공고는 저장됨) |
| API_JSON raw 저장 | ✅ 3건 저장 |
| PDF_AI_JSON raw 저장 | ❌ OpenAI 실패로 미저장 |
| 카테고리 감지 | ✅ announcement_id 1,2번 → ELDERLY 감지 |

#### TC-3. 공고 목록 조회
```
GET /api/announcements?page=0&size=5
```
수집된 3건 정상 조회:
- [1] [정정공고]도청이전신도시 RH10-1BL 행복주택 자격완화 추가입주자 모집공고 | 충청남도 | OPEN
- [2] [인천광역시] 기존주택등 매입임대주택(고령자유형) 예비입주자 모집 | 전국 | OPEN
- [3] [인천광역시] 기존주택등 매입임대주택(일반유형) 예비입주자 모집 | 인천광역시 | OPEN

### 확인된 이슈 (1차)

#### 🔴 OpenAI API 키 만료
- 증상: `401 Unauthorized` — PDF 텍스트 추출은 성공했으나 GPT 호출 실패
- 영향: `supply_household_count_raw`, `eligibility_raw` 등 raw 필드 null, PDF_AI_JSON 미저장
- 해결: `.env`의 `OPENAI_API_KEY` 유효한 키로 교체 + `application.properties`의 `openai.api.key` → `openai.api-key`로 수정 (Spring relaxed binding 이슈)

---

## TC-4. OpenAI 키 교체 후 재수집 (2026-04-23)

**원인 분석**: `application.properties`에 `openai.api.key`로 설정되어 있었으나, `@ConfigurationProperties(prefix="openai")` 레코드의 `apiKey` 필드는 `openai.api-key`(케밥 케이스)에 바인딩됨. 결과적으로 `apiKey`가 null이 되어 `Authorization: Bearer null` 헤더 전송 → 401 발생.

**수정 내용**: `openai.api.key` → `openai.api-key`

```
POST /api/admin/import/lh?page=1&size=3
응답: {"imported": 3, "failed": 0}
```

| 항목 | 결과 |
|------|------|
| OpenAI GPT 파싱 | ✅ 정상 — 3건 모두 PDF AI 파싱 성공 |
| PDF_AI_JSON raw 저장 | ✅ 3건 저장 확인 |
| `eligibility_raw` | ✅ 소득 기준 텍스트 추출됨 |
| `contact_raw` | ✅ "한국토지주택공사 콜센터 (☎ 1600-1004)" 추출됨 |
| `supply_household_count_raw` | ✅ 저장됨 ("100", "총 1,400세대" 등) |
| `supply_household_count` 업데이트 | ⚠️ null — 콤마 포함 숫자("1,400") 미매칭 버그 발견 |
| 카테고리 감지 | ✅ id 4,5번 → ELDERLY 감지 |

**추가 버그 수정**: `SupplyCountParser` 정규식 `\d+` → `[\d,]+`로 수정 (콤마 포함 숫자 처리)

### 정상 동작 확인 항목
- ✅ LH 외부 API 연결 및 공고 수집
- ✅ LH 상세 API + PDF 첨부파일 URL 추출
- ✅ PDF 다운로드 + PDFBox 텍스트 추출 (대용량 PDF 포함)
- ✅ OpenAI gpt-4o-mini PDF 파싱 (모든 raw 필드 저장)
- ✅ API_JSON + PDF_AI_JSON raw 저장
- ✅ OpenAI 실패 시에도 공고/카테고리/API_JSON은 정상 저장 (에러 격리)
- ✅ 카테고리 키워드 감지 (고령자 공고 → ELDERLY 자동 분류)
- ✅ 공고 목록 API 정상 응답
- ✅ 스케줄러 등록 확인 (매일 새벽 2시)

---

## TC-5. announcement_eligibility 구현 (2026-04-23)

### 추가된 기능
- OpenAI 프롬프트 확장: 자격조건 정형화 + 보증금/월세 금액 추출
- 신규 테이블: `announcement_eligibility`
- `announcement.deposit_amount` / `monthly_rent_amount` PDF AI 파싱으로 채움 (단위: 만원)
- `announcement_detail.eligibility_raw` 신청자격 원문으로 채움

```
POST /api/admin/import/lh?page=1&size=3
응답: {"imported": 3, "failed": 0}
```

| 항목 | 결과 |
|------|------|
| `announcement_eligibility` 생성 | ✅ 3건 정상 저장 |
| `age_min` / `age_max` | ✅ 고령자 공고 → 65, 행복주택 → 19~39 |
| `homeless_required` | ✅ true 정상 저장 |
| `elderly_required` / `elderly_age_min` | ✅ true / 65 정상 저장 |
| `low_income_required` | ✅ 저소득 공고 → true |
| `eligibility_raw` (announcement_eligibility) | ✅ 신청자격 원문 저장 |
| `eligibility_raw` (announcement_detail) | ✅ 동일 원문 저장 |
| `deposit_amount` | ⚠️ "보증금 4500만원" → OpenAI가 450으로 잘못 추출 (AI 정확도 이슈, 원문은 raw 필드에 보존) |
| `monthly_rent_amount` | ✅ 시세 % 기반 공고는 null (정상) |
| `income_asset_criteria_raw` | ✅ 소득/자산 기준 원문 저장 |

### TC-5-1. upsert 검증 (재수집 시 중복 미생성)

동일 공고 재수집 결과:
- `announcement_eligibility` 레코드 수: 3건 유지 (중복 생성 없음)
- `updated_at` 변경 확인 (`16:14` → `19:35`) — update 정상 동작

### 확인된 이슈

#### 🟡 deposit_amount AI 파싱 오류
- 증상: "보증금 4500만원" → `deposit_amount = 450` (10배 차이)
- 원인: OpenAI 추출 오류
- 영향: `deposit_monthly_rent_raw`에 원문 보존되어 있어 관리자 검수로 수정 가능
- 해결 예정: 관리자 검수 기능 구현 시 처리

### 최종 정상 동작 확인 항목
- ✅ `announcement_eligibility` 저장 및 upsert
- ✅ 자격조건 정형화 필드 (나이, 무주택, 고령자, 저소득, 혼인 등)
- ✅ 각 조건별 raw_text 원문 보존
- ✅ `announcement_detail.eligibility_raw` 채워짐
- ✅ `deposit_amount` / `monthly_rent_amount` 파싱 (AI 정확도 한계 존재)

---

## TC-6. 관리자 권한 시스템 + AI 파싱 검수 기능 테스트

테스트 일자: 2026-04-23

### TC-6-0. 테스트 계정 정보 (Apidog 테스트용)

| 계정 | loginId | password | role | userId |
|------|---------|----------|------|--------|
| 일반 유저 | `user_test` | `pass1234` | USER | 3 |
| 관리자 | `admin_test` | `adminpass1234` | ADMIN | 4 |

> DB에서 role 변경: `UPDATE users SET role = 'ADMIN' WHERE login_id = 'admin_test';`

**Apidog 사용법:**
1. `POST /api/auth/login` 으로 로그인 → `accessToken` 복사
2. 이후 요청 Header에 `Authorization: Bearer {token}` 추가
3. admin 계정으로만 `/api/admin/**` 접근 가능

---

### TC-6-1. DB 컬럼 자동 추가 (ddl-auto=update)

서버 시작 시 자동 ALTER TABLE 결과:
- `users.role` — VARCHAR(10) NOT NULL DEFAULT 'USER' ✅
- `announcement_eligibility.review_status` — VARCHAR(20) NOT NULL DEFAULT 'PENDING' ✅
- `announcement_eligibility.reviewed_by` — VARCHAR(100) NULL ✅
- `announcement_eligibility.reviewed_at` — DATETIME NULL ✅
- `announcement_eligibility.review_note` — TEXT NULL ✅

### TC-6-2. Role 시스템

| 테스트 항목 | 결과 |
|------------|------|
| 회원가입 후 JWT에 `"role":"USER"` claim 포함 | ✅ |
| DB에서 `role='ADMIN'` 수정 → 재로그인 → `"role":"ADMIN"` claim | ✅ |
| USER 계정 → `GET /api/admin/review` → 403 | ✅ |
| USER 계정 → `POST /api/admin/import/lh` → 403 | ✅ |
| ADMIN 계정 → `GET /api/admin/review` → 200 | ✅ |

### TC-6-3. AI 파싱 검수 기능 (4가지 액션)

| 액션 | announcementId | 결과 | 상태 변화 |
|------|----------------|------|----------|
| 검수 목록 조회 | — | ✅ totalElements=3, PENDING 목록 반환 | — |
| 검수 상세 조회 | 4 | ✅ AI값 + raw 원문 모두 반환 | — |
| APPROVE | 6 | ✅ 200 | PENDING → APPROVED, reviewedBy/At 저장 |
| CORRECT | 4 | ✅ 200 | PENDING → CORRECTED, depositAmount 수정, reviewNote 저장 |
| REJECT | 5 | ✅ 200 | PENDING → REJECTED, reviewedBy/At/Note 저장 |
| REIMPORT | 4 | ✅ 200 | CORRECTED → (재파싱) → PENDING 초기화, reviewedBy/At null |

### 확인된 동작

- REIMPORT는 `announcement_parse_raw.LH_ITEM_JSON`에서 API 파라미터를 복원해 재수집
- 이번 코드 반영 이전 데이터(LH_ITEM_JSON 미저장)는 re-import 불가 — 신규 수집 공고부터 적용
- REIMPORT 후 AI 재파싱 값으로 덮어쓰여지므로 depositAmount가 바뀔 수 있음 (정상 동작, 다시 CORRECT/APPROVE로 처리)
- 한국어 JSON body는 curl에서 인코딩 이슈 있음 → 실제 프론트에서는 문제없음

### 최종 확인 항목
- ✅ DB 기반 role 시스템 (USER/ADMIN)
- ✅ JWT claims에 role 포함, 필터에서 GrantedAuthority 생성
- ✅ `/api/admin/**` 전체 ADMIN 롤 보호
- ✅ APPROVE / CORRECT / REJECT / REIMPORT 4가지 검수 액션
- ✅ 검수 후 reviewedBy, reviewedAt, reviewNote 저장
- ✅ REIMPORT 후 PENDING 초기화 확인
