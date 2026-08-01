const fs = require('fs');
const path = 'c:/projects/education/src/components/workshops/journey/AdminConsole.tsx';
let content = fs.readFileSync(path, 'utf8');

const startStr = "const parts = (selEntry.ancient_body || '').split('<!--BLOCK-->')";
const endStr = "{/* RIGHT: media rail */";

const startIndex = content.indexOf(startStr);
const endIndex = content.indexOf(endStr);

if (startIndex !== -1 && endIndex !== -1) {
  const replacement = `const parts = (selEntry.ancient_body || '').split('<!--BLOCK-->')
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

              `;
  content = content.substring(0, startIndex) + replacement + content.substring(endIndex);
  fs.writeFileSync(path, content, 'utf8');
  console.log("SUCCESS using indexOf");
} else {
  console.log("Failed to find start or end index", startIndex, endIndex);
}
