# NextStep 후속 작업 (2026-04-12)

## HIGH 우선순위

### 1. 백엔드 테스트 작성
- auth_service.py: 타이밍 공격 방어, null password_hash 처리
- paths.py: explain_skill 인가 체크, 입력 검증
- schemas/path.py: Field 유효성 검증
- 파일: `backend/tests/`

### 2. 프론트엔드 테스트 작성
- job-input-form: 입력 길이 제한, 카운터 표시
- generating-overlay: 취소 버튼 동작
- skill-graph: progress revert 정확성
- node-detail-panel: 설명 fetch 루프 방지, 재시도 버튼
- 파일: `frontend/src/__tests__/`

### 3. JWT 토큰 리프레시 메커니즘
- 현재: 24시간 만료, 리프레시 없음, 무통보 로그아웃
- 필요: refresh token 또는 sliding session + 만료 알림
- 파일: `backend/app/services/auth_service.py`, `frontend/src/services/api-client.ts`

### 4. 경로 생성 API Rate Limiting
- 현재: 제한 없음, 각 요청당 OpenAI API 3-5회 호출
- 필요: slowapi 또는 커스텀 미들웨어, 인증 사용자 10회/일, 미인증 차단
- 파일: `backend/app/main.py`, `backend/app/routers/paths.py`

## MEDIUM 우선순위

### 5. 모바일 반응형 개선
- NodeDetailPanel → 모바일에서 바텀시트
- PathHeader → 작은 화면에서 overflow 방지
- 파일: `frontend/src/components/path/`

### 6. Next.js error.tsx / loading.tsx 추가
- `app/error.tsx` — 앱 레벨 에러 바운더리
- `app/path/[id]/error.tsx` — 경로 페이지 에러
- `app/path/[id]/loading.tsx` — 스켈레톤 로딩
- `app/loading.tsx` — 홈 로딩

### 7. 미사용 의존성 제거
```bash
npm uninstall d3-force d3-zoom @types/d3-force @types/d3-zoom
```

### 8. README.md API 문서 업데이트
- PathGenerateRequest 입력 제한사항 반영 (job_input: 200자, current_state: 2000자)

### 9. NextStep.md 보안 개선사항 기록
- 로그인 타이밍 공격 방어
- explain_skill 인가 체크 추가
- null password_hash 가드

## LOW 우선순위

### 10. 첫 방문 온보딩 가이드
- 그래프 페이지 도착 시 툴팁 투어
- localStorage로 최초 방문 추적
