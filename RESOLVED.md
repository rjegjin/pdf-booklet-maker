# RESOLVED — pdf-booklet-maker

완료된 태스크, 해결된 문제, 채택된 제안을 기록한다.
진행 중인 것은 CONTEXT.md, 실패한 접근법은 DEAD_ENDS.md에 쓴다.

---

## 2026-07-06 — 표지 스타일 확장 및 자동 텍스트 줄바꿈 (v0.9.0)

- `--cover-style header` 옵션: 상단 정렬 제목 + 작은 헤딩(`--cover-label`) 스타일 추가
- `--cover-style classic` (기본값): 기존 중앙 제목 + 테두리 스타일
- 긴 제목 자동 줄바꿈: 양쪽 스타일에서 단어 경계 기준 랩핑 구현
- 웹 UI: 커버 스타일/라벨 필드 추가
- 단위 테스트: `wrapTitle()` 함수, 헤더 스타일 렌더링 검증 추가
- npm 게시: v0.9.0 (latest)

## 2026-07-06 — 생성형 표지 페이지 및 PDF 커버 합병 (v0.8.0)

- `--cover <file.pdf>` 기존 커버 PDF 합병 기능
- `--cover-title`/`--cover-subtitle`/`--cover-author`/`--cover-date` 생성형 표지 옵션
- CJK 글꼴 처리: fontkit glyph paths로 벡터 아웃라인 렌더링
  - 이유: fontkit CJK subsetting이 invalid embedded fonts 생성 + 전체 포함 시 ~13MB 용량
  - `fc-match`로 시스템 한글 글꼴 자동 감지
- 웹 UI: 커버 섹션 (생성/업로드 모드 전환), `/api/convert` JSON base64 본문 지원 추가
- npm 게시: v0.8.0

## 2026-07-05 — README 로드맵 Phase 2~5 구현 완료 (v0.5.0)

- Phase 2: `--grid CxR` 임의 격자 (--mode 하위호환 유지)
- Phase 3: `--margin` / `--gap` / `--rotate auto|none|90|180|270` / `--fit contain|cover|stretch` (cover는 셀 클리핑)
- Phase 4: `--cut-line`(스타일/두께 옵션) / `--crop-mark`(길이/오프셋 옵션)
- Phase 5: `--booklet`/`--saddle-stitch` 새들스티치 임포지션 — Python 원본 get_imposition_order 이식, `--signature-size`, `--duplex long-edge`(뒷면 180° 회전+좌우 스왑)
- node:test 단위 테스트 7건 추가, 각 Phase마다 PDF 생성 후 픽셀/시각 검증 완료
- Phase 6: `--input-dir`/`--output-dir`/`--pattern`/`--suffix` 배치 변환 (v0.6.0)
- npm 게시 완료: 0.5.0, 0.6.0 (latest)
- Phase 7: `--serve` 로컬 드래그&드롭 웹 UI (v0.7.0) — node:http, 의존성 0
- git push 정상화: HTTPS + credential helper(.secrets/.env PAT) 설정 완료
- npm 게시: 0.7.0 (latest), GitHub main 동기화 완료 — 로드맵 Phase 1~7 전체 완료
