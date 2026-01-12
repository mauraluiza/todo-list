import { useRef } from 'react'
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Image from '@tiptap/extension-image'
import { Bold, Italic, Strikethrough, List, ListOrdered, CheckSquare, Image as ImageIcon, AlignLeft, AlignCenter, AlignRight, Percent } from 'lucide-react'
import { Button } from './ui/button'

const CustomImage = Image.extend({
    addAttributes() {
        return {
            ...this.parent?.(),
            width: {
                default: '100%',
                renderHTML: attributes => {
                    return {
                        style: `width: ${attributes.width}; height: auto; display: block; margin-left: ${attributes.align === 'center' || attributes.align === 'right' ? 'auto' : '0'}; margin-right: ${attributes.align === 'center' ? 'auto' : '0'};`
                    }
                }
            },
            align: {
                default: 'center',
                renderHTML: attributes => {
                    return {
                        'data-align': attributes.align,
                        style: `width: ${attributes.width}; height: auto; display: block; margin-left: ${attributes.align === 'center' || attributes.align === 'right' ? 'auto' : '0'}; margin-right: ${attributes.align === 'center' ? 'auto' : '0'};`
                    }
                }
            }
        }
    }
})

export default function RichTextEditor({ content, onChange, editable = true }) {
    const fileInputRef = useRef(null)

    const editor = useEditor({
        extensions: [
            StarterKit,
            TaskList,
            TaskItem.configure({
                nested: true,
            }),
            CustomImage.configure({
                inline: false,
                allowBase64: true,
            })
        ],
        content: content || '',
        editable: editable,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML())
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[150px] p-2 leading-relaxed',
            },
        },
    })

    if (!editor) {
        return null
    }

    const handleImageUpload = (event) => {
        const file = event.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onload = (e) => {
                editor.chain().focus().setImage({ src: e.target.result }).run()
            }
            reader.readAsDataURL(file)
        }
        event.target.value = ''
    }

    const triggerFileInput = () => {
        fileInputRef.current?.click()
    }

    const setWidth = (width) => {
        if (editor.isActive('image')) {
            editor.chain().focus().updateAttributes('image', { width }).run()
        }
    }

    const setAlign = (align) => {
        if (editor.isActive('image')) {
            editor.chain().focus().updateAttributes('image', { align }).run()
        }
    }

    if (!editable) {
        return <EditorContent editor={editor} className="border rounded-md p-2 bg-muted/20" />
    }

    return (
        <div className="border rounded-md overflow-hidden bg-card relative">
            {/* Toolbar */}
            <div className="flex flex-wrap gap-1 p-2 bg-muted/40 border-b">
                <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'bg-muted' : ''}>
                    <Bold className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'bg-muted' : ''}>
                    <Italic className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleStrike().run()} className={editor.isActive('strike') ? 'bg-muted' : ''}>
                    <Strikethrough className="h-4 w-4" />
                </Button>
                <div className="w-px h-6 bg-border mx-1" />
                <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive('bulletList') ? 'bg-muted' : ''}>
                    <List className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={editor.isActive('orderedList') ? 'bg-muted' : ''}>
                    <ListOrdered className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleTaskList().run()} className={editor.isActive('taskList') ? 'bg-muted' : ''}>
                    <CheckSquare className="h-4 w-4" />
                </Button>
                <div className="w-px h-6 bg-border mx-1" />
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                <Button variant="ghost" size="sm" onClick={triggerFileInput}>
                    <ImageIcon className="h-4 w-4" />
                </Button>
            </div>

            {/* Image Bubble Menu */}
            {editor && (
                <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }} shouldShow={({ editor }) => editor.isActive('image')}>
                    <div className="flex bg-card border rounded-md shadow-lg p-1 gap-1 items-center">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setAlign('left')}>
                            <AlignLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setAlign('center')}>
                            <AlignCenter className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setAlign('right')}>
                            <AlignRight className="h-4 w-4" />
                        </Button>
                        <div className="w-px h-6 bg-border mx-1" />
                        <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => setWidth('25%')}>25%</Button>
                        <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => setWidth('50%')}>50%</Button>
                        <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => setWidth('75%')}>75%</Button>
                        <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => setWidth('100%')}>100%</Button>
                    </div>
                </BubbleMenu>
            )}

            {/* Content Area */}
            <div className="p-2 cursor-text" onClick={() => editor.chain().focus().run()}>
                <EditorContent editor={editor} />
            </div>
        </div>
    )
}
