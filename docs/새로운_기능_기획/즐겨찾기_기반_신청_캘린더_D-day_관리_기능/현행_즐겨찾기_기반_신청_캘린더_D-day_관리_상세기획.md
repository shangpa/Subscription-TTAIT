# 현행_즐겨찾기_기반_신청_캘린더_D-day_관리_상세기획

- 작성일: 2026-06-08
- 기능명: 즐겨찾기 기반 신청 캘린더 / D-day 관리
- 목적: 사용자가 즐겨찾기한 공고의 신청 일정을 모아 보고, 마감까지 남은 시간을 기준으로 우선순위를 관리하게 한다.
- 핵심 원칙: 외부 캘린더 연동이나 새 알림 센터가 아니라, 기존 즐겨찾기와 공고 일정 데이터를 활용한 내부 일정 관리 기능이다.

## 1. 기능 한 줄 정의

사용자가 관심 있는 공고를 즐겨찾기하면, 해당 공고들의 **공고일, 신청 시작일, 신청 마감일, 당첨자 발표일, 즐겨찾기 시각**을 모아 캘린더와 D-day 그룹으로 보여주는 기능이다.

현재 즐겨찾기 기능이 “관심 공고 저장”에 가깝다면, 이 기능은 “저장한 공고를 언제 신청해야 하는지 놓치지 않게 관리”하는 기능이다.

## 2. 사용자에게 보여줄 가치

사용자는 여러 공고를 저장한 뒤 다음 문제를 겪는다.

1. 어떤 공고가 먼저 마감되는지 알기 어렵다.
2. 신청 시작 전 공고와 접수 중 공고가 섞여 있다.
3. 즐겨찾기한 공고가 많아지면 우선순위가 흐려진다.
4. D-day가 여러 화면에 흩어져 있어 한 번에 보기 어렵다.
5. 당첨자 발표일이나 공고일 같은 후속 일정도 놓칠 수 있다.

이 기능은 즐겨찾기 목록을 일정 중심으로 재구성해, 사용자가 “오늘 무엇을 확인해야 하는지”를 바로 알게 한다.

## 3. 표현 원칙

이 기능은 일정 관리 보조 기능이지, 신청 완료를 보장하거나 법적 마감 안내를 대신하는 기능이 아니다.

| 구분 | 사용하지 않을 표현 | 권장 표현 |
|---|---|---|
| 신청 보장 | 이 공고는 오늘 신청해야 합니다 | 신청 마감이 가까운 공고입니다 |
| 일정 확정 | 이 일정이 최종 일정입니다 | 공고에 등록된 일정 기준입니다 |
| 알림 보장 | 반드시 알림을 보내드립니다 | 이메일 발송 조건에 맞으면 안내될 수 있습니다 |
| 외부 연동 | 구글 캘린더에 자동 등록됩니다 | 서비스 안에서 일정 목록과 캘린더로 확인합니다 |

필수 안내 문구 예시:

```text
일정은 서비스에 저장된 공고 데이터를 기준으로 표시됩니다.
최종 신청 기간과 발표 일정은 공고 원문과 신청 사이트에서 반드시 확인해야 합니다.
```

## 4. 현재 프로젝트에서 재사용 가능한 데이터

### 기존 즐겨찾기 API

이미 즐겨찾기 API가 존재한다.

```http
POST /api/me/favorites
DELETE /api/me/favorites/{announcementId}
GET /api/me/favorites?page=&size=
GET /api/me/favorites/{announcementId}/exists
```

MVP에서는 `GET /api/me/favorites?page=&size=`를 기반으로 일정 데이터를 보여주고, 필요하면 일정 전용 응답을 추가한다.

### 기존 일정 필드

즐겨찾기 일정 관리에는 아래 필드를 재사용할 수 있다.

