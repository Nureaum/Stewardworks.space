const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'app', 'hub', 'my-profile', 'ClientProfile.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// The new unified Bookmarks section
const newBookmarksSection = `        {/* ======================= */}
        {/* SAVED RESOURCES SECTION */}
        {/* ======================= */}
        <div style={{ background: '#F5ECE3', border: '1.5px solid rgba(138,90,46,.15)', borderRadius: '16px', padding: '24px', marginBottom: '40px' }}>
          
          {/* HEADER & LEGEND */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h2 style={{ fontFamily: '"DM Mono", monospace', fontSize: '16px', letterSpacing: '.15em', color: '#3a2412', margin: '0 0 6px 0', fontWeight: 700 }}>SAVED RESOURCES</h2>
              <p style={{ fontSize: '13px', color: '#7a5a3a', margin: 0 }}>All your bookmarks collected from across the StewardWorks hub.</p>
            </div>
            
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', background: 'rgba(255,255,255,0.5)', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(138,90,46,.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#417C98' }}></span>
                <span style={{ fontSize: '10px', color: '#3a2412', fontFamily: '"DM Mono", monospace', fontWeight: 600 }}>LIBRARY</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#A27532' }}></span>
                <span style={{ fontSize: '10px', color: '#3a2412', fontFamily: '"DM Mono", monospace', fontWeight: 600 }}>WORKSHOPS</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#2E5534' }}></span>
                <span style={{ fontSize: '10px', color: '#3a2412', fontFamily: '"DM Mono", monospace', fontWeight: 600 }}>WORKFORCE</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#ff6a2e' }}></span>
                <span style={{ fontSize: '10px', color: '#3a2412', fontFamily: '"DM Mono", monospace', fontWeight: 600 }}>JOBS</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#4B8B9B' }}></span>
                <span style={{ fontSize: '10px', color: '#3a2412', fontFamily: '"DM Mono", monospace', fontWeight: 600 }}>FIELD NOTES</span>
              </div>
            </div>
          </div>

          {isFetchingResources ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#8a6a4a' }}>Loading your shelf...</div>
          ) : (bookmarkedResources.length === 0 && workshopBookmarks.length === 0 && bookmarkedWorkforce.length === 0 && bookmarkedJobs.length === 0 && bookmarkedEnvironmental.length === 0) ? (
            <div style={{ padding: '30px', textAlign: 'center', color: '#8a6a4a', background: 'rgba(255,255,255,0.4)', border: '1.5px dashed rgba(138,90,46,.15)', borderRadius: '13px' }}>
              No saved resources yet. Explore the hub and bookmark content to build your personal repository!
            </div>
          ) : (
            <>
              {/* 1. LIBRARY */}
              {bookmarkedResources.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '11px', letterSpacing: '.15em', color: '#417C98', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    STEWARD LIBRARY <span style={{ background: 'rgba(65,124,152,.1)', padding: '2px 6px', borderRadius: '4px', fontSize: '9px' }}>{bookmarkedResources.length}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: '12px' }}>
                    {bookmarkedResources.map(b => (
                      <div key={b.id} className="hover:-translate-y-1 hover:shadow-lg transition-all" style={{ background: '#EBF4F8', border: '1.5px solid rgba(65,124,152,.2)', borderRadius: '13px', padding: '15px 16px', boxShadow: '0 4px 12px rgba(0,0,0,.04)', cursor: 'pointer' }} onClick={(e) => handleExternalLink(e, { url: \`/hub/library/\${b.id}\`, title: b.title, source: domain(b.external_url || b.url), type: 'BOOKMARK', tag: 'BM' })}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
                          <span style={{ display: 'inline-block', fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.14em', background: '#417C98', color: '#fff', padding: '3px 8px', borderRadius: '20px' }}>LIBRARY</span>
                          {b.bookmarkStatus === 'pending' && <span style={{ display: 'inline-block', fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.14em', background: '#ffd23f', color: '#3a2412', padding: '3px 8px', borderRadius: '20px' }}>PENDING</span>}
                          {b.bookmarkStatus === 'approved' && <span style={{ display: 'inline-block', fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.14em', background: '#74f0a0', color: '#1a3a1e', padding: '3px 8px', borderRadius: '20px' }}>✓ APPROVED</span>}
                          {b.bookmarkStatus === 'rejected' && <span style={{ display: 'inline-block', fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.14em', background: '#ff8a4a', color: '#fff', padding: '3px 8px', borderRadius: '20px' }}>✕ REJECTED</span>}
                        </div>
                        <div style={{ fontWeight: 700, color: '#2a4a5a', fontSize: '15px', lineHeight: 1.3, cursor: 'pointer' }}>{b.title}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '7px' }}>
                          <span style={{ fontSize: '12px', color: '#5a8a9a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>{domain(b.external_url || b.url)}</span>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            {b.reviewNote && (
                              <button onClick={(e) => { e.stopPropagation(); setExpandedNoteId(expandedNoteId === b.id ? null : b.id); }} style={{ background: expandedNoteId === b.id ? '#417C98' : '#DDEAF0', border: '1.5px solid #417C98', fontFamily: '"DM Mono", monospace', fontSize: '10px', fontWeight: 700, color: expandedNoteId === b.id ? '#fff' : '#417C98', cursor: 'pointer', padding: '5px 10px', borderRadius: '6px', letterSpacing: '.06em' }}>
                                {expandedNoteId === b.id ? '✕ NOTE' : '📝 NOTE'}
                              </button>
                            )}
                            <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '11px', color: '#417C98' }}>Open →</span>
                          </div>
                        </div>
                        {expandedNoteId === b.id && b.reviewNote && (
                          <div style={{ marginTop: '10px', padding: '10px', background: 'rgba(65,124,152,.08)', border: '1px solid rgba(65,124,152,.2)', borderRadius: '8px' }}>
                            <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.1em', color: '#417C98', marginBottom: '5px' }}>ADMIN NOTE</div>
                            <div style={{ fontSize: '13px', lineHeight: 1.4, color: '#2a4a5a' }}>{b.reviewNote}</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. WORKSHOPS */}
              {workshopBookmarks.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '11px', letterSpacing: '.15em', color: '#A27532', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    WORKSHOPS <span style={{ background: 'rgba(162,117,50,.1)', padding: '2px 6px', borderRadius: '4px', fontSize: '9px' }}>{workshopBookmarks.length}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: '12px' }}>
                    {workshopBookmarks.map(b => (
                      <div key={b.id} className="hover:-translate-y-1 hover:shadow-lg transition-all" style={{ background: '#FDF8ED', border: '1.5px solid rgba(162,117,50,.2)', borderRadius: '13px', padding: '15px 16px', boxShadow: '0 4px 12px rgba(0,0,0,.04)', cursor: 'pointer' }} onClick={(e) => handleExternalLink(e, { title: b.title, url: b.url, source: b.source, type: 'WORKSHOP BOOKMARK', tag: 'WB' })}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
                          <span style={{ display: 'inline-block', fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.14em', background: '#A27532', color: '#fff', padding: '3px 8px', borderRadius: '20px' }}>WORKSHOP</span>
                          {b.status === 'pending' && <span style={{ display: 'inline-block', fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.14em', background: '#ffd23f', color: '#3a2412', padding: '3px 8px', borderRadius: '20px' }}>PENDING</span>}
                          {b.status === 'approved' && <span style={{ display: 'inline-block', fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.14em', background: '#74f0a0', color: '#1a3a1e', padding: '3px 8px', borderRadius: '20px' }}>✓ APPROVED</span>}
                          {b.status === 'rejected' && <span style={{ display: 'inline-block', fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.14em', background: '#ff8a4a', color: '#fff', padding: '3px 8px', borderRadius: '20px' }}>✕ REJECTED</span>}
                        </div>
                        <div style={{ fontWeight: 700, color: '#4a3a2a', fontSize: '15px', lineHeight: 1.3, marginBottom: '8px' }}>{b.title}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '7px' }}>
                          <span style={{ fontSize: '11px', color: '#A27532' }}>🔖 {b.source}</span>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            {b.reviewNote && (
                              <button onClick={(e) => { e.stopPropagation(); setExpandedNoteId(expandedNoteId === b.id ? null : b.id); }} style={{ background: expandedNoteId === b.id ? '#A27532' : '#F6ECD9', border: '1.5px solid #A27532', fontFamily: '"DM Mono", monospace', fontSize: '10px', fontWeight: 700, color: expandedNoteId === b.id ? '#fff' : '#A27532', cursor: 'pointer', padding: '5px 10px', borderRadius: '6px', letterSpacing: '.06em' }}>
                                {expandedNoteId === b.id ? '✕ NOTE' : '📝 NOTE'}
                              </button>
                            )}
                          </div>
                        </div>
                        {expandedNoteId === b.id && b.reviewNote && (
                          <div style={{ marginTop: '10px', padding: '10px', background: 'rgba(162,117,50,.08)', border: '1px solid rgba(162,117,50,.2)', borderRadius: '8px' }}>
                            <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.1em', color: '#A27532', marginBottom: '5px' }}>ADMIN NOTE</div>
                            <div style={{ fontSize: '13px', lineHeight: 1.4, color: '#4a3a2a' }}>{b.reviewNote}</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. WORKFORCE PATHWAYS */}
              {bookmarkedWorkforce.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '11px', letterSpacing: '.15em', color: '#2E5534', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    WORKFORCE PATHWAYS <span style={{ background: 'rgba(46,85,52,.1)', padding: '2px 6px', borderRadius: '4px', fontSize: '9px' }}>{bookmarkedWorkforce.length}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: '12px' }}>
                    {bookmarkedWorkforce.map(b => (
                      <div key={b.id} className="hover:-translate-y-1 hover:shadow-lg transition-all" style={{ background: '#EAF2EB', border: '1.5px solid rgba(46,85,52,.2)', borderRadius: '13px', padding: '15px 16px', boxShadow: '0 4px 12px rgba(0,0,0,.04)', cursor: 'pointer' }} onClick={(e) => handleExternalLink(e, { url: \`/hub/workforce-pathways\`, title: b.title, source: domain(b.url) + (b.source ? \` - \${b.source}\` : ''), type: 'VAULT', tag: 'VT' })}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
                          <span style={{ display: 'inline-block', fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.14em', background: '#2E5534', color: '#fff', padding: '3px 8px', borderRadius: '20px' }}>VAULT</span>
                          {b.bookmarkStatus === 'pending' && <span style={{ display: 'inline-block', fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.14em', background: '#ffd23f', color: '#3a2412', padding: '3px 8px', borderRadius: '20px' }}>PENDING</span>}
                          {b.bookmarkStatus === 'approved' && <span style={{ display: 'inline-block', fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.14em', background: '#74f0a0', color: '#1a3a1e', padding: '3px 8px', borderRadius: '20px' }}>✓ APPROVED</span>}
                          {b.bookmarkStatus === 'rejected' && <span style={{ display: 'inline-block', fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.14em', background: '#ff8a4a', color: '#fff', padding: '3px 8px', borderRadius: '20px' }}>✕ REJECTED</span>}
                        </div>
                        <div style={{ fontWeight: 700, color: '#1a2a1a', fontSize: '15px', lineHeight: 1.3 }}>{b.title}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '7px' }}>
                          <span style={{ fontSize: '12px', color: '#3a5a4a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>{domain(b.url)} {b.source ? \`- \${b.source}\` : ''}</span>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            {b.reviewNote && (
                              <button onClick={(e) => { e.stopPropagation(); setExpandedNoteId(expandedNoteId === b.id ? null : b.id); }} style={{ background: expandedNoteId === b.id ? '#2E5534' : '#DDF0E1', border: '1.5px solid #2E5534', fontFamily: '"DM Mono", monospace', fontSize: '10px', fontWeight: 700, color: expandedNoteId === b.id ? '#fff' : '#2E5534', cursor: 'pointer', padding: '5px 10px', borderRadius: '6px', letterSpacing: '.06em' }}>
                                {expandedNoteId === b.id ? '✕ NOTE' : '📝 NOTE'}
                              </button>
                            )}
                            <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '11px', color: '#2E5534' }}>View →</span>
                          </div>
                        </div>
                        {expandedNoteId === b.id && b.reviewNote && (
                          <div style={{ marginTop: '10px', padding: '10px', background: 'rgba(46,85,52,.08)', border: '1px solid rgba(46,85,52,.2)', borderRadius: '8px' }}>
                            <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.1em', color: '#2E5534', marginBottom: '5px' }}>ADMIN NOTE</div>
                            <div style={{ fontSize: '13px', lineHeight: 1.4, color: '#1a2a1a' }}>{b.reviewNote}</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. JOBS QUEST */}
              {bookmarkedJobs.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '11px', letterSpacing: '.15em', color: '#ff6a2e', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    JOBS QUEST <span style={{ background: 'rgba(255,106,46,.1)', padding: '2px 6px', borderRadius: '4px', fontSize: '9px' }}>{bookmarkedJobs.length}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: '12px' }}>
                    {bookmarkedJobs.map(b => (
                      <div key={b.id} className="hover:-translate-y-1 hover:shadow-lg transition-all" style={{ background: '#FFF0E6', border: '1.5px solid rgba(255,106,46,.2)', borderRadius: '13px', padding: '15px 16px', boxShadow: '0 4px 12px rgba(0,0,0,.04)', cursor: 'pointer' }} onClick={(e) => handleExternalLink(e, { url: b.url, title: b.title.replace(/^Job:\\s*/, ''), source: b.source || domain(b.url), type: 'JOB', tag: 'JB' })}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
                          <span style={{ display: 'inline-block', fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.14em', background: '#ff6a2e', color: '#fff', padding: '3px 8px', borderRadius: '20px' }}>JOB</span>
                          {b.bookmarkStatus === 'pending' && <span style={{ display: 'inline-block', fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.14em', background: '#ffd23f', color: '#3a2412', padding: '3px 8px', borderRadius: '20px' }}>PENDING</span>}
                          {b.bookmarkStatus === 'approved' && <span style={{ display: 'inline-block', fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.14em', background: '#74f0a0', color: '#1a3a1e', padding: '3px 8px', borderRadius: '20px' }}>✓ APPROVED</span>}
                          {b.bookmarkStatus === 'rejected' && <span style={{ display: 'inline-block', fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.14em', background: '#ff8a4a', color: '#fff', padding: '3px 8px', borderRadius: '20px' }}>✕ REJECTED</span>}
                        </div>
                        <div style={{ fontWeight: 700, color: '#4a2a1a', fontSize: '15px', lineHeight: 1.3 }}>{b.title.replace(/^Job:\\s*/, '')}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '7px' }}>
                          <span style={{ fontSize: '12px', color: '#8a4a2a' }}>{b.source}</span>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            {b.reviewNote && (
                              <button onClick={(e) => { e.stopPropagation(); setExpandedNoteId(expandedNoteId === b.id ? null : b.id); }} style={{ background: expandedNoteId === b.id ? '#ff6a2e' : '#FFE0CC', border: '1.5px solid #ff6a2e', fontFamily: '"DM Mono", monospace', fontSize: '10px', fontWeight: 700, color: expandedNoteId === b.id ? '#fff' : '#ff6a2e', cursor: 'pointer', padding: '5px 10px', borderRadius: '6px', letterSpacing: '.06em' }}>
                                {expandedNoteId === b.id ? '✕ NOTE' : '📝 NOTE'}
                              </button>
                            )}
                            {b.url && <a href={b.url} onClick={(e) => handleExternalLink(e, { url: b.url, title: b.title.replace(/^Job:\\s*/, ''), source: b.source || domain(b.url), type: 'JOB', tag: 'JB' })} style={{ fontFamily: '"DM Mono", monospace', fontSize: '11px', color: '#ff6a2e', textDecoration: 'none' }}>Apply →</a>}
                          </div>
                        </div>
                        {expandedNoteId === b.id && b.reviewNote && (
                          <div style={{ marginTop: '10px', padding: '10px', background: 'rgba(255,106,46,.08)', border: '1px solid rgba(255,106,46,.2)', borderRadius: '8px' }}>
                            <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.1em', color: '#ff6a2e', marginBottom: '5px' }}>ADMIN NOTE</div>
                            <div style={{ fontSize: '13px', lineHeight: 1.4, color: '#4a2a1a' }}>{b.reviewNote}</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. FIELD NOTES */}
              {bookmarkedEnvironmental.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '11px', letterSpacing: '.15em', color: '#4B8B9B', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    FIELD NOTES <span style={{ background: 'rgba(75,139,155,.1)', padding: '2px 6px', borderRadius: '4px', fontSize: '9px' }}>{bookmarkedEnvironmental.length}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: '12px' }}>
                    {bookmarkedEnvironmental.map(b => (
                      <div key={b.id} className="hover:-translate-y-1 hover:shadow-lg transition-all" style={{ background: '#EAF3F5', border: '1.5px solid rgba(75,139,155,.2)', borderRadius: '13px', padding: '15px 16px', boxShadow: '0 4px 12px rgba(0,0,0,.04)', cursor: 'pointer' }} onClick={(e) => handleExternalLink(e, { url: '/hub/environmental-literacy', title: b.title, source: b.source || 'Environmental Literacy', type: 'FIELD NOTE', tag: 'FN' })}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
                          <span style={{ display: 'inline-block', fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.14em', background: '#4B8B9B', color: '#fff', padding: '3px 8px', borderRadius: '20px' }}>FIELD NOTE</span>
                          {b.bookmarkStatus === 'pending' && <span style={{ display: 'inline-block', fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.14em', background: '#ffd23f', color: '#3a2412', padding: '3px 8px', borderRadius: '20px' }}>PENDING</span>}
                          {b.bookmarkStatus === 'approved' && <span style={{ display: 'inline-block', fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.14em', background: '#74f0a0', color: '#1a3a1e', padding: '3px 8px', borderRadius: '20px' }}>✓ APPROVED</span>}
                          {b.bookmarkStatus === 'rejected' && <span style={{ display: 'inline-block', fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.14em', background: '#ff8a4a', color: '#fff', padding: '3px 8px', borderRadius: '20px' }}>✕ REJECTED</span>}
                        </div>
                        <div style={{ fontWeight: 700, color: '#1a3a4a', fontSize: '15px', lineHeight: 1.3 }}>{b.title}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '7px' }}>
                          <span style={{ fontSize: '12px', color: '#3a6a7a' }}>{b.source}</span>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            {b.reviewNote && (
                              <button onClick={(e) => { e.stopPropagation(); setExpandedNoteId(expandedNoteId === b.id ? null : b.id); }} style={{ background: expandedNoteId === b.id ? '#4B8B9B' : '#D6E9EE', border: '1.5px solid #4B8B9B', fontFamily: '"DM Mono", monospace', fontSize: '10px', fontWeight: 700, color: expandedNoteId === b.id ? '#fff' : '#4B8B9B', cursor: 'pointer', padding: '5px 10px', borderRadius: '6px', letterSpacing: '.06em' }}>
                                {expandedNoteId === b.id ? '✕ NOTE' : '📝 NOTE'}
                              </button>
                            )}
                            <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '11px', color: '#4B8B9B' }}>Open →</span>
                          </div>
                        </div>
                        {expandedNoteId === b.id && b.reviewNote && (
                          <div style={{ marginTop: '10px', padding: '10px', background: 'rgba(75,139,155,.08)', border: '1px solid rgba(75,139,155,.2)', borderRadius: '8px' }}>
                            <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.1em', color: '#4B8B9B', marginBottom: '5px' }}>ADMIN NOTE</div>
                            <div style={{ fontSize: '13px', lineHeight: 1.4, color: '#1a3a4a' }}>{b.reviewNote}</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>`;

