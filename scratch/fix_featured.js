const fs = require('fs');
const path = 'c:/projects/education/src/components/workshops/journey/AdminConsole.tsx';
let content = fs.readFileSync(path, 'utf8');

const targetStr = `                        {(() => {
                          const parts = (selEntry.ancient_body || '').split('<!--BLOCK-->')
                          const mainBody = parts[0] || ''
                          const additionalBlocks = parts.slice(1)
                          return renderAdditionalBlocksUI(additionalBlocks, newBlocks => {
                            handleEntryFieldBlur(selEntry.id, 'ancient_body', [mainBody, ...newBlocks].join('<!--BLOCK-->'))
                          }, blocksEndRef)
                        })()}
                      </>
                    )
                  })()
                ) : selEntry.entry_type === 'featured' ? (
                  <div>
                    <div className="font-vt323" style={{ fontSize: 22, color: 'var(--mu,#a493c9)', marginBottom: 6 }}>FEATURED CONTENT BLOCKS</div>
                    <div style={{ fontSize: 16, color: 'var(--mu,#a493c9)', marginBottom: 16, lineHeight: 1.4 }}>
                      Add rich text blocks below. Each block will appear in the featured section.
                    </div>
                    {(() => {
                      const parts = (selEntry.ancient_body || '').split('<!--BLOCK-->')
                      const mainBody = parts[0] || ''
                      const additionalBlocks = parts.slice(1)
                      return renderAdditionalBlocksUI(additionalBlocks, newBlocks => {
                        handleEntryFieldBlur(selEntry.id, 'ancient_body', [mainBody, ...newBlocks].join('<!--BLOCK-->'))
                      }, blocksEndRef)
                    })()}
                  </div>
                ) : (
                  <div>
                    <div className="font-vt323" style={{ fontSize: 22, color: 'var(--mu,#a493c9)', marginBottom: 6 }}>TEXT CONTENT</div>
                    <RichEditor
                      value={selEntry.body || ''}
                      onBlur={val => handleEntryFieldBlur(selEntry.id, 'body', val)}
                      minHeight={300}
                      accent="var(--ok,#74f0a0)"
                    />
                    {(() => {
                      const parts = (selEntry.ancient_body || '').split('<!--BLOCK-->')
                      const mainBody = parts[0] || ''
                      const additionalBlocks = parts.slice(1)
                      return renderAdditionalBlocksUI(additionalBlocks, newBlocks => {
                        handleEntryFieldBlur(selEntry.id, 'ancient_body', [mainBody, ...newBlocks].join('<!--BLOCK-->'))
                      }, blocksEndRef)
                    })()}
                  </div>
                )}`;

const replacement = `                        {(() => {
                          const parts = (selEntry.body || '').split('<!--BLOCK-->')
                          const mainBody = parts[0] || ''
                          const additionalBlocks = parts.slice(1)
                          return renderAdditionalBlocksUI(additionalBlocks, newBlocks => {
                            handleEntryFieldBlur(selEntry.id, 'body', [mainBody, ...newBlocks].join('<!--BLOCK-->'))
                          }, blocksEndRef)
                        })()}
                      </>
                    )
                  })()
                ) : selEntry.entry_type === 'featured' ? (
                  <>
                    <div className="font-vt323" style={{ fontSize: 22, color: 'var(--mu,#a493c9)', marginBottom: 6 }}>FEATURED CONTRIBUTOR PIECE</div>
                    <select
                      value={selEntry.contrib_id || ''}
                      onChange={e => handleEntryFieldBlur(selEntry.id, 'contrib_id', e.target.value === '' ? null : e.target.value)}
                      style={{ ...inputStyle, fontSize: 16, marginBottom: 16, padding: '12px 14px', background: 'rgba(0,0,0,0.6)' }}
                    >
                      <option value="">-- Select a piece --</option>
                      {(showcaseList || []).map(item => (
                        <option key={item.id} value={item.id}>
                          {item.type === 'video' ? 'Video Lesson' : item.type === 'audio' ? 'Audio Guide' : item.type === 'article' ? 'Article' : item.type === 'aigen' ? 'AI Generation' : 'Resource'} - {item.title} · {item.author || 'Unknown'}
                        </option>
                      ))}
                    </select>

                    <div className="font-vt323" style={{ fontSize: 22, color: 'var(--mu,#a493c9)', marginBottom: 6 }}>WHY IT'S FEATURED · <span style={{ color: 'var(--ok,#74f0a0)' }}>rich text</span></div>
                    <div style={{ marginBottom: 16 }}>
                      <RichEditor
                        value={selEntry.note || ''}
                        onBlur={val => handleEntryFieldBlur(selEntry.id, 'note', val)}
                        minHeight={150}
                        accent="var(--s,#45d6ff)"
                      />
                    </div>
                    
                    {(() => {
                      const parts = (selEntry.body || '').split('<!--BLOCK-->')
                      const mainBody = parts[0] || ''
                      const additionalBlocks = parts.slice(1)
                      return renderAdditionalBlocksUI(additionalBlocks, newBlocks => {
                        handleEntryFieldBlur(selEntry.id, 'body', [mainBody, ...newBlocks].join('<!--BLOCK-->'))
                      }, blocksEndRef)
                    })()}
                  </>
                ) : (
                  <div>
                    <div className="font-vt323" style={{ fontSize: 22, color: 'var(--mu,#a493c9)', marginBottom: 6 }}>TEXT CONTENT</div>
                    <RichEditor
                      value={selEntry.body || ''}
                      onBlur={val => handleEntryFieldBlur(selEntry.id, 'body', val)}
                      minHeight={300}
                      accent="var(--ok,#74f0a0)"
                    />
                    {(() => {
                      const parts = (selEntry.body || '').split('<!--BLOCK-->')
                      const mainBody = parts[0] || ''
                      const additionalBlocks = parts.slice(1)
                      return renderAdditionalBlocksUI(additionalBlocks, newBlocks => {
                        handleEntryFieldBlur(selEntry.id, 'body', [mainBody, ...newBlocks].join('<!--BLOCK-->'))
                      }, blocksEndRef)
                    })()}
                  </div>
                )}`;

// Since line endings may differ (\n vs \r\n), we'll replace all spaces/newlines with a regex to match precisely,
// or we can use indexOf for the start and end portions.
const startStr = `                        {(() => {\n                          const parts = (selEntry.ancient_body || '').split('<!--BLOCK-->')\n                          const mainBody = parts[0] || ''`;
const endStr = `                      }, blocksEndRef)\n                    })()\n                  </div>\n                )}`;

function normalize(s) { return s.replace(/\r\n/g, '\n'); }

content = normalize(content);
const normalizedTarget = normalize(targetStr);

if (content.includes(normalizedTarget)) {
  content = content.replace(normalizedTarget, replacement);
  fs.writeFileSync(path, content, 'utf8');
  console.log('SUCCESS: Replaced exact string match!');
} else {
  // Broad match fallback
  console.log('Falling back to index slicing...');
  const idx1 = content.indexOf(`                        {(() => {\n                          const parts = (selEntry.ancient_body || '').split('<!--BLOCK-->')`);
  const idx2 = content.indexOf(`                  </div>\n                )}\n              </div>\n\n              {/* RIGHT: media rail */}`);
  
  if (idx1 !== -1 && idx2 !== -1) {
    content = content.substring(0, idx1) + replacement + content.substring(idx2 + `                  </div>\n                )}`.length);
    fs.writeFileSync(path, content, 'utf8');
    console.log('SUCCESS: Sliced string block');
  } else {
    console.log('FAILED: Could not find block', idx1, idx2);
  }
}
