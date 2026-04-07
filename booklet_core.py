import os
import fitz  # PyMuPDF
import math

def get_imposition_order(total_pages):
    """4의 배수 기준 소책자(Saddle Stitch) 페이지 재배치 순서 생성"""
    working_pages = math.ceil(total_pages / 4) * 4
    order = []
    low, high = 1, working_pages
    while low < high:
        order.extend([high, low])  # Sheet 앞면 (뒤, 앞)
        low += 1; high -= 1
        order.extend([low, high])  # Sheet 뒷면 (앞, 뒤)
        low += 1; high -= 1
    return order, working_pages

def generate_booklet_pdf(cover_path, content_paths, output_path):
    """
    PDF 병합 및 소책자 변환 로직
    """
    try:
        out_doc = fitz.open()
        temp_doc = fitz.open()
        
        # 1. 표지 삽입
        if cover_path:
            temp_doc.insert_pdf(fitz.open(cover_path))
        
        # 2. 내용 삽입
        for cf in content_paths:
            temp_doc.insert_pdf(fitz.open(cf))
        
        total_count = len(temp_doc)
        if total_count == 0:
            return False, "병합할 페이지가 없습니다."

        order, target_total = get_imposition_order(total_count)
        
        # 3. A4 가로 레이아웃 생성
        a4_w, a4_h = 842, 595
        for i in range(0, len(order), 2):
            new_page = out_doc.new_page(width=a4_w, height=a4_h)
            for j, pos in enumerate([order[i], order[i+1]]):
                idx = pos - 1
                if idx < total_count:
                    rect = fitz.Rect(0 if j==0 else a4_w/2, 0, a4_w/2 if j==0 else a4_w, a4_h)
                    new_page.show_pdf_page(rect, temp_doc, idx)

        # 4. 저장
        out_doc.save(output_path)
        return True, f"총 {target_total}페이지 (원본 {total_count}페이지) 변환 완료"
    
    except Exception as e:
        return False, str(e)
