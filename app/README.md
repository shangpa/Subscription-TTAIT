# 청약알리미 프론트엔드

공공임대주택 공고 알림 서비스의 프론트엔드 애플리케이션입니다.

## 기술 스택

- React 18
- React Router v6
- Vite

## 실행 방법

### 1. 의존성 설치

```bash
cd app
npm install
```

### 2. 개발 서버 실행

```bash
npm run dev
```

http://localhost:5173 에서 확인할 수 있습니다.

### 3. 프로덕션 빌드

```bash
npm run build
```

빌드 결과물은 `dist/` 폴더에 생성됩니다.

## 백엔드 연동

개발 서버는 `/api` 요청을 `http://localhost:8080`으로 프록시합니다.
프론트엔드 실행 전에 백엔드 서버가 실행되어 있어야 합니다.

## 주요 페이지

| 경로 | 설명 | 접근 권한 |
|------|------|-----------|
| `/announcements` | 공고 목록 | 공개 |
| `/announcements/:id` | 공고 상세 | 공개 |
| `/login` | 로그인 | 공개 |
| `/signup` | 회원가입 | 공개 |
| `/profile/setup` | 프로필 설정 | 로그인 |
| `/recommendations` | 맞춤 추천 | 로그인 + 프로필 |
| `/favorites` | 즐겨찾기 | 로그인 |
| `/mypage` | 마이페이지 | 로그인 |
| `/admin` | 관리자 대시보드 | ADMIN |
| `/admin/review` | AI 파싱 검수 | ADMIN |
| `/admin/announcements/new` | 수동 공고 등록 | ADMIN |
| `/admin/import` | LH 공고 수집 | ADMIN |