| 필드 | 활용 |
|---|---|
| `applicationStartDate` | 신청 시작일, 접수 전 그룹 표시 |
| `applicationEndDate` | 신청 마감일, D-day 계산 기준 |
| `announcementDate` | 공고 게시일, 캘린더 이벤트 보조 표시 |
| `winnerAnnouncementDate` | 당첨자 발표일, 후속 일정 표시 |
| `favoritedAt` | 사용자가 관심 공고로 저장한 시각 표시 |
| `noticeStatus` | 접수 가능 상태, 마감 여부, 노출 필터 보조 |

### 기존 백엔드 파일

후보 #3은 아래 파일과 도메인을 중심으로 설계한다.

| 파일 또는 도메인 | 활용 |
|---|---|
| `FavoriteController` | 즐겨찾기 등록, 삭제, 목록, 존재 여부 API 진입점 |
| `FavoriteService` | 사용자별 즐겨찾기 조회와 응답 조립 |
| `FavoriteResponse` | 즐겨찾기 목록 화면과 일정 화면의 기반 DTO |
| `UserFavoriteAnnouncementRepository` | 사용자별 즐겨찾기 공고 조회 |
| `DeadlineEmailService` | 마감 이메일 안내 로직 참고 |
| `EmailNotificationScheduler` | D-7, D-3, D-1 batch 동작 참고 |
| `AnnouncementQueryService` | 공고 목록과 상세 조회 흐름 참고 |

### 기존 프론트 파일

즐겨찾기와 D-day 표시는 여러 화면에 이미 흩어져 있다.

| 파일 | 활용 |
|---|---|
| `app/src/pages/FavoritesPage.jsx` | 일정 관리 화면의 1차 대상 |
| `AnnouncementDetailPage.jsx` | 즐겨찾기 상태와 상세 일정 확인 |
| `AnnouncementsPage.jsx` | 공고 목록의 D-day 표시 흐름 참고 |
| `RecommendationsPage.jsx` | 추천 카드의 즐겨찾기 토글 흐름 참고 |
| `AnnouncementCard.jsx` | 공통 카드와 D-day 표현 재사용 후보 |
| `MyPage.jsx` | 사용자 메뉴에서 즐겨찾기 일정 진입점 후보 |

### 기존 D-day와 이메일 동작

현재 프로젝트에는 아래 동작이 이미 있다.

| 기존 동작 | MVP 활용 |
|---|---|
| D-7 이메일 batch | 마감 7일 전 그룹과 문구 참고 |
| D-3 이메일 batch | 마감 임박 그룹 기준 참고 |
| D-1 이메일 batch | 내일 마감 그룹 기준 참고 |
| 프론트 D-day 표시 | 날짜 계산과 화면 표현 재사용 후보 |

MVP에서는 새 알림 시스템을 만들지 않고, 이미 있는 D-day와 마감 이메일 개념을 화면에서 더 잘 보이게 만든다.

## 5. 일정 상태값

각 즐겨찾기 공고는 아래 상태 중 하나로 표시한다.

| 상태값 | 화면 표시 | 의미 |
|---|---|---|
| `UPCOMING` | 접수 예정 | 신청 시작일이 아직 오지 않았다. |
| `OPEN` | 접수 중 | 현재 신청 기간 안에 있다. |
| `DUE_SOON` | 마감 임박 | 마감일까지 7일 이하로 남았다. |
| `DUE_TOMORROW` | 내일 마감 | 마감일까지 1일 남았다. |
| `DUE_TODAY` | 오늘 마감 | 오늘이 신청 마감일이다. |
| `CLOSED` | 마감 | 신청 마감일이 지났다. |
| `DATE_UNKNOWN` | 일정 확인 필요 | 신청 시작일 또는 마감일이 비어 있다. |

요약 그룹은 아래처럼 둔다.

