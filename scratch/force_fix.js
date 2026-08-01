const fs = require('fs');

const path = 'c:/projects/education/src/components/workshops/journey/AdminConsole.tsx';
let content = fs.readFileSync(path, 'utf8');

const targetStr = `                        {(() => {
                          const parts = (selEntry.ancient_body || '').split('<!--BLOCK-->')
                          const mainBody = parts[0] || ''
                          const additionalBlocks = parts.slice(1)
                              onClick={() => {
                                const newBlocks = [...additionalBlocks, '']
                                handleEntryFieldBlur(selEntry.id, 'body', [mainBody, ...newBlocks].join('<!--BLOCK-->'))
                                setTimeout(() => {
                                  blocksEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
                                }, 100)
                              }}
                              className="font-pixel"
                              style={{
                                fontSize: 8, cursor: 'pointer', color: 'var(--ok,#74f0a0)', background: 'transparent',
                                border: '2px dashed var(--ok,#74f0a0)', borderRadius: 6, padding: '11px 13px', marginTop: 2
                              }}
                            >＋ ADD TEXT BLOCK</button>
                            <div ref={blocksEndRef} style={{ height: 1 }} />
                          </div>
                        </>
                      )
                    })()}
                  </>
                )}
              </div>

              {/* RIGHT: media rail */}`;

const replacement = `                        {(() => {
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
                ) : (
                  <div style={{ padding: 20, color: 'var(--mu,#a493c9)' }}>
                    Type editor missing. Please Ctrl+Z in your editor to restore the file, as it was truncated due to an error.
                  </div>
                )}
              </div>

              {/* RIGHT: media rail */}`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replacement);
  fs.writeFileSync(path, content, 'utf8');
  console.log("Replaced using exact string match.");
} else {
  // Let's try matching with regex
  console.log("Exact string not found. Trying regex...");
  const startRegex = /\{(\(\) => \{\n\s*const parts = \(selEntry\.ancient_body \|\| ''\)\.split\('<!--BLOCK-->'\)\n\s*const mainBody = parts\[0\] \|\| ''\n\s*const additionalBlocks = parts\.slice\(1\))([\s\S]*?)RIGHT: media rail \*\//;
  
  if (startRegex.test(content)) {
     content = content.replace(startRegex, replacement.replace("                        ", "").replace("              {/* RIGHT: media rail */}", "{/* RIGHT: media rail */"));
     fs.writeFileSync(path, content, 'utf8');
     console.log("Replaced using regex.");
  } else {
     console.log("Failed to find with regex too.");
  }
}
