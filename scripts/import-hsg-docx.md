# Import Bài tập HSG từ `HSG - Quang.docx`

Nội dung HTML nằm tại `frontend/src/html/hsg/` (mỗi chủ đề một thư mục, mỗi bài một file `bai-N.html`, ảnh trong `media/`).

Để tái tạo từ file Word:

1. Giải nén docx vào `/tmp/hsg-docx`
2. Chạy lại script Python đã dùng trong phiên làm việc (parse `word/document.xml`, copy/convert media, sinh HTML + `manifest.json`)
3. Đồng bộ `frontend/src/data/hsg-manifest.json` với `frontend/src/html/hsg/manifest.json`

Ghi chú:

- Ảnh PNG/JPG được giữ nguyên.
- Ảnh WMF/EMF (công thức OLE) chuyển bằng ImageMagick thường chỉ là preview nhỏ; một số công thức trong đề có thể bị thiếu ký hiệu.
- Trình duyệt bài tập: `/exercises` → chủ đề → bài (iframe `/html/hsg/...`).