| 그룹 | 설명 |
|---|---|
| 오늘 마감 | `DUE_TODAY` 공고 |
| 내일 마감 | `DUE_TOMORROW` 공고 |
| 7일 이내 마감 | `DUE_SOON` 공고 |
| 접수 중 | `OPEN` 공고 |
| 접수 예정 | `UPCOMING` 공고 |
| 일정 확인 필요 | `DATE_UNKNOWN` 공고 |
| 마감됨 | `CLOSED` 공고 |

## 6. 화면 항목 상세

### 6-1. MVP에서 바로 표시 가능한 항목

| 항목 | 데이터 | 표시 방식 |
|---|---|---|
| 공고명 | `noticeName` | 일정 카드 제목 |
| 공급 기관 | `providerName` | 보조 정보 |
| 신청 시작일 | `applicationStartDate` | 캘린더 시작 이벤트, 카드 보조 문구 |
| 신청 마감일 | `applicationEndDate` | D-day 계산 기준, 우선 정렬 기준 |
| 공고일 | `announcementDate` | 캘린더 보조 이벤트 |
| 당첨자 발표일 | `winnerAnnouncementDate` | 후속 일정 이벤트 |
| 즐겨찾기한 시각 | `favoritedAt` | 최근 저장순 정렬과 보조 표시 |
| 공고 상태 | `noticeStatus` | 접수 중, 마감 등 상태 badge |

### 6-2. MVP에서 제한적으로 처리할 항목

| 항목 | 처리 방식 |
|---|---|
| 신청 시작일 없음 | 신청 시작일 미정으로 표시 |
| 신청 마감일 없음 | D-day 계산하지 않고 일정 확인 필요 그룹에 배치 |
| 당첨자 발표일 없음 | 캘린더에 표시하지 않음 |
| 공고일 없음 | 공고일 이벤트 생략 |
| 시간대 정보 없음 | 날짜 단위로만 계산하고 시간 단위 마감 표현은 하지 않음 |

## 7. API 구조

MVP 선택지는 두 가지다.

### 선택지 A. 기존 즐겨찾기 목록 API 확장

```http
GET /api/me/favorites?page=&size=
```

기존 `FavoriteResponse`에 일정 화면에 필요한 필드가 충분하다면 프론트에서 그룹핑한다.

### 선택지 B. 일정 전용 API 추가

```http
GET /api/me/favorites/schedule
```

일정 그룹, D-day, 상태값을 backend에서 계산해 내려준다.

### MVP 추천

MVP에서는 선택지 B가 발표와 유지보수에 더 적합하다.

- 일정 그룹과 D-day 기준을 backend에서 통일할 수 있다.
- null 날짜 처리 정책을 한곳에 모을 수 있다.
- frontend는 달력과 목록 렌더링에 집중할 수 있다.
- 기존 `GET /api/me/favorites?page=&size=`의 목록 계약을 흔들지 않는다.

### 인증/예외 정책

| 상황 | 응답 정책 |
|---|---|
| 로그인 안 됨 | `401` 또는 프론트에서 로그인 CTA 표시 |
| 즐겨찾기 없음 | 빈 일정 화면과 공고 탐색 CTA 표시 |
| 날짜 없음 | `DATE_UNKNOWN` 그룹으로 반환 |
| 마감된 공고 포함 | 기본 표시하되 접기 또는 필터 가능 |
| 정상 | 일정 그룹과 캘린더 이벤트 반환 |

## 8. 백엔드 패키지 구조

기존 즐겨찾기 패키지를 유지하는 구조를 추천한다.

```text
subscrition/src/main/java/com/ttait/subscription/notification/favorite/
 ├─ controller/
 │   └─ FavoriteController.java
 ├─ service/
 │   ├─ FavoriteService.java
 │   └─ FavoriteScheduleService.java
 └─ dto/
     ├─ FavoriteResponse.java
     ├─ FavoriteScheduleResponse.java
     ├─ FavoriteScheduleItemResponse.java
     ├─ FavoriteCalendarEventResponse.java
     └─ FavoriteScheduleStatus.java
```

