// client/src/components/RichTextEditor.jsx
import { useEffect, useRef } from 'react';

// Adapter upload ảnh lên backend
class BlogImageUploadAdapter {
  constructor(loader, uploadUrl) {
    this.loader = loader;
    this.uploadUrl = uploadUrl;
    this.controller = new AbortController();
  }

  // CKEditor sẽ gọi hàm này khi upload
  upload() {
    return this.loader.file.then(
      (file) =>
        new Promise((resolve, reject) => {
          const data = new FormData();
          data.append('upload', file); // field name phải trùng với multer.single('upload')

          fetch(this.uploadUrl, {
            method: 'POST',
            body: data,
            signal: this.controller.signal,
          })
            .then(async (res) => {
              if (!res.ok) {
                const err = await res.text();
                throw new Error(err || `Upload failed with status ${res.status}`);
              }
              return res.json();
            })
            .then((json) => {
              if (!json || !json.url) {
                throw new Error('Invalid upload response');
              }

              // CKEditor cần return object có key "default"
              resolve({
                default: json.url,
              });
            })
            .catch((err) => {
              console.error('Upload error:', err);
              reject(err);
            });
        }),
    );
  }

  // Nếu user cancel
  abort() {
    this.controller.abort();
  }
}

const RichTextEditor = ({ value, onChange }) => {
  const editorRef = useRef(null);
  const editorInstanceRef = useRef(null);

  useEffect(() => {
    if (!window.ClassicEditor || editorInstanceRef.current) return;

    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    const uploadUrl = `${API_BASE}/uploads/blog-image`;

    window.ClassicEditor.create(editorRef.current, {
      toolbar: [
        'heading',
        '|',
        'bold',
        'italic',
        'link',
        'bulletedList',
        'numberedList',
        '|',
        'imageUpload', // dùng plugin upload ảnh
        'blockQuote',
        'insertTable',
        'undo',
        'redo',
      ],
    })
      .then((editor) => {
        editorInstanceRef.current = editor;

        // Gắn adapter upload cho FileRepository
        editor.plugins.get('FileRepository').createUploadAdapter = (loader) =>
          new BlogImageUploadAdapter(loader, uploadUrl);

        // set data ban đầu
        editor.setData(value || '');

        // lắng nghe thay đổi
        editor.model.document.on('change:data', () => {
          onChange(editor.getData());
        });
      })
      .catch((error) => {
        console.error('CKEditor init error:', error);
      });

    return () => {
      if (editorInstanceRef.current) {
        editorInstanceRef.current.destroy().catch(console.error);
        editorInstanceRef.current = null;
      }
    };
  }, []);

  // nếu prop value đổi từ ngoài vào (trang edit)
  useEffect(() => {
    if (!editorInstanceRef.current) return;
    const current = editorInstanceRef.current.getData();
    if (value !== current) {
      editorInstanceRef.current.setData(value || '');
    }
  }, [value]);

  return (
    <div className="border rounded min-h-[200px]">
      <div ref={editorRef} />
    </div>
  );
};

export default RichTextEditor;
