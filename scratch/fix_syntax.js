const fs = require('fs');

const path = 'c:/projects/education/src/components/workshops/journey/AdminConsole.tsx';
let content = fs.readFileSync(path, 'utf8');

// The garbled block starts at `{(() => {` after `SUBMISSION PROMPT LABEL`
// and ends at `</>` before `)} </div> {/* RIGHT: media rail */}`

const garbledStart = content.indexOf(`                        {(() => {
                          const parts = (selEntry.ancient_body || '').split('<!--BLOCK-->')`);
const garbledEnd = content.indexOf(`                  </>
                )}
              </div>

              {/* RIGHT: media rail */}`);

if (garbledStart !== -1 && garbledEnd !== -1) {
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
  
  content = content.substring(0, garbledStart) + replacement + content.substring(garbledEnd + 93); // length of the search string
  fs.writeFileSync(path, content, 'utf8');
  console.log("Fixed garbled syntax successfully!");
} else {
  console.log("Could not find garbled section.");
}
