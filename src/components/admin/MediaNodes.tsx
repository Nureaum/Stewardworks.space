import React from 'react'
import { NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react'
import { Trash2 } from 'lucide-react'
import Image from '@tiptap/extension-image'
import { Node, mergeAttributes } from '@tiptap/core'

function MediaWrapper(props: any) {
  return (
    <NodeViewWrapper className="relative inline-block max-w-full group my-4">
      <div 
        className={`relative inline-block rounded-xl overflow-hidden ring-4 ${props.selected ? 'ring-steward-blue' : 'ring-transparent'} transition-all`}
      >
        {props.children}
        
        <button
          type="button"
          onClick={() => props.deleteNode()}
          className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-100 hover:bg-red-600 transition-all shadow-lg cursor-pointer flex items-center justify-center z-10"
          title="Delete Media"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </NodeViewWrapper>
  )
}

function ImageNode(props: any) {
  return (
    <MediaWrapper {...props}>
      <img src={props.node.attrs.src} alt={props.node.attrs.alt} title={props.node.attrs.title} className="max-w-full h-auto m-0" />
    </MediaWrapper>
  )
}

function VideoNode(props: any) {
  return (
    <MediaWrapper {...props}>
      <video src={props.node.attrs.src} controls className="max-w-full h-auto m-0" />
    </MediaWrapper>
  )
}

export const CustomImage = Image.extend({
  inline() {
    return false
  },
  group: 'block',
  addNodeView() {
    return ReactNodeViewRenderer(ImageNode)
  }
})

export const CustomVideo = Node.create({
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
    return [{ tag: 'video' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['video', mergeAttributes(HTMLAttributes, { controls: 'true', style: 'max-width: 100%; border-radius: 0.5rem;' })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(VideoNode)
  },

  // @ts-ignore
  addCommands() {
    return {
      setVideo: (options: { src: string }) => ({ commands }: any) => {
        return commands.insertContent({
          type: this.name,
          attrs: options,
        })
      },
    }
  },
})
