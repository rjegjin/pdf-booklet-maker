# PDF Booklet Maker (Saddle Stitch)

이 프로젝트는 여러 개의 PDF 파일을 병합하고 소책자(중앙 스테이플 제본용) 인쇄가 가능하도록 페이지를 재배치하는 도구입니다.

## 설치 방법

1. 필요한 라이브러리를 설치합니다.
   ```bash
   pip install -r requirements.txt
   ```

## 사용 방법

1. 변환할 PDF 파일들을 이 폴더에 넣습니다.
   - 표지 파일 이름에는 `(1)` 또는 `title`이 포함되어야 합니다. (예: `함께하는_title.pdf`)
2. 스크립트를 실행합니다.
   ```bash
   python booklet_maker.py
   ```
3. 안내에 따라 파일 검색용 키워드를 입력합니다.
4. `1_[키워드]_최종본.pdf` 파일이 생성됩니다.
