# RESOLVED — pdf-booklet-maker

완료된 태스크, 해결된 문제, 채택된 제안을 기록한다.
진행 중인 것은 CONTEXT.md, 실패한 접근법은 DEAD_ENDS.md에 쓴다.

---

## 2026-07-05 — README 로드맵 Phase 2~5 구현 완료 (v0.5.0)

- Phase 2: `--grid CxR` 임의 격자 (--mode 하위호환 유지)
- Phase 3: `--margin` / `--gap` / `--rotate auto|none|90|180|270` / `--fit contain|cover|stretch` (cover는 셀 클리핑)
- Phase 4: `--cut-line`(스타일/두께 옵션) / `--crop-mark`(길이/오프셋 옵션)
- Phase 5: `--booklet`/`--saddle-stitch` 새들스티치 임포지션 — Python 원본 get_imposition_order 이식, `--signature-size`, `--duplex long-edge`(뒷면 180° 회전+좌우 스왑)
- node:test 단위 테스트 7건 추가, 각 Phase마다 PDF 생성 후 픽셀/시각 검증 완료
- npm 재게시(0.5.0)는 아직 안 함
