# AGENTS.md — pdf-booklet-maker

AI 코딩 에이전트를 위한 작업 지침. 사람도 읽을 수 있게 유지한다.

## 프로젝트 개요

PDF를 인쇄용 A4 레이아웃으로 변환하는 Node.js CLI + 로컬 웹 UI.
npm 공개 패키지: `@mhj6022/pdf-booklet-maker` (현재 v0.9.0, latest).
런타임 의존성은 `commander`, `pdf-lib`, `@pdf-lib/fontkit` 3개뿐 — 새 의존성 추가는 신중히.

## 빌드 · 테스트 · 실행

```bash
npm test                          # syntax check + node --test test/unit.test.mjs
node src/cli.js <in> <out> [opts] # CLI 로컬 실행
node src/cli.js --serve           # 웹 UI (http://127.0.0.1:8383, 브라우저 자동 오픈)
```

- 테스트는 반드시 파일을 명시할 것: `node --test test/unit.test.mjs`
  (`node --test test/` 디렉터리 지정은 MODULE_NOT_FOUND로 실패)
- 기능 추가 시 `test/unit.test.mjs`에 테스트를 함께 추가하고, 실제 PDF를 생성해
  시각적으로 확인한 뒤 완료 보고할 것.

## 소스 구조

| 파일 | 역할 |
|---|---|
| `src/cli.js` | commander 기반 CLI 엔트리 (모든 옵션 정의) |
| `src/layout.js` | 격자 복제 엔진: MODES, parseGrid, computeCells, 컷라인/크롭마크 |
| `src/booklet.js` | 새들스티치 임포지션: getImpositionOrder, 시그니처, 듀플렉스, 커버 합병 |
| `src/cover.js` | 생성형 표지: classic/header 스타일, CJK 벡터 아웃라인 렌더링 |
| `src/batch.js` | 배치 변환: glob 패턴, 접미사 규칙 |
| `src/server.js` | 의존성 0 웹 UI (node:http), `/api/convert` 엔드포인트 |

## 핵심 규칙 (위반 시 심각한 회귀)

1. **pdf-lib 페이지 삽입은 `embedPages()` 복수형 일괄 호출만 사용.**
   루프 안 `embedPage()` 단수 호출은 공유 리소스를 페이지 수만큼 중복 복사해
   출력이 100배 팽창한다 (500MB 버그의 원인). 상세: `DEAD_ENDS.md` §1.
2. **CJK 텍스트는 폰트 임베딩 금지 — 벡터 아웃라인으로 그린다.**
   fontkit CJK 서브셋은 invalid font를 만들고, 전체 임베딩은 13MB. `src/cover.js`의
   `makeOutlineWriter` 패턴을 따를 것. 상세: `DEAD_ENDS.md` §2.
3. **GitHub push는 HTTPS + repo-local credential helper만.** SSH 키는 GitHub에
   미등록. PAT는 `/home/rjegj/projects/.secrets/.env`. 토큰 값을 출력하지 말 것.
4. **npm publish**: 계정 `mhj6022`. 게시 전 `npm test` 통과 + 버전 범프 + git 태그 없이
   커밋만 (기존 관례). 게시 후 `npx @mhj6022/pdf-booklet-maker@latest`로 검증
   (npx 캐시가 낡았으면 `rm -rf ~/.npm/_npx`).

## 문서 유지 규칙

- 완료된 작업 → `RESOLVED.md`, 진행 중 상태 → `CONTEXT.md`,
  실패한 접근 → `DEAD_ENDS.md`, 버전별 이력 → `DEV_LOG.md`
- 작업 완료 시 위 문서를 갱신하고 서브프로젝트 규칙에 따라 자동 커밋/푸시 가능
  (루트 repo `/home/rjegj/projects`는 반드시 사용자 확인 후 커밋).

## 도메인 지식 요약

- 새들스티치 순서: 4의 배수로 패딩 후 `[high, low, low+1, high-1, ...]`
  예) 8쪽 → `[8,1,2,7,6,3,4,5]`. 시트당 2쪽(가로 A4 2-up).
- long-edge 듀플렉스: 뒷면을 180° 회전 + 좌우 반쪽 스왑.
- A4 포인트: 595.2756 × 841.8898 (`src/layout.js`의 A4_WIDTH/A4_HEIGHT).
- commander `--no-open`은 `options.open === false`로 들어온다 (`options.noOpen` 아님).
