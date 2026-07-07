# CONTEXT — pdf-booklet-maker

## 2026-07-07 — 안정 운영 중 (v0.9.0)

- [현재] 운영 중 — PDF 소책자 변환 CLI 도구 + 웹 UI
- [npm] @mhj6022/pdf-booklet-maker v0.9.0 공개 배포 완료 (latest)
- [GitHub] main 브랜치 동기화 완료 (HTTPS + credential helper, SSH 사용 금지 — DEAD_ENDS.md §3)
- README 로드맵 Phase 1~7 전체 구현 완료. 명시적 pending 작업 없음.

### 최근 해결한 주요 문제 (상세: RESOLVED.md / DEAD_ENDS.md)

- **500MB 용량 버그** (v0.7.2): 페이지별 `embedPage()` → 일괄 `embedPages()`로 수정.
  사용자 확인 완료 ("완전히 해결").
- **CJK 표지 텍스트**: 폰트 임베딩 대신 벡터 아웃라인 렌더링으로 우회.
- **header 커버 스타일** (v0.9.0): 사용자 수제 `_title.pdf` 형식(Message 라벨 +
  줄바꿈 제목 + 부제)을 내부 로직으로 재현. GUI에도 Style/Label 필드 반영.

### 구조

- Node.js 기반 PDF 레이아웃 엔진 (`src/booklet.js`, `src/layout.js`, `src/cover.js`)
- 로컬 웹 UI (`src/server.js`, `--serve`, 포트 8383)
- 배치 변환 (`src/batch.js`, `--input-dir`)
- CLI 엔트리 (`src/cli.js`)
- 에이전트 작업 지침: `AGENTS.md`

### 향후 방향 (미착수, 요청 시에만)

- Electron 데스크톱 앱, 서버사이드 배치 서비스 (README "future directions")
