# CONTEXT — pdf-booklet-maker

## 2026-07-06 — 활성 개발 중 (v0.9.0)

- [현재] 운영 중 — PDF 소책자 변환 CLI 도구 + 웹 UI
- [npm] @mhj6022/pdf-booklet-maker v0.9.0 공개 배포 완료
- 최근 변경 (2026-07-06):
  - v0.9.0: header 커버 스타일, 자동 제목 줄바꿈, `--cover-label` 옵션
  - v0.8.0: 생성형 표지, PDF 커버 합병, CJK 글꼴 벡터 아웃라인 렌더링
- 구조:
  - Node.js 기반 PDF 레이아웃 엔진 (`src/booklet.js`, `src/layout.js`, `src/cover.js`)
  - 로컬 웹 UI (`src/server.js`, `--serve`)
  - 배치 변환 (`src/batch.js`, `--input-dir`)
  - CLI 엔트리 (`src/cli.js`)
