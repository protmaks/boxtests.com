import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { useCallback, useEffect } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}

const MAX_IMAGE_SIZE = 500 * 1024; // 500KB

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Enter text...',
  className = '',
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert max-w-none focus:outline-none min-h-[120px] px-4 py-3',
      },
    },
  });

  // Update editor content when value prop changes externally
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  const handleImageUpload = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      // Validate file size
      if (file.size > MAX_IMAGE_SIZE) {
        alert(
          `Image size (${Math.round(file.size / 1024)}KB) exceeds 500KB limit. Please use a smaller image or compress it.`
        );
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file');
        return;
      }

      // Convert to Base64
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        editor?.chain().focus().setImage({ src: base64 }).run();
        
        // Show reminder about Export
        setTimeout(() => {
          const reminder = document.createElement('div');
          reminder.className = 'fixed bottom-4 right-4 bg-cyan-500/90 text-white px-4 py-3 rounded-lg shadow-lg z-50 max-w-sm border border-cyan-400';
          reminder.innerHTML = `
            <div class="flex items-start gap-2">
              <svg class="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div class="text-sm">
                <div class="font-semibold">Image added!</div>
                <div class="mt-1 text-cyan-100">Remember: Use <strong>Export → JSON</strong> to save tests with images reliably.</div>
              </div>
            </div>
          `;
          document.body.appendChild(reminder);
          setTimeout(() => {
            reminder.style.opacity = '0';
            reminder.style.transition = 'opacity 0.3s';
            setTimeout(() => reminder.remove(), 300);
          }, 4000);
        }, 100);
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }, [editor]);

  const addImageFromUrl = useCallback(() => {
    const url = prompt('Enter image URL:');
    if (url) {
      editor?.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className={`border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 overflow-hidden ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-2 py-2 border-b border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${
            editor.isActive('bold') ? 'bg-gray-300 dark:bg-gray-600' : ''
          }`}
          title="Bold"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
          </svg>
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${
            editor.isActive('italic') ? 'bg-gray-300 dark:bg-gray-600' : ''
          }`}
          title="Italic"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <line x1="19" y1="4" x2="10" y2="4" strokeLinecap="round" strokeWidth={2} />
            <line x1="14" y1="20" x2="5" y2="20" strokeLinecap="round" strokeWidth={2} />
            <line x1="15" y1="4" x2="9" y2="20" strokeLinecap="round" strokeWidth={2} />
          </svg>
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCode().run()}
          disabled={!editor.can().chain().focus().toggleCode().run()}
          className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${
            editor.isActive('code') ? 'bg-gray-300 dark:bg-gray-600' : ''
          }`}
          title="Code"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        </button>

        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${
            editor.isActive('bulletList') ? 'bg-gray-300 dark:bg-gray-600' : ''
          }`}
          title="Bullet List"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <line x1="8" y1="6" x2="21" y2="6" strokeLinecap="round" strokeWidth={2} />
            <line x1="8" y1="12" x2="21" y2="12" strokeLinecap="round" strokeWidth={2} />
            <line x1="8" y1="18" x2="21" y2="18" strokeLinecap="round" strokeWidth={2} />
            <line x1="3" y1="6" x2="3.01" y2="6" strokeLinecap="round" strokeWidth={3} />
            <line x1="3" y1="12" x2="3.01" y2="12" strokeLinecap="round" strokeWidth={3} />
            <line x1="3" y1="18" x2="3.01" y2="18" strokeLinecap="round" strokeWidth={3} />
          </svg>
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${
            editor.isActive('orderedList') ? 'bg-gray-300 dark:bg-gray-600' : ''
          }`}
          title="Numbered List"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <line x1="10" y1="6" x2="21" y2="6" strokeLinecap="round" strokeWidth={2} />
            <line x1="10" y1="12" x2="21" y2="12" strokeLinecap="round" strokeWidth={2} />
            <line x1="10" y1="18" x2="21" y2="18" strokeLinecap="round" strokeWidth={2} />
            <path d="M4 6h1v4" strokeLinecap="round" strokeWidth={2} />
            <path d="M4 10h2" strokeLinecap="round" strokeWidth={2} />
            <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" strokeLinecap="round" strokeWidth={2} />
          </svg>
        </button>

        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>

        <button
          type="button"
          onClick={handleImageUpload}
          className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          title="Upload Image (max 500KB)"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" strokeWidth={2} />
            <circle cx="8.5" cy="8.5" r="1.5" strokeWidth={2} />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15l-5-5L5 21" />
          </svg>
        </button>

        <button
          type="button"
          onClick={addImageFromUrl}
          className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          title="Image from URL"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </button>

        <div className="flex-1"></div>

        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().chain().focus().undo().run()}
          className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-30"
          title="Undo"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().chain().focus().redo().run()}
          className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-30"
          title="Redo"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
          </svg>
        </button>
      </div>

      {/* Editor */}
      <EditorContent editor={editor} placeholder={placeholder} />
    </div>
  );
}
