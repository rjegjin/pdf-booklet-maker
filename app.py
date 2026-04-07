import streamlit as st
import os
import tempfile
from booklet_core import generate_booklet_pdf

# --- 페이지 설정 ---
st.set_page_config(page_title="PDF Booklet Maker (Cloud)", page_icon="⚡", layout="wide")

# --- UI 시작 ---
st.title("⚡ PDF Booklet Maker (Cloud Version)")
st.markdown("여러 PDF 파일을 병합하고 소책자(중앙 스테이플러 제본) 인쇄에 맞게 페이지를 자동 배열합니다.")

st.markdown("---")

# 1. 파일 업로드 섹션
col_cover, col_content = st.columns(2)

with col_cover:
    st.subheader("1. 표지 파일 업로드 (선택)")
    cover_upload = st.file_uploader(
        "표지로 사용할 단일 PDF 파일을 업로드하세요", 
        type=["pdf"], 
        key="cover"
    )
    if cover_upload:
        st.success(f"✅ 표지 선택됨: {cover_upload.name}")

with col_content:
    st.subheader("2. 내용 파일 업로드 (필수)")
    content_uploads = st.file_uploader(
        "내용으로 사용할 PDF 파일들을 업로드하세요 (순서대로 정렬됨)", 
        type=["pdf"], 
        accept_multiple_files=True, 
        key="content"
    )
    if content_uploads:
        st.info(f"📑 총 {len(content_uploads)}개의 내용 파일이 선택되었습니다.")
        # 파일명 순으로 정렬 표시
        sorted_contents = sorted(content_uploads, key=lambda x: x.name)
        for cf in sorted_contents:
            st.text(f"• {cf.name}")
    else:
        st.warning("내용 파일을 업로드해주세요.")

st.markdown("---")

# 2. 출력 설정 및 실행
st.subheader("3. 출력 설정 및 변환")
col_out_name, col_btn = st.columns([2, 1])

with col_out_name:
    output_name = st.text_input("저장할 파일명", value="booklet_output")

with col_btn:
    st.write("") # Spacer
    st.write("") # Spacer
    btn_disabled = not content_uploads and not cover_upload
    if st.button("🚀 소책자 변환 실행", type="primary", disabled=btn_disabled, use_container_width=True):
        with st.spinner("PDF 병합 및 소책자 레이아웃 생성 중..."):
            try:
                # 안전한 임시 디렉토리 생성
                with tempfile.TemporaryDirectory() as temp_dir:
                    cover_path = None
                    content_paths = []
                    
                    # 표지 저장
                    if cover_upload:
                        cover_path = os.path.join(temp_dir, "cover.pdf")
                        with open(cover_path, "wb") as f:
                            f.write(cover_upload.getbuffer())
                    
                    # 내용 파일 저장 (알파벳/숫자 순서 정렬하여 병합 순서 보장)
                    if content_uploads:
                        for idx, file in enumerate(sorted(content_uploads, key=lambda x: x.name)):
                            path = os.path.join(temp_dir, f"content_{idx:03d}.pdf")
                            with open(path, "wb") as f:
                                f.write(file.getbuffer())
                            content_paths.append(path)
                    
                    # 결과 파일 경로
                    output_path = os.path.join(temp_dir, "output.pdf")
                    
                    # 변환 코어 로직 실행
                    success, msg = generate_booklet_pdf(cover_path, content_paths, output_path)
                    
                    if success:
                        st.success(f"✅ 변환 성공! {msg}")
                        st.balloons()
                        
                        # 변환된 파일을 메모리로 읽어서 다운로드 버튼에 제공
                        with open(output_path, "rb") as f:
                            pdf_bytes = f.read()
                        
                        st.download_button(
                            label="📥 완성된 소책자 PDF 다운로드",
                            data=pdf_bytes,
                            file_name=f"{output_name}.pdf",
                            mime="application/pdf",
                            type="primary",
                            use_container_width=True
                        )
                    else:
                        st.error(f"❌ 변환 실패: {msg}")
            except Exception as e:
                st.error(f"오류가 발생했습니다: {e}")

st.markdown("---")
st.info("💡 **팁:** 페이지 수가 4의 배수가 아니면, 마지막에 빈 페이지가 자동으로 추가되어 제본 레이아웃을 맞춥니다.")
