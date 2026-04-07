import os
import fitz  # PyMuPDF
import math
import subprocess
from config_manager import load_config

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

def open_file(linux_path):
    try:
        # 1. WSL 환경인 경우
        if subprocess.run(['which', 'wslpath'], capture_output=True).returncode == 0:
            win_path = subprocess.check_output(['wslpath', '-w', linux_path], text=True).strip()
            subprocess.run(['powershell.exe', '-c', f'start "{win_path}"'], check=False)
        # 2. Native Linux 환경인 경우
        elif subprocess.run(['which', 'xdg-open'], capture_output=True).returncode == 0:
            subprocess.run(['xdg-open', linux_path], check=False)
        elif subprocess.run(['which', 'open'], capture_output=True).returncode == 0:
            subprocess.run(['open', linux_path], check=False)
    except Exception:
        pass

def process_booklet():
    print("=== PDF 소책자 제작 시스템 (Saddle Stitch - CLI) ===")
    
    # 1. 설정 로드 및 작업 경로 설정
    config = load_config()
    default_dir = config.get("last_directory", os.path.expanduser("~/문서"))
    
    print(f"기본 작업 폴더: {default_dir}")
    path_input = input(f"작업 폴더 경로를 입력하세요 (엔터 시 기본값): ").strip()
    base_dir = path_input if path_input else default_dir
    
    if not os.path.isdir(base_dir):
        print(f"오류: '{base_dir}'은(는) 유효한 디렉토리가 아닙니다.")
        return

    keyword = input("검색할 파일 키워드를 입력하세요 (예: 함께하는): ").strip()
    if not keyword:
        print("오류: 키워드를 입력해야 합니다.")
        return
    
    # 2. 파일 자동 탐색 및 분류
    try:
        all_files = [f for f in os.listdir(base_dir) if f.lower().endswith(".pdf") and keyword.lower() in f.lower()]
    except Exception as e:
        print(f"오류: 디렉토리 읽기 실패 ({e})")
        return
    
    if not all_files:
        print(f"오류: '{keyword}' 키워드를 포함하는 PDF 파일이 '{base_dir}'에 없습니다.")
        return

    # 표지 자동 감지: (표지), 표지, (cover), cover, (1), title 포함 파일 순서대로 탐색
    COVER_KEYWORDS = ["(표지)", "표지", "(cover)", "cover", "(1)", "title"]
    front_file = None
    for kw in COVER_KEYWORDS:
        front_file = next((f for f in all_files if kw in f.lower()), None)
        if front_file:
            break

    if front_file:
        content_files = sorted(f for f in all_files if f != front_file)
    else:
        print("알림: 표지 파일을 찾지 못했습니다. 표지 없이 전체 파일을 내용으로 처리합니다.")
        content_files = sorted(all_files)

    print(f"\n[분석 결과]")
    print(f"- 작업 디렉토리: {base_dir}")
    print(f"- 표지 파일: {front_file if front_file else '(없음)'}")
    print(f"- 내용 파일: {', '.join(content_files)}")

    # 3. PDF 병합 및 재배치
    try:
        out_doc = fitz.open()
        temp_doc = fitz.open()
        
        # 절대 경로로 파일 열기 (표지는 있을 때만)
        if front_file:
            temp_doc.insert_pdf(fitz.open(os.path.join(base_dir, front_file)))
        for cf in content_files:
            temp_doc.insert_pdf(fitz.open(os.path.join(base_dir, cf)))
        
        total_count = len(temp_doc)
        if total_count == 0:
            print("오류: 병합할 페이지가 없습니다.")
            return

        order, target_total = get_imposition_order(total_count)
        
        # A4 가로 레이아웃 생성
        a4_w, a4_h = 842, 595
        for i in range(0, len(order), 2):
            new_page = out_doc.new_page(width=a4_w, height=a4_h)
            for j, pos in enumerate([order[i], order[i+1]]):
                idx = pos - 1
                if idx < total_count:
                    rect = fitz.Rect(0 if j==0 else a4_w/2, 0, a4_w/2 if j==0 else a4_w, a4_h)
                    new_page.show_pdf_page(rect, temp_doc, idx)

        # 4. 결과 저장
        output_name = f"1_{keyword.replace(' ', '_')}_최종본.pdf"
        output_path = os.path.join(base_dir, output_name)
        out_doc.save(output_path)
        print(f"\n성공! '{output_path}' 파일이 생성되었습니다. (원본 {total_count} -> 결과 {target_total}페이지)")
        
        # 자동 열기 시도
        open_choice = input("\n결과 파일을 여시겠습니까? (y/n): ").lower()
        if open_choice == 'y':
            open_file(output_path)

    except Exception as e:
        print(f"\n작업 중 오류 발생: {e}")

if __name__ == "__main__":
    process_booklet()
