const fs = require('fs');
const path = 'c:/projects/education/src/components/workshops/journey/AdminConsole.tsx';
let content = fs.readFileSync(path, 'utf8');

const regex = /\{(\(\) => \{\r?\n\s*const parts = \(selEntry\.ancient_body \|\| ''\)\.split\('<!--BLOCK-->'\))([\s\S]*?)RIGHT: media rail \*\//;

const replacement = `{(() => {
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

              {/* RIGHT: media rail */`;

if (regex.test(content)) {
  content = content.replace(regex, replacement);
  fs.writeFileSync(path, content, 'utf8');
  console.log("SUCCESS");
} else {
  console.log("FAILED to find block with broad regex");
}