// Replace from {/* BOOKMARKS */} down to just before {/* GENERATIONS */}
const startIdx = content.indexOf('{/* BOOKMARKS */}');
const endIdx = content.indexOf('{/* GENERATIONS */}');

if (startIdx === -1 || endIdx === -1) {
  console.error("Could not find delimiters for bookmarks chunk.");
  process.exit(1);
}

let modifiedContent = content.slice(0, startIdx) + newBookmarksSection + "\\n\\n        " + content.slice(endIdx);

// Now fix the "NOTES, SAVED PROMPTS & BOOKMARKS" section
// Change header back to NOTES & SAVED PROMPTS
modifiedContent = modifiedContent.replace(
  /{notes.length \+ prompts.length \+ workshopBookmarks.length}/g,
  '{notes.length + prompts.length}'
);

modifiedContent = modifiedContent.replace(
  />NOTES, SAVED PROMPTS & BOOKMARKS</g,
  '>NOTES & SAVED PROMPTS<'
);

// Remove the workshopBookmarks map block
const workshopBookmarksStart = modifiedContent.indexOf('{/* Workshop Bookmarks */}');
const notesStart = modifiedContent.indexOf('{/* Notes */}');

if (workshopBookmarksStart !== -1 && notesStart !== -1) {
  modifiedContent = modifiedContent.slice(0, workshopBookmarksStart) + modifiedContent.slice(notesStart);
} else {
  console.log("Could not remove old workshopBookmarks block from notes section.");
}

// Write back to file
fs.writeFileSync(filePath, modifiedContent, 'utf8');
console.log("Successfully rewrote ClientProfile.tsx");