### 역할 분리

| 파일 | 역할 |
|---|---|
| `FavoriteController` | 기존 즐겨찾기 API와 일정 전용 API 제공 |
| `FavoriteService` | 기존 즐겨찾기 등록, 삭제, 목록 로직 유지 |
| `FavoriteScheduleService` | 즐겨찾기 공고 일정 조회, D-day 계산, 그룹 조립 |
| `FavoriteScheduleResponse` | 그룹 목록, 캘린더 이벤트, 요약 count 반환 |
| `FavoriteScheduleItemResponse` | 일정 목록의 개별 공고 DTO |
| `FavoriteCalendarEventResponse` | 월간 캘린더에 표시할 이벤트 DTO |
| `FavoriteScheduleStatus` | `UPCOMING`, `OPEN`, `DUE_SOON`, `DUE_TODAY`, `CLOSED`, `DATE_UNKNOWN` |

`DeadlineEmailService`와 `EmailNotificationScheduler`의 기존 D-7, D-3, D-1 기준은 참고하되, MVP에서 이메일 batch 로직을 바꾸지 않는다.

## 9. 응답 DTO 예시

```json
{
  "summary": {
    "totalCount": 8,
    "dueTodayCount": 1,
    "dueSoonCount": 3,
    "openCount": 4,
    "dateUnknownCount": 1
  },
  "groups": [
    {
      "key": "DUE_TODAY",
      "label": "오늘 마감",
      "items": [
        {
          "announcementId": 12,
          "noticeName": "서울 청년 매입임대주택 입주자 모집",
          "providerName": "서울주택도시공사",
          "noticeStatus": "OPEN",
          "applicationStartDate": "2026-06-01",
          "applicationEndDate": "2026-06-08",
          "announcementDate": "2026-05-20",
          "winnerAnnouncementDate": "2026-07-10",
          "favoritedAt": "2026-06-03T10:15:00",
          "dDay": 0,
          "dDayLabel": "D-day",
          "scheduleStatus": "DUE_TODAY",
          "statusMessage": "오늘 신청이 마감됩니다.",
          "actionLabel": "공고 확인"
        }
      ]
    }
  ],
  "calendarEvents": [
    {
      "announcementId": 12,
      "eventType": "APPLICATION_END",
      "date": "2026-06-08",
      "title": "신청 마감: 서울 청년 매입임대주택 입주자 모집",
      "priority": "HIGH"
    },
    {
      "announcementId": 12,
      "eventType": "WINNER_ANNOUNCEMENT",
      "date": "2026-07-10",
      "title": "당첨자 발표: 서울 청년 매입임대주택 입주자 모집",
      "priority": "NORMAL"
    }
  ],
  "disclaimer": "일정은 서비스에 저장된 공고 데이터를 기준으로 표시됩니다. 최종 일정은 공고 원문에서 확인해야 합니다."
}
```

## 10. 프론트 화면 구조

1차 대상 화면은 즐겨찾기 페이지다.

```text
app/src/pages/FavoritesPage.jsx
```

### 배치 추천

현재 즐겨찾기 목록 위에 일정 요약 영역을 추가한다.

추천 순서:

```text
즐겨찾기 제목
일정 요약 카드
D-day 그룹 탭
월간 캘린더 보기
즐겨찾기 공고 목록
```

### 일정 요약 카드

```text
내 관심 공고 일정
오늘 마감 1개 · 7일 이내 마감 3개 · 접수 중 4개

[오늘 마감 보기] [캘린더 보기]
```

### D-day 그룹 목록

```text
오늘 마감
- 서울 청년 매입임대주택 입주자 모집 · D-day · 오늘 신청 마감

7일 이내 마감
- 경기 행복주택 입주자 모집 · D-3 · 마감 임박
- 인천 전세임대 모집 · D-6 · 마감 예정

접수 예정
- 부산 청년주택 모집 · D-14 · 6월 22일 접수 시작

일정 확인 필요
- 신청 마감일이 등록되지 않은 공고
```

