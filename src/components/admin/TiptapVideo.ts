import { Node, mergeAttributes } from '@tiptap/core'
import type { RawCommands } from '@tiptap/core'

export const VideoExtension = Node.create({
  name: 'video',
  group: 'block',
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'video',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['video', mergeAttributes(HTMLAttributes, { controls: 'true', style: 'max-width: 100%; border-radius: 0.5rem;' })]
  },

  addCommands(): Partial<RawCommands> {
    return {
      setVideo:
        (options: { src: string }) =>
        ({ commands }: any) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          })
        },
    } as Partial<RawCommands>
  },
})
