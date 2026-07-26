const fs = require('fs');
let code = fs.readFileSync('src/components/workshops/journey/Showcase.tsx', 'utf8');

// 1. Add import
if (!code.includes('showcase_settings')) {
  code = code.replace(
    "import { getStudentShowcaseDeliverables } from '@/app/actions/workshops/showcase'",
    "import { getStudentShowcaseDeliverables } from '@/app/actions/workshops/showcase'\nimport { getShowcaseSettings, updateShowcaseSettings } from '@/app/actions/workshops/showcase_settings'"
  );
}

// 2. Add isAdmin to Props
code = code.replace(
  "  onlyContributors?: boolean\n}",
  "  onlyContributors?: boolean\n  isAdmin?: boolean\n}"
);

// 3. Add to function signature
code = code.replace(
  "export default function Showcase({ showcaseItems = [], engagements = [], onBookmark, cohortId, onlyStudents = false, onlyContributors = false }: ShowcaseProps) {",
  "export default function Showcase({ showcaseItems = [], engagements = [], onBookmark, cohortId, onlyStudents = false, onlyContributors = false, isAdmin = false }: ShowcaseProps) {"
);

// 4. Add state variables inside Showcase Component
const stateVars = `
  const [settings, setSettings] = useState({
    contributors_title: '★ CONTRIBUTORS SHOWCASE LIBRARY',
    contributors_description: 'Curated lessons, articles, audio guides, and AI-generated packs from community contributors, partner educators, and the StewardWorks AI Lab. Bookmark items to your desk for quick reference during workshops.',
    student_title: '★ STUDENT SHOWCASE LIBRARY',
    student_description: 'Explore inspiring AI creations designed by your peers. When instructors approve student creations, they appear here.'
  })
  const [showSettingsForm, setShowSettingsForm] = useState(false)
  const [editSettings, setEditSettings] = useState(settings)
  const [savingSettings, setSavingSettings] = useState(false)

  useEffect(() => {
    getShowcaseSettings().then(data => {
      if (data) {
        setSettings({
          contributors_title: data.contributors_title || '★ CONTRIBUTORS SHOWCASE LIBRARY',
          contributors_description: data.contributors_description || 'Curated lessons, articles, audio guides, and AI-generated packs from community contributors, partner educators, and the StewardWorks AI Lab. Bookmark items to your desk for quick reference during workshops.',
          student_title: data.student_title || '★ STUDENT SHOWCASE LIBRARY',
          student_description: data.student_description || 'Explore inspiring AI creations designed by your peers. When instructors approve student creations, they appear here.'
        })
      }
    }).catch(err => console.error('Failed to load settings', err))
  }, [])

  const handleSaveSettings = async () => {
    setSavingSettings(true)
    try {
      await updateShowcaseSettings(editSettings)
      setSettings(editSettings)
      setShowSettingsForm(false)
    } catch (err) {
      console.error(err)
    } finally {
      setSavingSettings(false)
    }
  }
`;

code = code.replace(
  "  const [studentsLoading, setStudentsLoading] = useState(false)",
  "  const [studentsLoading, setStudentsLoading] = useState(false)\n" + stateVars
);

