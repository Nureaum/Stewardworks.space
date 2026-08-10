'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Youtube from '@tiptap/extension-youtube'
import { CustomImage, CustomVideo } from './MediaNodes'
import { Bold, Italic, Link as LinkIcon, Unlink, Image as ImageIcon, Video, Heading1, Heading2, List, ListOrdered, Quote } from 'lucide-react'
import { useRef } from 'react'
import toast from 'react-hot-toast'

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  onUpload?: (formData: FormData) => Promise<{publicUrl: string, type: string}>
  theme?: 'light' | 'dark' | 'ailab'
}

export default function RichTextEditor({ content, onChange, onUpload, theme = 'light' }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
      }),
      CustomImage,
      Youtube,
      CustomVideo,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: `prose prose-sm sm:prose-base focus:outline-none min-h-[200px] max-w-none p-4 ${theme === 'ailab' ? 'prose-invert !text-[#d6ffe0]' : theme === 'dark' ? 'prose-invert' : ''}`,
      },
    },
  })

  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!editor) {
    return null
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const loadingToast = toast.loading('Uploading file...')
    try {
      const formData = new FormData()
      formData.append('file', file)

      let resData;
      
      if (onUpload) {
        resData = await onUpload(formData)
      } else {
        const res = await fetch('/api/admin/upload-media', {
          method: 'POST',
          body: formData,
        })
        if (!res.ok) {
          const error = await res.json()
          throw new Error(error.error || 'Upload failed')
        }
        resData = await res.json()
      }

      const { publicUrl, type } = resData

      // Move cursor to the end of the current selection so it doesn't overwrite the existing image/video
      editor.commands.setTextSelection(editor.state.selection.to)

      if (type === 'video') {
        // @ts-ignore
        editor.chain().focus().setVideo({ src: publicUrl }).run()
      } else {
        editor.chain().focus().setImage({ src: publicUrl }).run()
      }

      // Move cursor after the newly inserted media
      editor.commands.setTextSelection(editor.state.selection.to)

      toast.success('File uploaded successfully!', { id: loadingToast })
    } catch (error: any) {
      toast.error(error.message || 'Error uploading file', { id: loadingToast })
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '' // reset input
    }
  }

  const handleMediaClick = () => {
    fileInputRef.current?.click()
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('URL', previousUrl)

    if (url === null) {
      return
    }

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  return (
    <div className={`border rounded-md overflow-hidden flex flex-col ${theme === 'ailab' ? 'border-[#28432f] bg-[#08120d]' : theme === 'dark' ? 'border-gray-700 bg-gray-900' : 'border-gray-300 bg-white'}`}>
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        accept="image/*,video/mp4,video/webm" 
        className="hidden" 
      />
      <div className={`flex flex-wrap items-center gap-1 p-2 border-b ${theme === 'ailab' ? 'border-[#28432f] bg-[#14211b] text-[#77b78d]' : theme === 'dark' ? 'border-gray-700 bg-gray-800 text-gray-300' : 'bg-gray-50 text-gray-700'}`}>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded hover:bg-gray-200 hover:text-black ${editor.isActive('bold') ? (theme === 'ailab' ? 'bg-[#28432f] text-[#4dffa0]' : 'bg-gray-200 text-black') : ''}`}
        >
          <Bold size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded hover:bg-gray-200 hover:text-black ${editor.isActive('italic') ? (theme === 'ailab' ? 'bg-[#28432f] text-[#4dffa0]' : 'bg-gray-200 text-black') : ''}`}
        >
          <Italic size={16} />
        </button>
        
        <div className="w-px h-6 bg-gray-300 mx-1" />
        
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`p-1.5 rounded hover:bg-gray-200 ${editor.isActive('heading', { level: 1 }) ? 'bg-gray-200 text-black' : ''}`}
        >
          <Heading1 size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-1.5 rounded hover:bg-gray-200 hover:text-black ${editor.isActive('heading', { level: 2 }) ? (theme === 'ailab' ? 'bg-[#28432f] text-[#4dffa0]' : 'bg-gray-200 text-black') : ''}`}
        >
          <Heading2 size={16} />
        </button>
        
        <div className={`w-px h-6 mx-1 ${theme === 'ailab' ? 'bg-[#28432f]' : theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'}`} />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded hover:bg-gray-200 hover:text-black ${editor.isActive('bulletList') ? (theme === 'ailab' ? 'bg-[#28432f] text-[#4dffa0]' : 'bg-gray-200 text-black') : ''}`}
        >
          <List size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded hover:bg-gray-200 hover:text-black ${editor.isActive('orderedList') ? (theme === 'ailab' ? 'bg-[#28432f] text-[#4dffa0]' : 'bg-gray-200 text-black') : ''}`}
        >
          <ListOrdered size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-1.5 rounded hover:bg-gray-200 hover:text-black ${editor.isActive('blockquote') ? (theme === 'ailab' ? 'bg-[#28432f] text-[#4dffa0]' : 'bg-gray-200 text-black') : ''}`}
        >
          <Quote size={16} />
        </button>

        <div className={`w-px h-6 mx-1 ${theme === 'ailab' ? 'bg-[#28432f]' : theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'}`} />

        <button
          type="button"
          onClick={setLink}
          className={`p-1.5 rounded hover:bg-gray-200 hover:text-black ${editor.isActive('link') ? (theme === 'ailab' ? 'bg-[#28432f] text-[#4dffa0]' : 'bg-gray-200 text-black') : ''}`}
          title="Add/Edit Link"
        >
          <LinkIcon size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().unsetLink().run()}
          disabled={!editor.isActive('link')}
          className={`p-1.5 rounded hover:bg-gray-200 hover:text-black ${!editor.isActive('link') ? 'opacity-30 cursor-not-allowed' : ''}`}
          title="Remove Link"
        >
          <Unlink size={16} />
        </button>

        <div className={`w-px h-6 mx-1 ${theme === 'ailab' ? 'bg-[#28432f]' : theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'}`} />

        <button
          type="button"
          onClick={handleMediaClick}
          className="p-1.5 rounded hover:bg-gray-200 hover:text-black"
          title="Upload Image"
        >
          <ImageIcon size={16} />
        </button>
        <button
          type="button"
          onClick={handleMediaClick}
          className="p-1.5 rounded hover:bg-gray-200 hover:text-black"
          title="Upload Video"
        >
          <Video size={16} />
        </button>

      </div>
      <div className={`flex-1 overflow-y-auto cursor-text ${theme === 'ailab' ? 'bg-[#08120d] text-[#d6ffe0]' : theme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-white'}`} onClick={() => editor.commands.focus()}>
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
