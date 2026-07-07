# DEAD_ENDS — pdf-booklet-maker

실패한 접근법과 피해야 할 패턴을 기록한다.
새로운 실패가 확인되면 즉시 추가할 것.

---

## 1. 페이지별 `embedPage()` 호출 — 500MB 용량 폭발 (2026-07-06, 해결됨)

**증상**: 5.2MB / 약 400페이지 PDF를 `--booklet` 변환하니 출력이 **500MB**.

**원인**: pdf-lib의 `embedPage()`(단수형)를 루프 안에서 페이지마다 호출하면,
페이지들이 공유하는 리소스(폰트, 이미지)가 **호출마다 통째로 복사**된다.
400페이지 문서가 큰 CJK 폰트를 공유하면 폰트가 400번 중복 삽입되는 구조.

**재현**: 1MB/60페이지 → 62MB (약 60배 팽창 확인).

**올바른 방법**: `embedPages()`(복수형)를 **한 번만** 호출해 전체 페이지를 일괄 삽입.
공유 리소스가 1회만 복사된다. (1MB/60페이지 → 1.07MB)

```js
// ❌ 절대 금지
for (const p of pages) { const e = await out.embedPage(p); ... }

// ✅ 반드시 이렇게
const embedded = await out.embedPages(sourcePages);
```

적용 위치: `src/booklet.js`, `src/layout.js` (v0.7.2에서 수정 배포).

## 2. fontkit CJK 폰트 서브셋 임베딩 — invalid font (2026-07-06, 우회함)

**시도**: 생성형 표지에 한글 텍스트를 넣기 위해 `doc.embedFont(cjkBytes, { subset: true })`.

**실패 양상**:
- `subset: true` → `_this.font.createSubset is not a function` (TTC 컬렉션에서)
- TTC에서 face를 추출해도 "Embedded font file may be invalid" 경고 + 일부 뷰어에서 글자 깨짐
- `subset: false` (전체 임베딩) → 표지 한 장에 **13.2MB** (NotoSansCJK 전체 포함)

**우회책 (채택)**: 폰트를 아예 임베딩하지 않고, fontkit으로 glyph outline을 추출해
`page.drawSvgPath()`로 **벡터 아웃라인 렌더링** (`src/cover.js`의 `makeOutlineWriter`).
결과: 표지 100KB 미만, 뷰어 독립적.

**주의**: 폰트 y좌표는 y-up, SVG는 y-down이므로 y를 반전(negate)해야 한다.
TTC 파일은 `fontkit.create(buffer).fonts[0]`으로 첫 face를 꺼내 사용.

## 3. SSH로 GitHub push — 키 미등록 (2026-07-05)

`~/.ssh/id_ed25519`는 존재하지만 **GitHub 계정에 등록되어 있지 않다**.
SSH push 시도는 항상 실패. **HTTPS remote + repo-local credential helper**
(`.secrets/.env`의 `GITHUB_PERSONAL_ACCESS_TOKEN`)만 사용할 것.

**PAT 갱신 시 함정**: 클립보드에 이전 토큰이 남아 같은 stale 토큰을 반복 붙여넣는
사고가 3회 발생. 갱신 확인법: `.env` 파일 **mtime 변경** + **토큰 끝 4자리 변경** 둘 다 확인.
토큰 전문을 터미널에 echo/od로 출력하지 말 것 (한 번 노출되어 폐기함).

## 4. `npx` stale 캐시 — 구버전 CLI 실행 (2026-07-06)

`npx @mhj6022/pdf-booklet-maker --serve`가 `required option '--mode'` 오류.
npx 캐시에 0.1.0이 남아 있었기 때문. **해결**: `rm -rf ~/.npm/_npx` 후 재실행,
또는 `@latest` 명시.

## 5. 기타 소소한 함정

- `node --test test/` (디렉터리 지정) → MODULE_NOT_FOUND. 반드시 파일 명시:
  `node --test test/unit.test.mjs`
- commander의 `--no-open`은 `options.noOpen`이 아니라 `options.open === false`를 만든다.
- 백그라운드 서버를 `pkill`하면 exit 144로 "실패"처럼 보이지만 무해함.