// 5. Replace Contributors Header Banner
code = code.replace(
  /<h2 className="font-pixel" style={{[\s\S]*?<\/p>\s*<\/div>/,
  `<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
            <div>
              <h2 className="font-pixel" style={{
                fontSize: 'clamp(11px,1.6vw,15px)',
                color: 'var(--gold,#ffd23f)',
                margin: 0,
                lineHeight: 1.5,
              }}>
                {settings.contributors_title}
              </h2>
              <p style={{
                fontSize: 16,
                color: 'var(--mu,#a493c9)',
                margin: '8px 0 0',
                lineHeight: 1.55,
              }}>
                {settings.contributors_description}
              </p>
            </div>
            {isAdmin && (
              <button
                onClick={() => { setEditSettings(settings); setShowSettingsForm(true); }}
                className="font-pixel"
                style={{ flex: 'none', fontSize: 9, padding: '10px 16px', background: 'transparent', color: 'var(--gold,#ffd23f)', border: '2px solid var(--gold,#ffd23f)', borderRadius: 8, cursor: 'pointer', letterSpacing: '.5px' }}
              >
                ✎ EDIT
              </button>
            )}
          </div>
        </div>`
);

// 6. Replace Student Header Banner
const studentHeaderMatch = `              <div>
                <h2 className="font-pixel" style={{
                  fontSize: 'clamp(12px,1.8vw,18px)',
                  color: '#ff5fd2',
                  margin: 0,
                  lineHeight: 1.5,
                }}>
                  ★ STUDENT SHOWCASE LIBRARY
                </h2>
                <p style={{
                  fontSize: 15,
                  color: 'var(--mu,#a493c9)',
                  margin: '8px 0 0',
                  lineHeight: 1.55,
                }}>
                  Explore inspiring AI creations designed by your peers. When instructors approve student creations, they appear here.
                </p>
              </div>
              <button
                onClick={() => setShowAddForm(true)}
                className="font-pixel"
                style={{ flex: 'none', fontSize: 9, padding: '10px 16px', background: '#ff5fd2', color: '#0e1512', border: 'none', borderRadius: 8, cursor: 'pointer', letterSpacing: '.5px', whiteSpace: 'nowrap' }}
              >
                + ADD SHOWCASE
              </button>
            </div>`;

const studentHeaderReplace = `              <div>
                <h2 className="font-pixel" style={{
                  fontSize: 'clamp(12px,1.8vw,18px)',
                  color: '#ff5fd2',
                  margin: 0,
                  lineHeight: 1.5,
                }}>
                  {settings.student_title}
                </h2>
                <p style={{
                  fontSize: 18,
                  color: 'var(--mu,#a493c9)',
                  margin: '8px 0 0',
                  lineHeight: 1.55,
                }}>
                  {settings.student_description}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {isAdmin && (
                  <button
                    onClick={() => { setEditSettings(settings); setShowSettingsForm(true); }}
                    className="font-pixel"
                    style={{ flex: 'none', fontSize: 9, padding: '10px 16px', background: 'transparent', color: '#ff5fd2', border: '2px solid #ff5fd2', borderRadius: 8, cursor: 'pointer', letterSpacing: '.5px' }}
                  >
                    ✎ EDIT
                  </button>
                )}
                <button
                  onClick={() => setShowAddForm(true)}
                  className="font-pixel"
                  style={{ flex: 'none', fontSize: 9, padding: '10px 16px', background: '#ff5fd2', color: '#0e1512', border: 'none', borderRadius: 8, cursor: 'pointer', letterSpacing: '.5px', whiteSpace: 'nowrap' }}
                >
                  + ADD SHOWCASE
                </button>
              </div>
            </div>`;

code = code.replace(studentHeaderMatch, studentHeaderReplace);

// 7. Add Settings Edit Form Modal
const settingsFormCode = `
      {/* ═══ Settings Edit Modal (Admin Only) ═══ */}
      {showSettingsForm && isAdmin && (
        <div onClick={() => setShowSettingsForm(false)} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(6,12,9,.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 500, background: 'var(--bg,#12081e)', border: '2px solid var(--gold,#ffd23f)', borderRadius: 14, padding: 'clamp(20px,3vw,32px)', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 className="font-pixel" style={{ fontSize: 12, color: 'var(--gold,#ffd23f)', margin: 0 }}>⚙ EDIT SHOWCASE HEADERS</h3>
              <button onClick={() => setShowSettingsForm(false)} style={{ background: 'none', border: '1.5px solid rgba(255,210,63,.3)', borderRadius: '50%', width: 28, height: 28, color: 'var(--gold,#ffd23f)', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>

            <label style={{ display: 'block', fontFamily: "'DM Mono',monospace", fontSize: 10, color: 'var(--mu,#a493c9)', letterSpacing: '.1em', marginBottom: 6 }}>CONTRIBUTORS TITLE</label>
            <input value={editSettings.contributors_title} onChange={e => setEditSettings(s => ({...s, contributors_title: e.target.value}))} style={{ width: '100%', padding: '10px 12px', fontSize: 14, background: 'var(--pn,#14211b)', border: '1.5px solid var(--ln,#28432f)', borderRadius: 8, color: 'var(--tx,#d6ffe0)', marginBottom: 16, fontFamily: 'inherit' }} />

            <label style={{ display: 'block', fontFamily: "'DM Mono',monospace", fontSize: 10, color: 'var(--mu,#a493c9)', letterSpacing: '.1em', marginBottom: 6 }}>CONTRIBUTORS DESCRIPTION</label>
            <textarea value={editSettings.contributors_description} onChange={e => setEditSettings(s => ({...s, contributors_description: e.target.value}))} rows={3} style={{ width: '100%', padding: '10px 12px', fontSize: 14, background: 'var(--pn,#14211b)', border: '1.5px solid var(--ln,#28432f)', borderRadius: 8, color: 'var(--tx,#d6ffe0)', marginBottom: 16, fontFamily: 'inherit', resize: 'vertical' }} />

            <label style={{ display: 'block', fontFamily: "'DM Mono',monospace", fontSize: 10, color: 'var(--mu,#a493c9)', letterSpacing: '.1em', marginBottom: 6 }}>STUDENT TITLE</label>
            <input value={editSettings.student_title} onChange={e => setEditSettings(s => ({...s, student_title: e.target.value}))} style={{ width: '100%', padding: '10px 12px', fontSize: 14, background: 'var(--pn,#14211b)', border: '1.5px solid var(--ln,#28432f)', borderRadius: 8, color: 'var(--tx,#d6ffe0)', marginBottom: 16, fontFamily: 'inherit' }} />

            <label style={{ display: 'block', fontFamily: "'DM Mono',monospace", fontSize: 10, color: 'var(--mu,#a493c9)', letterSpacing: '.1em', marginBottom: 6 }}>STUDENT DESCRIPTION</label>
            <textarea value={editSettings.student_description} onChange={e => setEditSettings(s => ({...s, student_description: e.target.value}))} rows={3} style={{ width: '100%', padding: '10px 12px', fontSize: 14, background: 'var(--pn,#14211b)', border: '1.5px solid var(--ln,#28432f)', borderRadius: 8, color: 'var(--tx,#d6ffe0)', marginBottom: 16, fontFamily: 'inherit', resize: 'vertical' }} />

            <button
              onClick={handleSaveSettings}
              disabled={savingSettings}
              className="font-pixel"
              style={{ width: '100%', fontSize: 10, padding: '14px 20px', background: savingSettings ? '#4a3a5a' : 'var(--gold,#ffd23f)', color: '#0e1512', border: 'none', borderRadius: 8, cursor: savingSettings ? 'wait' : 'pointer', letterSpacing: '.5px' }}
            >
              {savingSettings ? '⏳ SAVING...' : '💾 SAVE SETTINGS'}
            </button>
          </div>
        </div>
      )}
`;

code = code.replace(
  "      {/* ═══ Preview Modal ═══ */}",
  settingsFormCode + "\n      {/* ═══ Preview Modal ═══ */}"
);

fs.writeFileSync('src/components/workshops/journey/Showcase.tsx', code);
