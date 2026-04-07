# 📚 pdf-booklet-maker Development Log
> *Auto-generated from system_core.db at 2026-03-17 23:45:08*

## [2026-02-28]
- **- 표지 인식 로직 확장**: **Action:** 파일명에 'title'이 포함된 경우에도 표지로 자동 인식하도록 수정.
- **Details:**
      - `app.py`: 표지 감지 조건에 `title` (대소문자 미구분) 추가.
      - `booklet_maker.py`: 표지 감지 조건 추가 및 관련 경고 메시지 업데이트.
      - `README.md`: 변경된 표지 명명 규칙 반영.
- **Status:** 요청 사항 반영 완료. 사용자 편의성 향상.
  
  ## Next Steps
- User testing of the GUI.
- Packaging as a standalone executable (optional).

## [2026-02-10]
- **Performance Update (Fast Mode)**: **Action:** Transitioned from explorer-based UI to keyword-driven automation to resolve WSL file access lag.
- **Details:**
      - **Caching:** Implemented `st.cache_data` for file listings to minimize slow `/mnt/c` I/O operations.
      - **Keyword Automation:** Removed manual file selection widgets (which triggered constant reruns). Now, typing a keyword instantly groups files into "Cover" and "Content" categories programmatically.
      - **Zero-Click Workflow:** If the keyword matches, the setup is ready immediately. User only needs to click "Run".
      - **Streamlined UI:** Reduced visual clutter, focusing on the essential Input -> Preview -> Action flow.
- **Status:** Highly responsive and efficient version.