### 캘린더 보기

월간 캘린더는 MVP에서 단순한 내부 UI로 둔다.

```text
2026년 6월

6월 1일 신청 시작
6월 8일 신청 마감
6월 22일 신청 시작
```

외부 Google Calendar, Apple Calendar, Outlook 연동은 MVP에서 제외한다.

## 11. 프론트 상태 처리

| 상태 | 화면 처리 |
|---|---|
| 비로그인 | “로그인하면 관심 공고 일정을 관리할 수 있습니다” CTA |
| 즐겨찾기 없음 | “관심 공고를 추가하면 신청 일정을 모아볼 수 있습니다” CTA |
| 로딩 | 일정 요약 skeleton 표시 |
| API 에러 | “즐겨찾기 일정을 불러오지 못했습니다” 표시 |
| 날짜 없음 | 일정 확인 필요 그룹에 표시 |
| 마감 공고 | 마감됨 badge와 함께 접힌 그룹에 표시 |
| 정상 | 요약 카드, D-day 그룹, 캘린더 표시 |

## 12. MVP 범위

### 포함

- 즐겨찾기 기반 일정 전용 API 또는 기존 즐겨찾기 목록 기반 일정 응답
- `applicationStartDate`, `applicationEndDate`, `announcementDate`, `winnerAnnouncementDate`, `favoritedAt`, `noticeStatus` 재사용
- D-day 계산과 일정 상태값 제공
- 오늘 마감, 내일 마감, 7일 이내 마감, 접수 중, 접수 예정, 일정 확인 필요 그룹
- `FavoritesPage.jsx`에 일정 요약, D-day 그룹, 내부 캘린더 보기 추가
- 기존 D-7, D-3, D-1 이메일 batch 정책은 유지
- 최종 일정 확인 안내 문구 포함

### 제외

- Google Calendar, Apple Calendar, Outlook 연동
- push notification
- 전체 알림 센터
- 사용자별 알림 설정 화면
- 이메일 batch 로직 전면 개편
- 시간 단위 마감 카운트다운
- 신청 완료 여부 추적
- 공고 원문 일정 자동 재검증 시스템

## 13. 구현 순서

1. 즐겨찾기 일정 DTO 계약 정의
2. 일정 상태값과 D-day 계산 기준 정의
3. null 날짜 처리 정책 정의
4. `FavoriteScheduleService` 추가
5. `UserFavoriteAnnouncementRepository`를 통해 사용자 즐겨찾기 공고 조회
6. `applicationEndDate` 기준 D-day와 그룹 계산 구현
7. `announcementDate`, `applicationStartDate`, `winnerAnnouncementDate` 기반 캘린더 이벤트 조립
8. `FavoriteController`에 일정 API 추가
9. `FavoritesPage.jsx`에 일정 요약 영역 추가
10. D-day 그룹 목록과 내부 캘린더 보기 구현
11. 빈 상태, 로딩, 에러, 날짜 없음 상태 처리
12. 발표용 즐겨찾기 일정 케이스 준비

## 14. 테스트 기준

### 백엔드 단위 테스트

| 테스트 | 기대 결과 |
|---|---|
| 마감일이 오늘 | `DUE_TODAY`, `D-day` |
| 마감일이 내일 | `DUE_TOMORROW`, `D-1` |
| 마감일이 3일 뒤 | `DUE_SOON`, `D-3` |
| 신청 기간 안에 있음 | `OPEN` |
| 신청 시작 전 | `UPCOMING` |
| 마감일이 지남 | `CLOSED` |
| 마감일 null | `DATE_UNKNOWN` |
| 당첨자 발표일 있음 | `WINNER_ANNOUNCEMENT` 캘린더 이벤트 생성 |
| 공고일 있음 | `ANNOUNCEMENT_DATE` 캘린더 이벤트 생성 가능 |
| 즐겨찾기 없음 | 빈 groups와 count 0 반환 |

