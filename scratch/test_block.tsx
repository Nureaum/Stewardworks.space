import fs from 'fs';

const renderAdditionalBlocksUI = (blocks: string[], onSave: (newBlocks: string[]) => void, endRef: React.RefObject<HTMLDivElement>) => {
  return (
    <>
      <div className="font-vt323" style={{ fontSize: 22, color: 'var(--mu,#a493c9)', marginBottom: 6, marginTop: 24 }}>
        ADDITIONAL TEXT BLOCKS · <span style={{ color: 'var(--ok,#74f0a0)' }}>rich text — each block appears below the content</span>
      </div>
      {blocks.map((blk, idx) => {
        let blockType = 'text'
        let blockTitle = ''
        let blockRawContent = blk

        const typeMatch = blockRawContent.match(/^<!--TYPE:(.*?)-->/)
        if (typeMatch) {
          blockType = typeMatch[1]
          blockRawContent = blockRawContent.substring(typeMatch[0].length)
        }

        const titleMatch = blockRawContent.match(/^<!--TITLE:(.*?)-->/)
        if (titleMatch) {
          blockTitle = titleMatch[1]
          blockRawContent = blockRawContent.substring(titleMatch[0].length)
        }

        let listItems: string[] = []
        if (blockType === 'list') {
          try {
            listItems = JSON.parse(blockRawContent)
            if (!Array.isArray(listItems)) listItems = []
          } catch (e) {
            listItems = blockRawContent ? blockRawContent.split('<!--LIST_ITEM-->') : []
          }
        }

        const updateBlock = (newType: string, newTitle: string, newContent: string | string[]) => {
          const newBlocks = [...blocks]
          let blockStr = ''
          if (newType !== 'text') {
            blockStr += `<!--TYPE:${newType}-->`
          }
          blockStr += `<!--TITLE:${newTitle}-->`
          if (newType === 'list') {
            blockStr += JSON.stringify(newContent)
          } else {
            blockStr += newContent as string
          }
          newBlocks[idx] = blockStr
          onSave(newBlocks)
        }

        const btnStyle = (isActive: boolean) => ({
          fontSize: 9, cursor: 'pointer', 
          color: isActive ? 'var(--bg,#1a1025)' : 'var(--mu,#a493c9)', 
          background: isActive ? 'var(--ok,#74f0a0)' : 'transparent',
          border: 'none', padding: '6px 9px', flex: 1
        })

        return (
          <div key={idx} style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span className="font-pixel" style={{ fontSize: 7, color: 'var(--gold,#ffd23f)' }}>◈ BLOCK {idx + 1}</span>
              <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                <div style={{ display: 'flex', border: '1px solid var(--ln,#3d2668)', borderRadius: 5, overflow: 'hidden' }}>
                  <button 
                    onClick={() => updateBlock('text', blockTitle, blockRawContent)}
                    className="font-pixel"
                    style={btnStyle(blockType === 'text')}
                  >TEXT</button>
                  <button 
                    onClick={() => updateBlock('list', blockTitle, listItems)}
                    className="font-pixel"
                    style={btnStyle(blockType === 'list')}
                  >LIST</button>
                  <button 
                    onClick={() => updateBlock('quote', blockTitle, blockRawContent)}
                    className="font-pixel"
                    style={btnStyle(blockType === 'quote')}
                  >QUOTE</button>
                </div>
              </div>
              <button 
                onClick={() => {
                  const newBlocks = [...blocks]
                  newBlocks.splice(idx, 1)
                  onSave(newBlocks)
                }} 
                className="font-pixel"
                style={{
                  fontSize: 7, cursor: 'pointer', color: 'var(--warn,#ff7a7a)', background: 'transparent',
                  border: '2px solid var(--ln,#3d2668)', borderRadius: 4, padding: '6px 9px'
                }}
              >✕ REMOVE</button>
            </div>
            <input 
              defaultValue={blockTitle}
              onBlur={e => updateBlock(blockType, e.target.value, blockType === 'list' ? listItems : blockRawContent)}
              placeholder="Block Title..."
              style={{ fontSize: 16, marginBottom: 8, padding: '10px 12px' }}
            />
            {blockType === 'list' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {listItems.map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <div className="font-pixel" style={{ color: 'var(--pk,#ff5fd2)', fontSize: 10, paddingTop: 14 }}>◈</div>
                    <textarea
                      defaultValue={item}
                      onBlur={e => {
                        const newItems = [...listItems]
                        newItems[i] = e.target.value
                        updateBlock('list', blockTitle, newItems)
                      }}
                      style={{
                        fontSize: 16,
                        padding: '12px 14px',
                        minHeight: 60,
                        resize: 'vertical',
                        flex: 1,
                        fontFamily: 'inherit'
                      }}
                    />
                    <button
                      onClick={() => {
                        const newItems = [...listItems]
                        newItems.splice(i, 1)
                        updateBlock('list', blockTitle, newItems)
                      }}
                      className="font-pixel"
                      style={{
                        fontSize: 12, cursor: 'pointer', color: 'var(--warn,#ff7a7a)', background: 'transparent',
                        border: 'none', padding: '12px 4px', flex: 'none'
                      }}
                      title="Remove item"
                    >✕</button>
                  </div>
                ))}
                <button
                  onClick={() => {
                    const newItems = [...listItems, '']
                    updateBlock('list', blockTitle, newItems)
                  }}
                  className="font-pixel"
                  style={{
                    fontSize: 9, cursor: 'pointer', color: 'var(--pk,#ff5fd2)', background: 'transparent',
                    border: '2px dashed var(--pk,#ff5fd2)', borderRadius: 6, padding: '12px', marginTop: 4
                  }}
                >＋ ADD LIST ITEM</button>
              </div>
            ) : (
              <RichEditor
                value={blockRawContent}
                onBlur={val => updateBlock(blockType, blockTitle, val)}
                minHeight={150}
                accent="var(--ok,#74f0a0)"
              />
            )}
          </div>
        )
      })}
      <button 
        onClick={() => {
          const newBlocks = [...blocks, '']
          onSave(newBlocks)
          setTimeout(() => {
            endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
          }, 100)
        }}
        className="font-pixel"
        style={{
          fontSize: 8, cursor: 'pointer', color: 'var(--ok,#74f0a0)', background: 'transparent',
          border: '2px dashed var(--ok,#74f0a0)', borderRadius: 6, padding: '11px 13px', marginTop: 2
        }}
      >＋ ADD TEXT BLOCK</button>
      <div ref={endRef} style={{ height: 1 }} />
    </>
  )
}