### 프론트 확인

| 상태 | 확인 내용 |
|---|---|
| 즐겨찾기 있음 | 일정 요약 count 표시 |
| 오늘 마감 공고 있음 | 최상단 그룹에 표시 |
| 날짜 없는 공고 있음 | 일정 확인 필요 그룹에 표시 |
| 캘린더 보기 | 날짜별 이벤트 표시 |
| 즐겨찾기 삭제 | 일정 목록에서도 제거됨 |
| 기존 D-day 표시 | 다른 화면의 표현과 충돌하지 않음 |
| API 실패 | 오류 메시지와 재시도 가능 상태 표시 |

## 15. 발표 시나리오

발표에서는 3가지 케이스를 준비하면 좋다.

| 시나리오 | 설명 | 보여줄 메시지 |
|---|---|---|
| 오늘 마감 공고 | 즐겨찾기한 공고 중 하나가 오늘 마감 | 오늘 신청이 마감됩니다 |
| 7일 이내 마감 공고 | D-3, D-6 공고가 함께 있음 | 마감 임박 공고를 먼저 확인하세요 |
| 접수 예정 공고 | 아직 시작 전인 공고가 있음 | 접수 시작일을 미리 확인하세요 |

발표 흐름 예시:

1. 공고 목록이나 추천 화면에서 관심 공고를 즐겨찾기한다.
2. 즐겨찾기 페이지로 이동한다.
3. 상단 일정 요약에서 오늘 마감과 7일 이내 마감 공고를 확인한다.
4. 캘린더 보기에서 신청 시작일, 마감일, 당첨자 발표일을 한 번에 본다.
5. 공고 상세로 이동해 신청 전 원문을 확인한다.

## 16. 리스크와 대응

| 리스크 | 영향 | 대응 |
|---|---|---|
| 날짜 필드가 null일 수 있다 | D-day 계산 실패 가능 | `DATE_UNKNOWN` 그룹으로 분리하고 계산하지 않는다 |
| JS date parsing과 timezone 차이 | 하루 차이 표시 오류 가능 | backend에서 날짜 단위 D-day를 계산해 내려주는 방식을 우선한다 |
| 목록/상세 DTO에 favorited flag가 부족할 수 있다 | 화면 간 즐겨찾기 상태 동기화가 어려움 | 기존 exists API를 유지하고, 필요한 화면에서만 보조 조회한다 |
| 사용자별 알림 설정이 없다 | 개인별 이메일 on/off 제어가 어렵다 | MVP에서는 알림 설정 UI를 만들지 않고 화면 일정 관리에 집중한다 |
| 이메일 batch와 화면 D-day 기준 불일치 | 사용자 혼란 발생 | D-7, D-3, D-1 기준을 문서화하고 화면 그룹 기준과 맞춘다 |

## 17. 결론

이 기능은 새로운 외부 연동 서비스를 만드는 기능이 아니라, 이미 존재하는 즐겨찾기와 공고 일정 데이터를 사용자가 놓치지 않게 재배치하는 기능이다.

3주 안에 구현하려면 범위를 명확히 제한해야 한다.

- 즐겨찾기한 공고만 대상으로 한다.
- 신청 마감일 기준 D-day 그룹을 우선 구현한다.
- 내부 캘린더 보기는 단순한 월간 일정 표시로 둔다.
- 외부 캘린더 연동, push notification, 알림 센터는 제외한다.
- 날짜가 비어 있으면 무리하게 계산하지 않고 일정 확인 필요로 표시한다.

이렇게 만들면 발표에서는 “청약 따잇은 관심 공고를 저장하는 데서 끝나지 않고, 신청 마감과 발표 일정을 놓치지 않게 관리해 준다”는 메시지를 명확하게 보여줄 수 있다.
