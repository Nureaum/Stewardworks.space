'use client'

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createQuestion } from '@/app/actions/helpdeskActions';
import toast from 'react-hot-toast';

export default function HelpdeskUI({
  categories: serverCats,
  tags: serverTags,
  faqs: serverFaqs,
  myQuestions: serverMine,
  isAdmin = false
}: {
  categories: any[];
  tags: any[];
  faqs: any[];
  myQuestions: any[];
  isAdmin?: boolean;
}) {
  const [view, setView] = useState<'lounge' | 'classic'>('lounge');
  const [tab, setTab] = useState<'faq' | 'mine'>('faq');
  const [category, setCategory] = useState('All Categories');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [thread, setThread] = useState<any | null>(null);
  const [askOpen, setAskOpen] = useState(false);
  const [list, setList] = useState<'faq' | 'mine' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loungeScale, setLoungeScale] = useState(1);
  const router = useRouter();
  
  // Handle responsive scaling for lounge scene (matches hub page behavior)
  React.useEffect(() => {
    if (view !== 'lounge') return;
    
    const handleResize = () => {
      // Only apply scaling on mobile/tablet (same breakpoint as CSS)
      if (window.innerWidth <= 768) {
        // Calculate scale to fit scene (1180px wide) into viewport
        // Account for top nav and intro text (approximately 180px)
        const availableHeight = window.innerHeight - 180;
        const scaleX = window.innerWidth / 1180;
        const scaleY = availableHeight / 626;
        const scale = Math.min(scaleX, scaleY, 1); // Never scale up, only down
        setLoungeScale(scale);
      } else {
        setLoungeScale(1);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [view]);

  const handleAskSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    try {
      await createQuestion(formData);
      toast.success('Question posted successfully!');
      setAskOpen(false);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || 'Failed to post question');
    } finally {
      setIsSubmitting(false);
    }
  };

  const cats = ['All Categories', ...serverCats.map(c => c.name)];
  const tags = serverTags.map(t => t.name);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const allFaqs = serverFaqs.map(f => ({
    id: f.id,
    category: f.question?.category?.name || 'General',
    title: f.question?.title || 'Question',
    tag: f.question?.tags?.[0]?.tag?.name || 'General',
    answer: f.answer,
    answered: true,
    author: f.question?.author?.full_name || 'Anonymous',
    initial: (f.question?.author?.full_name || 'A')[0].toUpperCase(),
    date: formatDate(f.created_at),
    status: 'Answered',
    body: f.question?.body || ''
  }));

  const filteredFaqs = category === 'All Categories' ? allFaqs : allFaqs.filter(q => q.category === category);
  
  const allMine = serverMine.map(q => ({
    id: q.id,
    title: q.title,
    date: formatDate(q.created_at),
    category: q.category?.name || 'General',
    status: q.is_answered ? 'Answered' : 'Pending',
    tag: q.tags?.[0]?.tag?.name || 'General',
    body: q.body || 'No description provided.',
    author: q.author?.full_name || 'Me',
    initial: (q.author?.full_name || 'M')[0].toUpperCase(),
    answer: q.faqs?.[0]?.answer || 'Awaiting answer from staff.'
  }));
  
  const filteredMine = category === 'All Categories' ? allMine : allMine.filter(m => m.category === category);

  const statusPill = (s: string) => s === 'Answered'
    ? { fontFamily: "'Space Mono',monospace", fontSize: '9.5px', letterSpacing: '.08em', textTransform: 'uppercase' as const, color: '#2E7D46', background: '#E4F0DE', borderRadius: '999px', padding: '5px 11px' }
    : { fontFamily: "'Space Mono',monospace", fontSize: '9.5px', letterSpacing: '.08em', textTransform: 'uppercase' as const, color: '#B07C2F', background: '#F6ECCF', borderRadius: '999px', padding: '5px 11px' };

  const seg = (active: boolean) => active
    ? { border: 'none', cursor: 'pointer', fontFamily: "'Fredoka',sans-serif", fontWeight: 600, fontSize: '14px', padding: '9px 20px', borderRadius: '10px', background: '#B85C3E', color: '#fff' }
    : { border: 'none', cursor: 'pointer', fontFamily: "'Fredoka',sans-serif", fontWeight: 500, fontSize: '14px', padding: '9px 20px', borderRadius: '10px', background: 'transparent', color: '#8A7A63' };

  const catStyle = (active: boolean) => active
    ? { textAlign: 'left' as const, border: 'none', cursor: 'pointer', fontFamily: "'Fredoka',sans-serif", fontWeight: 500, fontSize: '14.5px', padding: '11px 16px', borderRadius: '12px', background: '#B85C3E', color: '#fff' }
    : { textAlign: 'left' as const, border: 'none', cursor: 'pointer', fontFamily: "'Nunito',sans-serif", fontWeight: 600, fontSize: '14.5px', padding: '11px 16px', borderRadius: '12px', background: 'transparent', color: '#6E5E46' };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .helpdesk-wrapper {
          position: relative; min-height: 100vh; font-family: 'Nunito', sans-serif; color: #3B2E20; overflow: hidden; padding: 0 0 100px;
          background: radial-gradient(1200px 640px at 50% -6%, #FCF5E4 0%, #F3E7CD 46%, #EAD8B8 100%);
        }
        .helpdesk-wrapper * { box-sizing: border-box; }
        .helpdesk-wrapper ::selection { background: #B85C3E; color: #fff; }
        @keyframes hdFade { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes hdIn { from { opacity: 0; transform: scale(.97); } to { opacity: 1; transform: scale(1); } }
        .helpdesk-wrapper textarea, .helpdesk-wrapper input, .helpdesk-wrapper select { font-family: 'Nunito', sans-serif; }
        
        .couch-hover { transition: transform .18s ease, filter .18s ease; }
        .couch-hover:hover { transform: translateY(-7px); filter: drop-shadow(0 20px 26px rgba(80,52,20,.3)); }
        
        .concierge-hover { transition: transform .18s ease, filter .18s ease; }
        .concierge-hover:hover { transform: translateX(-50%) translateY(-6px); filter: drop-shadow(0 18px 24px rgba(80,52,20,.28)); }
        
        /* Responsive styles for mobile/tablet */
        @media (max-width: 768px) {
          .helpdesk-wrapper {
            padding: 0 !important;
            min-height: 100vh !important;
          }
          
          .hd-top-nav {
            flex-direction: column !important;
            align-items: stretch !important;
            padding: 16px 20px !important;
            gap: 12px !important;
          }
          
          .hd-view-toggle {
            order: 2 !important;
            width: 100% !important;
            justify-content: center !important;
          }
          
          .hd-back-link {
            order: 1 !important;
          }
          
          .hd-admin-section {
            order: 3 !important;
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 8px !important;
          }
          
          .hd-admin-section > span {
            text-align: center !important;
            font-size: 10px !important;
          }
          
          .hd-lounge-container {
            position: fixed !important;
            inset: 0 !important;
            padding: 0 !important;
            margin: 0 !important;
            max-width: none !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            padding-top: 180px !important;
          }
          
          .hd-lounge-scene-wrapper {
            position: relative !important;
            width: 1180px !important;
            height: 626px !important;
            flex: none !important;
            transform-origin: center center !important;
            overflow: hidden !important;
          }
          
          .hd-lounge-scene-inner {
            transform: none !important;
            transform-origin: top center !important;
            height: 626px !important;
            width: 100% !important;
          }
          
          .hd-lounge-intro {
            position: fixed !important;
            top: 120px !important;
            left: 0 !important;
            right: 0 !important;
            z-index: 10 !important;
            padding: 0 16px !important;
            margin-bottom: 0 !important;
          }
          
          .hd-lounge-intro p {
            font-size: 13px !important;
          }
          
          .hd-lounge-intro > div:first-child {
            padding: 6px 14px !important;
          }
          
          .hd-lounge-intro > div:first-child span:last-child {
            font-size: 10px !important;
          }
        }
        
        @media (max-width: 640px) {
          .helpdesk-wrapper {
            padding: 0 !important;
          }
          
          .hd-top-nav {
            padding: 12px 16px !important;
            gap: 10px !important;
          }
          
          .hd-back-link {
            font-size: 10px !important;
          }
          
          .hd-view-toggle button {
            font-size: 12px !important;
            padding: 7px 16px !important;
          }
          
          .hd-lounge-intro {
            top: 100px !important;
            padding: 0 12px !important;
          }
          
          .hd-lounge-intro > div:first-child span:last-child {
            font-size: 9px !important;
            letter-spacing: 0.12em !important;
          }
          
          .hd-lounge-container {
            padding-top: 160px !important;
          }
          
          .hd-classic-grid {
            grid-template-columns: 1fr !important;
            padding: 0 16px !important;
            gap: 20px !important;
          }
          
          .hd-sidebar {
            position: static !important;
            width: 100% !important;
          }
          
          .hd-classic-header {
            padding: 24px 28px !important;
            flex-direction: column !important;
            align-items: stretch !important;
          }
          
          .hd-classic-header h1 {
            font-size: 28px !important;
          }
          
          .hd-classic-header button {
            width: 100% !important;
            justify-content: center !important;
          }
          
          .hd-classic-content {
            padding: 20px 24px 28px !important;
          }
          
          .hd-classic-tabs {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 12px !important;
          }
          
          .hd-classic-tabs > div:first-child {
            width: 100% !important;
          }
          
          .hd-classic-tabs > div:last-child {
            width: 100% !important;
            justify-content: space-between !important;
          }
          
          .hd-modal-content {
            padding: 20px 20px !important;
            margin: 20px 12px !important;
            max-width: 100% !important;
          }
          
          .hd-modal-header {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 12px !important;
          }
          
          .hd-modal-header h2 {
            font-size: 22px !important;
          }
          
          .hd-thread-container {
            padding: 20px 12px !important;
            max-width: 100% !important;
          }
          
          .hd-thread-card {
            padding: 24px 20px !important;
          }
          
          .hd-thread-card h2 {
            font-size: 24px !important;
          }
          
          .hd-ask-form {
            padding: 24px 24px 24px !important;
            max-width: 100% !important;
            margin: 20px 12px !important;
          }
          
          .hd-ask-form h2 {
            font-size: 24px !important;
          }
        }
      `}} />
      <div className="helpdesk-wrapper">
        <div style={{position:'absolute',top:'-190px',left:'50%',transform:'translateX(-50%)',width:'1300px',height:'820px',pointerEvents:'none',zIndex:0,background:'radial-gradient(ellipse 46% 44% at 50% 32%, rgba(255,241,206,.9) 0%, rgba(255,232,180,.34) 42%, rgba(255,232,180,0) 72%)'}}></div>

        <div className="hd-top-nav" style={{position:'relative',zIndex:2,maxWidth:'1180px',margin:'0 auto',padding:'22px 32px 0',display:'flex',alignItems:'center',justifyContent:'space-between',gap:'16px',flexWrap:'wrap'}}>
          <Link href="/hub" className="hd-back-link" style={{fontFamily:"'Space Mono',monospace",fontSize:'12px',letterSpacing:'.14em',textTransform:'uppercase',color:'#8A6A3E',textDecoration:'none',display:'flex',alignItems:'center',gap:'8px'}}>
            &larr; Back to Hub
          </Link>
          <div className="hd-view-toggle" style={{display:'inline-flex',background:'#F1E7D0',border:'1px solid #E7D6B7',borderRadius:'13px',padding:'4px',gap:'3px',boxShadow:'0 8px 20px -16px rgba(80,52,20,.5)'}}>
            <button onClick={() => setView('lounge')} style={seg(view === 'lounge')}>Lounge</button>
            <button onClick={() => setView('classic')} style={seg(view === 'classic')}>List View</button>
          </div>
          <div className="hd-admin-section" style={{display:'flex',alignItems:'center',gap:'12px'}}>
            <span style={{fontFamily:"'Space Mono',monospace",fontSize:'11px',letterSpacing:'.12em',textTransform:'uppercase',color:'#A38A5E'}}>StewardWorks Members &middot; account required</span>
            {isAdmin && (
              <Link href="/admin/helpdesk" style={{display:'inline-block',background:'#B85C3E',color:'#fff',textDecoration:'none',fontFamily:"'Fredoka',sans-serif",fontWeight:600,fontSize:'13.5px',padding:'6px 14px',borderRadius:'10px',boxShadow:'0 8px 16px -8px rgba(184,92,62,.6)'}}>Admin Settings</Link>
            )}
          </div>
        </div>

        {view === 'classic' && (
          <div>
            <div style={{position:'relative',zIndex:2,maxWidth:'1180px',margin:'20px auto 0',padding:'0 32px'}}>
              <div className="hd-classic-header" style={{background:'linear-gradient(135deg,#FFFBF2 0%,#FBF1DC 100%)',border:'1px solid #E7D6B7',borderRadius:'26px',padding:'34px 38px',display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'24px',flexWrap:'wrap',boxShadow:'0 30px 60px -40px rgba(80,52,20,.5)'}}>
                <div style={{flex:1,minWidth:'260px'}}>
                  <div style={{display:'inline-flex',alignItems:'center',gap:'8px',background:'#F7E7DF',border:'1px solid #EDCFC2',borderRadius:'999px',padding:'6px 14px',marginBottom:'16px'}}>
                    <span style={{width:'7px',height:'7px',borderRadius:'50%',background:'#B85C3E'}}></span>
                    <span style={{fontFamily:"'Space Mono',monospace",fontSize:'10.5px',letterSpacing:'.14em',textTransform:'uppercase',color:'#B85C3E'}}>Help &amp; Support Center</span>
                  </div>
                  <h1 style={{fontFamily:"'Fredoka',sans-serif",fontWeight:600,fontSize:'40px',lineHeight:1.05,margin:'0 0 12px',color:'#33271A'}}>How can we <span style={{color:'#B85C3E'}}>help you</span> today?</h1>
                  <p style={{margin:0,maxWidth:'520px',fontSize:'15.5px',lineHeight:1.55,color:'#7A6A50'}}>Browse frequently asked questions, explore categories, or send a ticket straight to StewardWorks staff and instructors.</p>
                </div>
                <button onClick={() => setAskOpen(true)} style={{flexShrink:0,background:'#B85C3E',color:'#fff',border:'none',cursor:'pointer',fontFamily:"'Fredoka',sans-serif",fontWeight:600,fontSize:'15px',padding:'14px 24px',borderRadius:'15px',display:'flex',alignItems:'center',gap:'9px',boxShadow:'0 14px 30px -14px rgba(184,92,62,.7)'}}>+ Ask a Question</button>
              </div>
            </div>

            <div className="hd-classic-grid" style={{position:'relative',zIndex:2,maxWidth:'1180px',margin:'26px auto 0',padding:'0 32px',display:'grid',gridTemplateColumns:'280px minmax(0,1fr)',gap:'26px',alignItems:'start'}}>
              <div className="hd-sidebar" style={{display:'flex',flexDirection:'column',gap:'18px',position:'sticky',top:'20px'}}>
                <div style={{background:'#FFFBF2',border:'1px solid #E7D6B7',borderRadius:'20px',padding:'20px',boxShadow:'0 20px 44px -34px rgba(80,52,20,.5)'}}>
                  <div style={{fontFamily:"'Space Mono',monospace",fontSize:'11px',letterSpacing:'.14em',textTransform:'uppercase',color:'#A38A5E',marginBottom:'14px'}}>Categories</div>
                  <div style={{display:'flex',flexDirection:'column',gap:'3px'}}>
                    {cats.map(c => (
                      <button key={c} onClick={() => setCategory(c)} style={catStyle(category === c)}>{c}</button>
                    ))}
                  </div>
                </div>
                <div style={{background:'#FFFBF2',border:'1px solid #E7D6B7',borderRadius:'20px',padding:'20px',boxShadow:'0 20px 44px -34px rgba(80,52,20,.5)'}}>
                  <div style={{fontFamily:"'Space Mono',monospace",fontSize:'11px',letterSpacing:'.14em',textTransform:'uppercase',color:'#A38A5E',marginBottom:'14px'}}>Popular Tags</div>
                  <div style={{display:'flex',flexWrap:'wrap',gap:'8px'}}>
                    {tags.map(t => (
                      <span key={t} style={{fontFamily:"'Nunito',sans-serif",fontWeight:600,fontSize:'12.5px',color:'#6E5E46',background:'#F3E7CD',border:'1px solid #E7D6B7',borderRadius:'999px',padding:'6px 12px'}}>#{t}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="hd-classic-content" style={{background:'linear-gradient(180deg,#FFFDF7 0%,#FCF6E7 100%)',border:'1px solid #EBDCC0',borderRadius:'24px',padding:'26px 30px 34px',boxShadow:'0 34px 70px -44px rgba(80,52,20,.55)',color:'#3B2E20'}}>
                <div className="hd-classic-tabs" style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'16px',flexWrap:'wrap',marginBottom:'26px'}}>
                  <div style={{display:'inline-flex',background:'#F1E7D0',borderRadius:'14px',padding:'4px',gap:'3px'}}>
                    <button onClick={() => setTab('faq')} style={seg(tab === 'faq')}>Frequently Asked</button>
                    <button onClick={() => setTab('mine')} style={seg(tab === 'mine')}>My Questions</button>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:'9px'}}>
                    <span style={{fontFamily:"'Space Mono',monospace",fontSize:'10px',letterSpacing:'.12em',textTransform:'uppercase',color:'#A38A5E'}}>Filter</span>
                    <div style={{position:'relative'}}>
                      <select value={category} onChange={(e) => setCategory(e.target.value)} style={{appearance:'none',WebkitAppearance:'none',background:'#FFFBF2',border:'1px solid #E4D3B2',borderRadius:'11px',padding:'10px 38px 10px 15px',fontSize:'13.5px',fontWeight:600,color:'#3B2E20',cursor:'pointer',outline:'none',boxShadow:'0 8px 20px -16px rgba(80,52,20,.5)'}}>
                        {cats.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <span style={{position:'absolute',right:'14px',top:'50%',transform:'translateY(-50%)',pointerEvents:'none',color:'#B07C2F',fontSize:'11px'}}>&#9660;</span>
                    </div>
                  </div>
                </div>

                {tab === 'faq' && (
                  <div>
                    <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'20px'}}>
                      <span style={{width:'38px',height:'38px',borderRadius:'11px',background:'#F0E1B8',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'17px',color:'#B07C2F'}}>&#9733;</span>
                      <h2 style={{fontFamily:"'Fredoka',sans-serif",fontWeight:600,fontSize:'24px',margin:0,color:'#33271A'}}>Frequently Asked Questions</h2>
                    </div>
                    <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
                      {filteredFaqs.map((q, i) => (
                        <div key={q.id} style={{background:'#fff',border:'1px solid #ECE0C8',borderRadius:'16px',overflow:'hidden',boxShadow:'0 12px 28px -24px rgba(80,52,20,.5)'}}>
                          <button onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{width:'100%',border:'none',background:'none',cursor:'pointer',padding:'18px 20px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:'14px',textAlign:'left'}}>
                            <span style={{display:'flex',alignItems:'center',gap:'12px'}}>
                              <span style={{fontFamily:"'Space Mono',monospace",fontSize:'9.5px',letterSpacing:'.08em',textTransform:'uppercase',color:'#B85C3E',background:'#F7E7DF',borderRadius:'6px',padding:'4px 8px'}}>{q.category}</span>
                              <span style={{fontFamily:"'Fredoka',sans-serif",fontWeight:500,fontSize:'16px',color:'#33271A'}}>{q.title}</span>
                            </span>
                            <span style={{color:'#B07C2F',fontSize:'14px'}}>{openFaq === i ? '\u25B4' : '\u25BE'}</span>
                          </button>
                          {openFaq === i && (
                            <div style={{padding:'0 20px 20px'}}>
                              <div style={{borderTop:'1px solid #F0E6D0',paddingTop:'16px'}}>
                                <div style={{fontFamily:"'Space Mono',monospace",fontSize:'9.5px',letterSpacing:'.1em',textTransform:'uppercase',color:'#B85C3E',fontWeight:700,marginBottom:'8px'}}>Official Answer</div>
                                <p style={{margin:0,fontSize:'14.5px',lineHeight:1.6,color:'#5E4E36'}}>{q.answer}</p>
                                <a href="#" onClick={(e) => { e.preventDefault(); setThread(q); setList(null); }} style={{display:'inline-block',marginTop:'14px',fontFamily:"'Fredoka',sans-serif",fontWeight:500,fontSize:'13px',color:'#B85C3E',textDecoration:'none'}}>Open full thread &rarr;</a>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {tab === 'mine' && (
                  <div>
                    <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'20px'}}>
                      <span style={{width:'38px',height:'38px',borderRadius:'11px',background:'#E4D8C0',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'17px'}}>&#128172;</span>
                      <h2 style={{fontFamily:"'Fredoka',sans-serif",fontWeight:600,fontSize:'24px',margin:0,color:'#33271A'}}>My Questions</h2>
                    </div>
                    {filteredMine.length > 0 ? (
                      <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
                        {filteredMine.map(m => (
                          <button key={m.id} onClick={() => { setThread(m); setList(null); }} style={{textAlign:'left',width:'100%',background:'#fff',border:'1px solid #ECE0C8',borderRadius:'16px',cursor:'pointer',padding:'18px 20px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:'14px',boxShadow:'0 12px 28px -24px rgba(80,52,20,.5)'}}>
                            <span>
                              <span style={{display:'block',fontFamily:"'Fredoka',sans-serif",fontWeight:500,fontSize:'16px',color:'#33271A',marginBottom:'6px'}}>{m.title}</span>
                              <span style={{fontFamily:"'Space Mono',monospace",fontSize:'10px',letterSpacing:'.06em',textTransform:'uppercase',color:'#A38A5E'}}>{m.date} &middot; {m.category}</span>
                            </span>
                            <span style={statusPill(m.status)}>{m.status}</span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div style={{border:'1.5px dashed #E1D2B4',borderRadius:'18px',padding:'48px 24px',textAlign:'center'}}>
                        <div style={{width:'56px',height:'56px',borderRadius:'50%',background:'#F3E7CD',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px',fontSize:'22px'}}>&#128172;</div>
                        <div style={{fontFamily:"'Fredoka',sans-serif",fontWeight:600,fontSize:'19px',color:'#33271A',marginBottom:'6px'}}>No questions found</div>
                        <p style={{margin:'0 auto 20px',maxWidth:'340px',fontSize:'14px',lineHeight:1.5,color:'#8A7A63'}}>You haven't asked any questions matching these filters yet. Need help? Don't hesitate to ask!</p>
                        <button onClick={() => setAskOpen(true)} style={{background:'#B85C3E',color:'#fff',border:'none',cursor:'pointer',fontFamily:"'Fredoka',sans-serif",fontWeight:600,fontSize:'14px',padding:'12px 24px',borderRadius:'12px'}}>Ask a Question</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}


        {view === 'lounge' && (
          <div className="hd-lounge-container" style={{position:'relative',zIndex:2,maxWidth:'1180px',margin:'22px auto 0',padding:'0 32px'}}>
            <div className="hd-lounge-intro" style={{textAlign:'center',marginBottom:'16px'}}>
              <div style={{display:'inline-flex',alignItems:'center',gap:'9px',background:'#FFFBF2',border:'1px solid #E7D6B7',borderRadius:'999px',padding:'7px 16px'}}>
                <span style={{width:'8px',height:'8px',borderRadius:'50%',background:'#B85C3E'}}></span>
                <span style={{fontFamily:"'Space Mono',monospace",fontSize:'11px',letterSpacing:'.14em',textTransform:'uppercase',color:'#B07C2F',fontWeight:700}}>Help &amp; Support Lounge</span>
              </div>
              <p style={{margin:'10px 0 0',fontSize:'14.5px',color:'#8A7A63'}}>Make yourself comfortable. Settle onto a couch to browse, or step up to the concierge to ask.</p>
            </div>

            <div className="hd-lounge-scene-wrapper" style={{position:'relative',width:'100%',borderRadius:'30px',overflow:'hidden',border:'1px solid #E0CDA9',boxShadow:'0 44px 90px -48px rgba(80,52,20,.65), inset 0 0 0 1px rgba(255,255,255,.45)',transform:`scale(${loungeScale})`,transformOrigin:'center center'}}>
              <div className="hd-lounge-scene-inner" style={{position:'relative',width:'100%',height:'626px',transform:'scale(1)',transformOrigin:'top center'}}>
              <div style={{position:'absolute',top:0,left:0,right:0,height:'376px',background:'linear-gradient(180deg,#F6ECD3 0%,#EFE1C2 100%)'}}></div>
              <div style={{position:'absolute',top:'-130px',left:'50%',transform:'translateX(-50%)',width:'860px',height:'540px',background:'radial-gradient(ellipse 50% 50% at 50% 42%, rgba(255,244,214,.9), rgba(255,244,214,0) 70%)',pointerEvents:'none'}}></div>
              <div style={{position:'absolute',top:'366px',left:0,right:0,height:'12px',background:'#E3D1AC',boxShadow:'0 2px 6px rgba(80,52,20,.12)'}}></div>
              <div style={{position:'absolute',bottom:0,left:0,right:0,height:'250px',background:'linear-gradient(180deg,#D7B98C 0%,#C29B69 100%)'}}></div>
              <div style={{position:'absolute',bottom:0,left:0,right:0,height:'250px',pointerEvents:'none',background:'repeating-linear-gradient(92deg, rgba(94,63,38,.05) 0 2px, rgba(94,63,38,0) 2px 78px)'}}></div>

              <div style={{position:'absolute',top:'48px',left:'74px',width:'186px',height:'148px',background:'#8A5A34',borderRadius:'12px',padding:'9px',boxShadow:'0 16px 28px -18px rgba(80,52,20,.6)'}}>
                <div style={{position:'relative',width:'100%',height:'100%',background:'linear-gradient(180deg,#BFE3EA 0%,#DCEFDC 100%)',borderRadius:'5px',overflow:'hidden'}}>
                  <div style={{position:'absolute',top:'16px',right:'20px',width:'34px',height:'34px',borderRadius:'50%',background:'#F4D57C',boxShadow:'0 0 22px 7px rgba(244,213,124,.6)'}}></div>
                  <div style={{position:'absolute',left:'42px',bottom:'24px',width:'62px',height:'24px',borderRadius:'14px',background:'rgba(255,255,255,.72)'}}></div>
                  <div style={{position:'absolute',left:'82px',bottom:'34px',width:'52px',height:'20px',borderRadius:'12px',background:'rgba(255,255,255,.55)'}}></div>
                  <div style={{position:'absolute',top:0,bottom:0,left:'50%',width:'6px',transform:'translateX(-50%)',background:'#8A5A34'}}></div>
                  <div style={{position:'absolute',left:0,right:0,top:'50%',height:'6px',transform:'translateY(-50%)',background:'#8A5A34'}}></div>
                </div>
              </div>

              <div style={{position:'absolute',top:'62px',right:'104px',width:'64px',height:'64px',borderRadius:'50%',background:'#FFFBF2',border:'4px solid #C79A3C',boxShadow:'0 12px 22px -16px rgba(80,52,20,.6)'}}>
                <div style={{position:'absolute',top:'50%',left:'50%',width:'5px',height:'5px',borderRadius:'50%',background:'#33271A',transform:'translate(-50%,-50%)'}}></div>
                <div style={{position:'absolute',top:'50%',left:'50%',width:'3px',height:'16px',background:'#33271A',borderRadius:'3px',transformOrigin:'bottom center',transform:'translate(-50%,-100%) rotate(38deg)'}}></div>
                <div style={{position:'absolute',top:'50%',left:'50%',width:'3px',height:'22px',background:'#B85C3E',borderRadius:'3px',transformOrigin:'bottom center',transform:'translate(-50%,-100%) rotate(-66deg)'}}></div>
              </div>

              <div style={{position:'absolute',top:'30px',left:'50%',transform:'translateX(-50%)',textAlign:'center'}}>
                <div style={{display:'flex',justifyContent:'space-between',width:'150px',margin:'0 auto'}}>
                  <div style={{width:'2px',height:'18px',background:'#B49A6E'}}></div>
                  <div style={{width:'2px',height:'18px',background:'#B49A6E'}}></div>
                </div>
                <div style={{background:'#33271A',borderRadius:'12px',padding:'10px 26px',boxShadow:'0 14px 26px -16px rgba(80,52,20,.7)',marginTop:'-2px'}}>
                  <span style={{fontFamily:"'Fredoka',sans-serif",fontWeight:600,fontSize:'15px',color:'#E4CF9E',letterSpacing:'.03em'}}>Welcome &mdash; take a seat</span>
                </div>
              </div>

              <div style={{position:'absolute',bottom:'18px',left:'50%',transform:'translateX(-50%)',width:'620px',height:'156px',background:'#E7D2A6',borderRadius:'50%',boxShadow:'inset 0 0 0 10px rgba(255,255,255,.22)'}}></div>
              <div style={{position:'absolute',bottom:'42px',left:'50%',transform:'translateX(-50%)',width:'470px',height:'108px',border:'8px solid rgba(184,92,62,.16)',borderRadius:'50%'}}></div>

              <div style={{position:'absolute',bottom:'150px',left:'6px',width:'120px',height:'150px'}}>
                <div style={{position:'absolute',bottom:'34px',left:'30px',width:'58px',height:'52px',borderRadius:'50%',background:'#7C9A52'}}></div>
                <div style={{position:'absolute',bottom:'60px',left:'8px',width:'44px',height:'60px',borderRadius:'50% 50% 50% 50%',background:'#6E8C46',transform:'rotate(-26deg)'}}></div>
                <div style={{position:'absolute',bottom:'60px',right:'8px',width:'44px',height:'62px',borderRadius:'50%',background:'#84A45C',transform:'rotate(24deg)'}}></div>
                <div style={{position:'absolute',bottom:'78px',left:'34px',width:'40px',height:'66px',borderRadius:'50%',background:'#7C9A52'}}></div>
                <div style={{position:'absolute',bottom:0,left:'34px',width:'52px',height:'44px',background:'#B85C3E',borderRadius:'6px 6px 16px 16px'}}></div>
              </div>

              <div style={{position:'absolute',bottom:'150px',right:'14px',width:'110px',height:'210px'}}>
                <div style={{position:'absolute',top:'-4px',left:'50%',transform:'translateX(-50%)',width:'96px',height:'96px',borderRadius:'50%',background:'radial-gradient(circle, rgba(244,213,124,.5), rgba(244,213,124,0) 68%)'}}></div>
                <div style={{position:'absolute',top:'10px',left:'50%',transform:'translateX(-50%)',width:'78px',height:'52px',background:'linear-gradient(180deg,#F0DEA6,#E0C579)',borderRadius:'10px 10px 6px 6px',clipPath:'polygon(14% 0,86% 0,100% 100%,0 100%)'}}></div>
                <div style={{position:'absolute',top:'60px',left:'50%',transform:'translateX(-50%)',width:'6px',height:'120px',background:'#8A6A3E'}}></div>
                <div style={{position:'absolute',bottom:0,left:'50%',transform:'translateX(-50%)',width:'60px',height:'16px',borderRadius:'50%',background:'#6E4A2C'}}></div>
              </div>

              <button className="concierge-hover" onClick={() => setAskOpen(true)} style={{position:'absolute',top:'206px',left:'50%',transform:'translateX(-50%)',width:'300px',height:'190px',background:'none',border:'none',padding:0,cursor:'pointer'}}>
                <div style={{position:'absolute',top:'-6px',left:'50%',transform:'translateX(-50%)',zIndex:8,whiteSpace:'nowrap',background:'#B85C3E',borderRadius:'999px',padding:'7px 17px',boxShadow:'0 12px 24px -12px rgba(184,92,62,.85)',textAlign:'center'}}>
                  <span style={{display:'block',fontFamily:"'Space Mono',monospace",fontSize:'9px',letterSpacing:'.14em',textTransform:'uppercase',color:'#F7D9CC'}}>The Concierge</span>
                  <span style={{display:'block',fontFamily:"'Fredoka',sans-serif",fontWeight:600,fontSize:'14px',color:'#fff',marginTop:'1px'}}>Ask a question</span>
                </div>
                <div style={{position:'absolute',bottom:'72px',left:'50%',transform:'translateX(-50%)',width:'54px',height:'54px',borderRadius:'50%',background:'#E4CF9E',border:'3px solid #D8BE86',zIndex:1}}></div>
                <div style={{position:'absolute',bottom:'36px',left:'50%',transform:'translateX(-50%)',width:'116px',height:'70px',borderRadius:'44px 44px 0 0',background:'#33271A',zIndex:2}}></div>
                <div style={{position:'absolute',bottom:0,left:'8px',right:'8px',height:'76px',background:'linear-gradient(180deg,#9A6638,#7E5028)',borderRadius:'12px',zIndex:3,boxShadow:'0 18px 30px -18px rgba(80,52,20,.7)'}}></div>
                <div style={{position:'absolute',bottom:'14px',left:'36px',width:'70px',height:'48px',border:'2px solid rgba(255,255,255,.13)',borderRadius:'8px',zIndex:4}}></div>
                <div style={{position:'absolute',bottom:'14px',right:'36px',width:'70px',height:'48px',border:'2px solid rgba(255,255,255,.13)',borderRadius:'8px',zIndex:4}}></div>
                <div style={{position:'absolute',bottom:'72px',left:0,right:0,height:'20px',background:'#F3E7CD',borderRadius:'8px',zIndex:5,boxShadow:'0 8px 16px -10px rgba(80,52,20,.55)'}}></div>
                <div style={{position:'absolute',bottom:'90px',left:'62%',width:'28px',height:'15px',borderRadius:'16px 16px 0 0',background:'#C79A3C',zIndex:6}}></div>
                <div style={{position:'absolute',bottom:'104px',left:'calc(62% + 12px)',width:'6px',height:'6px',borderRadius:'50%',background:'#C79A3C',zIndex:6}}></div>
                <div style={{position:'absolute',bottom:'88px',left:'60%',width:'34px',height:'5px',borderRadius:'3px',background:'#B07C2F',zIndex:6}}></div>
              </button>

              <div style={{position:'absolute',bottom:'44px',left:'50%',transform:'translateX(-50%)',width:'168px',height:'56px'}}>
                <div style={{position:'absolute',bottom:0,left:'26px',width:'6px',height:'26px',background:'#6E4A2C',borderRadius:'3px'}}></div>
                <div style={{position:'absolute',bottom:0,right:'26px',width:'6px',height:'26px',background:'#6E4A2C',borderRadius:'3px'}}></div>
                <div style={{position:'absolute',bottom:'20px',left:0,width:'168px',height:'26px',borderRadius:'50%',background:'linear-gradient(180deg,#B27C46,#95632F)',boxShadow:'0 12px 20px -14px rgba(80,52,20,.6)'}}></div>
                <div style={{position:'absolute',bottom:'30px',left:'44px',width:'44px',height:'14px',borderRadius:'4px',background:'#C79A3C',transform:'rotate(-6deg)'}}></div>
                <div style={{position:'absolute',bottom:'32px',left:'82px',width:'44px',height:'14px',borderRadius:'4px',background:'#B85C3E',transform:'rotate(5deg)'}}></div>
              </div>

              <button className="couch-hover" onClick={() => setList('faq')} style={{position:'absolute',bottom:'96px',left:'44px',width:'322px',height:'190px',background:'none',border:'none',padding:0,cursor:'pointer'}}>
                <div style={{position:'absolute',top:'-10px',left:'50%',transform:'translateX(-50%)',zIndex:8,whiteSpace:'nowrap',background:'#FFFBF2',border:'1px solid #E7D6B7',borderRadius:'999px',padding:'7px 16px',boxShadow:'0 12px 24px -14px rgba(80,52,20,.55)',textAlign:'center'}}>
                  <span style={{display:'block',fontFamily:"'Space Mono',monospace",fontSize:'9px',letterSpacing:'.14em',textTransform:'uppercase',color:'#B07C2F'}}>The FAQ Couch</span>
                  <span style={{display:'block',fontFamily:"'Fredoka',sans-serif",fontWeight:600,fontSize:'14px',color:'#33271A',marginTop:'1px'}}>Frequently Asked</span>
                </div>
                <div style={{position:'absolute',bottom:'2px',left:'16px',right:'16px',height:'26px',background:'radial-gradient(ellipse at center, rgba(80,52,20,.32), rgba(80,52,20,0) 72%)'}}></div>
                <div style={{position:'absolute',bottom:'6px',left:'46px',width:'16px',height:'22px',background:'#5E3F26',borderRadius:'0 0 5px 5px'}}></div>
                <div style={{position:'absolute',bottom:'6px',right:'46px',width:'16px',height:'22px',background:'#5E3F26',borderRadius:'0 0 5px 5px'}}></div>
                <div style={{position:'absolute',bottom:'66px',left:'42px',right:'42px',height:'80px',background:'#C6A25A',borderRadius:'26px 26px 12px 12px'}}></div>
                <div style={{position:'absolute',bottom:'78px',left:'58px',width:'96px',height:'62px',background:'#E7D3A0',borderRadius:'20px',transform:'rotate(-3deg)',boxShadow:'inset 0 -6px 0 rgba(0,0,0,.05)'}}></div>
                <div style={{position:'absolute',bottom:'78px',right:'58px',width:'96px',height:'62px',background:'#E7D3A0',borderRadius:'20px',transform:'rotate(3deg)',boxShadow:'inset 0 -6px 0 rgba(0,0,0,.05)'}}></div>
                <div style={{position:'absolute',bottom:'24px',left:'6px',right:'6px',height:'58px',background:'#B58A3E',borderRadius:'22px'}}></div>
                <div style={{position:'absolute',bottom:'52px',left:'46px',width:'106px',height:'34px',background:'#DFC684',borderRadius:'14px'}}></div>
                <div style={{position:'absolute',bottom:'52px',right:'46px',width:'106px',height:'34px',background:'#DFC684',borderRadius:'14px'}}></div>
                <div style={{position:'absolute',bottom:'24px',left:0,width:'42px',height:'96px',background:'#B58A3E',borderRadius:'20px',boxShadow:'inset -6px 0 0 rgba(0,0,0,.05)'}}></div>
                <div style={{position:'absolute',bottom:'24px',right:0,width:'42px',height:'96px',background:'#B58A3E',borderRadius:'20px',boxShadow:'inset 6px 0 0 rgba(0,0,0,.05)'}}></div>
              </button>

              <button className="couch-hover" onClick={() => setList('mine')} style={{position:'absolute',bottom:'96px',right:'44px',width:'322px',height:'190px',background:'none',border:'none',padding:0,cursor:'pointer'}}>
                <div style={{position:'absolute',top:'-10px',left:'50%',transform:'translateX(-50%)',zIndex:8,whiteSpace:'nowrap',background:'#FFFBF2',border:'1px solid #EDCFC2',borderRadius:'999px',padding:'7px 16px',boxShadow:'0 12px 24px -14px rgba(80,52,20,.55)',textAlign:'center'}}>
                  <span style={{display:'block',fontFamily:"'Space Mono',monospace",fontSize:'9px',letterSpacing:'.14em',textTransform:'uppercase',color:'#B85C3E'}}>The My-Questions Couch</span>
                  <span style={{display:'block',fontFamily:"'Fredoka',sans-serif",fontWeight:600,fontSize:'14px',color:'#33271A',marginTop:'1px'}}>My Questions</span>
                </div>
                <div style={{position:'absolute',bottom:'2px',left:'16px',right:'16px',height:'26px',background:'radial-gradient(ellipse at center, rgba(80,52,20,.32), rgba(80,52,20,0) 72%)'}}></div>
                <div style={{position:'absolute',bottom:'6px',left:'46px',width:'16px',height:'22px',background:'#5E3F26',borderRadius:'0 0 5px 5px'}}></div>
                <div style={{position:'absolute',bottom:'6px',right:'46px',width:'16px',height:'22px',background:'#5E3F26',borderRadius:'0 0 5px 5px'}}></div>
                <div style={{position:'absolute',bottom:'66px',left:'42px',right:'42px',height:'80px',background:'#C67C5B',borderRadius:'26px 26px 12px 12px'}}></div>
                <div style={{position:'absolute',bottom:'78px',left:'58px',width:'96px',height:'62px',background:'#EBC5AE',borderRadius:'20px',transform:'rotate(-3deg)',boxShadow:'inset 0 -6px 0 rgba(0,0,0,.05)'}}></div>
                <div style={{position:'absolute',bottom:'78px',right:'58px',width:'96px',height:'62px',background:'#EBC5AE',borderRadius:'20px',transform:'rotate(3deg)',boxShadow:'inset 0 -6px 0 rgba(0,0,0,.05)'}}></div>
                <div style={{position:'absolute',bottom:'24px',left:'6px',right:'6px',height:'58px',background:'#B0603F',borderRadius:'22px'}}></div>
                <div style={{position:'absolute',bottom:'52px',left:'46px',width:'106px',height:'34px',background:'#E0A98C',borderRadius:'14px'}}></div>
                <div style={{position:'absolute',bottom:'52px',right:'46px',width:'106px',height:'34px',background:'#E0A98C',borderRadius:'14px'}}></div>
                <div style={{position:'absolute',bottom:'24px',left:0,width:'42px',height:'96px',background:'#B0603F',borderRadius:'20px',boxShadow:'inset -6px 0 0 rgba(0,0,0,.06)'}}></div>
                <div style={{position:'absolute',bottom:'24px',right:0,width:'42px',height:'96px',background:'#B0603F',borderRadius:'20px',boxShadow:'inset 6px 0 0 rgba(0,0,0,.06)'}}></div>
              </button>

              <div className="hd-scene-instruction" style={{position:'absolute',bottom:'16px',left:'24px',fontFamily:"'Space Mono',monospace",fontSize:'10px',letterSpacing:'.1em',textTransform:'uppercase',color:'#8A6A3E',background:'rgba(255,251,242,.72)',border:'1px solid #E7D6B7',borderRadius:'999px',padding:'6px 13px'}}>Tap a couch or the concierge</div>
              </div>
            </div>
          </div>
        )}

        {list && (
          <div style={{position:'fixed',inset:0,zIndex:52,background:'rgba(45,30,12,.72)',backdropFilter:'blur(5px)',display:'flex',justifyContent:'center',overflowY:'auto',padding:'40px 20px'}}>
            <div className="hd-modal-content" style={{maxWidth:'820px',width:'100%',height:'fit-content',background:'linear-gradient(180deg,#FFFDF7,#FCF6E7)',borderRadius:'24px',padding:'26px 30px 32px',color:'#3B2E20',animation:'hdIn .3s ease both',boxShadow:'0 40px 90px -34px rgba(0,0,0,.7)',borderTop:'5px solid #B85C3E'}}>
              <div className="hd-modal-header" style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'16px',marginBottom:'20px'}}>
                <div style={{display:'flex',alignItems:'center',gap:'14px'}}>
                  <span style={{width:'44px',height:'44px',borderRadius:'13px',background:'#F0E1B8',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'19px',color:'#B07C2F'}}>{list === 'mine' ? '\u{1F4AC}' : '\u2605'}</span>
                  <div>
                    <div style={{fontFamily:"'Space Mono',monospace",fontSize:'10px',letterSpacing:'.12em',textTransform:'uppercase',color:'#B85C3E',marginBottom:'4px'}}>{list === 'mine' ? 'Your open threads' : 'Curated by StewardWorks staff'}</div>
                    <h2 style={{fontFamily:"'Fredoka',sans-serif",fontWeight:600,fontSize:'25px',margin:0,color:'#33271A'}}>{list === 'mine' ? 'My Questions' : 'Frequently Asked Questions'}</h2>
                  </div>
                </div>
                <button onClick={() => setList(null)} style={{flexShrink:0,width:'38px',height:'38px',borderRadius:'50%',border:'1px solid #E7D6B7',background:'#FFFBF2',color:'#8A6A3E',fontSize:'15px',cursor:'pointer',lineHeight:1}}>&#10005;</button>
              </div>

              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'14px',flexWrap:'wrap',marginBottom:'22px'}}>
                <div style={{display:'inline-flex',background:'#F1E7D0',borderRadius:'13px',padding:'4px',gap:'3px'}}>
                  <button onClick={() => setList('faq')} style={seg(list === 'faq')}>Frequently Asked</button>
                  <button onClick={() => setList('mine')} style={seg(list === 'mine')}>My Questions</button>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:'9px'}}>
                  <span style={{fontFamily:"'Space Mono',monospace",fontSize:'10px',letterSpacing:'.12em',textTransform:'uppercase',color:'#A38A5E'}}>Filter</span>
                  <div style={{position:'relative'}}>
                    <select value={category} onChange={(e) => {setCategory(e.target.value); setOpenFaq(null);}} style={{appearance:'none',WebkitAppearance:'none',background:'#FFFBF2',border:'1px solid #E4D3B2',borderRadius:'11px',padding:'10px 38px 10px 15px',fontSize:'13.5px',fontWeight:600,color:'#3B2E20',cursor:'pointer',outline:'none'}}>
                      {cats.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <span style={{position:'absolute',right:'14px',top:'50%',transform:'translateY(-50%)',pointerEvents:'none',color:'#B07C2F',fontSize:'11px'}}>&#9660;</span>
                  </div>
                </div>
              </div>

              {list === 'faq' && (
                <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
                  {filteredFaqs.map((q, i) => (
                    <div key={q.id} style={{background:'#fff',border:'1px solid #ECE0C8',borderRadius:'16px',overflow:'hidden',boxShadow:'0 12px 28px -24px rgba(80,52,20,.5)'}}>
                      <button onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{width:'100%',border:'none',background:'none',cursor:'pointer',padding:'18px 20px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:'14px',textAlign:'left'}}>
                        <span style={{display:'flex',alignItems:'center',gap:'12px'}}>
                          <span style={{fontFamily:"'Space Mono',monospace",fontSize:'9.5px',letterSpacing:'.08em',textTransform:'uppercase',color:'#B85C3E',background:'#F7E7DF',borderRadius:'6px',padding:'4px 8px'}}>{q.category}</span>
                          <span style={{fontFamily:"'Fredoka',sans-serif",fontWeight:500,fontSize:'16px',color:'#33271A'}}>{q.title}</span>
                        </span>
                        <span style={{color:'#B07C2F',fontSize:'14px'}}>{openFaq === i ? '\u25B4' : '\u25BE'}</span>
                      </button>
                      {openFaq === i && (
                        <div style={{padding:'0 20px 20px'}}>
                          <div style={{borderTop:'1px solid #F0E6D0',paddingTop:'16px'}}>
                            <div style={{fontFamily:"'Space Mono',monospace",fontSize:'9.5px',letterSpacing:'.1em',textTransform:'uppercase',color:'#B85C3E',fontWeight:700,marginBottom:'8px'}}>Official Answer</div>
                            <p style={{margin:0,fontSize:'14.5px',lineHeight:1.6,color:'#5E4E36'}}>{q.answer}</p>
                            <a href="#" onClick={(e) => { e.preventDefault(); setThread(q); setList(null); }} style={{display:'inline-block',marginTop:'14px',fontFamily:"'Fredoka',sans-serif",fontWeight:500,fontSize:'13px',color:'#B85C3E',textDecoration:'none'}}>Open full thread &rarr;</a>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {list === 'mine' && (
                filteredMine.length > 0 ? (
                  <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
                    {filteredMine.map(m => (
                      <button key={m.id} onClick={() => { setThread(m); setList(null); }} style={{textAlign:'left',width:'100%',background:'#fff',border:'1px solid #ECE0C8',borderRadius:'16px',cursor:'pointer',padding:'18px 20px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:'14px',boxShadow:'0 12px 28px -24px rgba(80,52,20,.5)'}}>
                        <span>
                          <span style={{display:'block',fontFamily:"'Fredoka',sans-serif",fontWeight:500,fontSize:'16px',color:'#33271A',marginBottom:'6px'}}>{m.title}</span>
                          <span style={{fontFamily:"'Space Mono',monospace",fontSize:'10px',letterSpacing:'.06em',textTransform:'uppercase',color:'#A38A5E'}}>{m.date} &middot; {m.category}</span>
                        </span>
                        <span style={statusPill(m.status)}>{m.status}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div style={{border:'1.5px dashed #E1D2B4',borderRadius:'18px',padding:'48px 24px',textAlign:'center'}}>
                    <div style={{width:'56px',height:'56px',borderRadius:'50%',background:'#F3E7CD',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px',fontSize:'22px'}}>&#128172;</div>
                    <div style={{fontFamily:"'Fredoka',sans-serif",fontWeight:600,fontSize:'19px',color:'#33271A',marginBottom:'6px'}}>No questions found</div>
                    <p style={{margin:'0 auto 20px',maxWidth:'340px',fontSize:'14px',lineHeight:1.5,color:'#8A7A63'}}>You haven't asked any questions matching these filters yet. Step up to the concierge to ask!</p>
                    <button onClick={() => setAskOpen(true)} style={{background:'#B85C3E',color:'#fff',border:'none',cursor:'pointer',fontFamily:"'Fredoka',sans-serif",fontWeight:600,fontSize:'14px',padding:'12px 24px',borderRadius:'12px'}}>Ask a Question</button>
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {thread && (
          <div style={{position:'fixed',inset:0,zIndex:50,background:'rgba(45,30,12,.72)',backdropFilter:'blur(5px)',display:'flex',justifyContent:'center',overflowY:'auto',padding:'40px 20px'}}>
            <div className="hd-thread-container" style={{maxWidth:'760px',width:'100%',animation:'hdIn .3s ease both'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'16px'}}>
                <button onClick={() => setThread(null)} style={{background:'rgba(255,255,255,.14)',border:'1px solid rgba(255,255,255,.2)',color:'#FBF1DA',cursor:'pointer',fontFamily:"'Space Mono',monospace",fontSize:'11px',letterSpacing:'.1em',textTransform:'uppercase',padding:'9px 16px',borderRadius:'999px'}}>&larr; Back to Help Desk</button>
              </div>
              <div className="hd-thread-card" style={{background:'linear-gradient(180deg,#FFFDF7,#FCF6E7)',borderRadius:'22px',padding:'30px 32px',color:'#3B2E20',boxShadow:'0 30px 70px -30px rgba(0,0,0,.6)',position:'relative',overflow:'hidden'}}>
                <div style={{position:'absolute',top:0,left:0,right:0,height:'4px',background:'linear-gradient(90deg,#B85C3E,#C79A3C)'}}></div>
                <div style={{display:'flex',gap:'10px',marginBottom:'18px',flexWrap:'wrap'}}>
                  <span style={{fontFamily:"'Space Mono',monospace",fontSize:'10px',letterSpacing:'.08em',textTransform:'uppercase',color:'#B07C2F',background:'#F6ECCF',borderRadius:'8px',padding:'5px 11px'}}>{thread.category}</span>
                  <span style={{fontFamily:"'Space Mono',monospace",fontSize:'10px',letterSpacing:'.08em',textTransform:'uppercase',color:'#B85C3E',background:'#F7E7DF',borderRadius:'8px',padding:'5px 11px'}}>{thread.status}</span>
                  <span style={{fontFamily:"'Space Mono',monospace",fontSize:'10px',letterSpacing:'.08em',textTransform:'uppercase',color:'#5E4E36',background:'#EFE6D2',borderRadius:'8px',padding:'5px 11px'}}>#{thread.tag}</span>
                </div>
                <h2 style={{fontFamily:"'Fredoka',sans-serif",fontWeight:600,fontSize:'30px',lineHeight:1.1,margin:'0 0 16px',color:'#33271A'}}>{thread.title}</h2>
                <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'22px'}}>
                  <span style={{width:'34px',height:'34px',borderRadius:'50%',background:'#33271A',color:'#E4CF9E',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Fredoka',sans-serif",fontWeight:600,fontSize:'15px'}}>{thread.initial}</span>
                  <span style={{fontFamily:"'Fredoka',sans-serif",fontWeight:500,fontSize:'14px',color:'#33271A'}}>{thread.author}</span>
                  <span style={{color:'#C9BF9E'}}>&middot;</span>
                  <span style={{fontSize:'13px',color:'#A38A5E'}}>{thread.date}</span>
                </div>
                <div style={{background:'#FBF3E0',borderLeft:'4px solid #C79A3C',borderRadius:'0 14px 14px 0',padding:'18px 22px'}}>
                  <div style={{fontFamily:"'Space Mono',monospace",fontSize:'9.5px',letterSpacing:'.1em',textTransform:'uppercase',color:'#B07C2F',fontWeight:700,marginBottom:'8px'}}>Detailed Description</div>
                  <p style={{margin:0,fontSize:'15px',lineHeight:1.6,color:'#5E4E36'}}>{thread.body}</p>
                </div>
              </div>
              <div style={{background:'#fff',borderRadius:'22px',padding:'28px 32px',marginTop:'18px',boxShadow:'0 24px 60px -32px rgba(0,0,0,.5)',borderLeft:'5px solid #B85C3E',color:'#3B2E20'}}>
                <div style={{fontFamily:"'Space Mono',monospace",fontSize:'10.5px',letterSpacing:'.12em',textTransform:'uppercase',color:'#B85C3E',fontWeight:700,marginBottom:'14px',display:'flex',alignItems:'center',gap:'8px'}}>&#9733; Official Answer</div>
                {thread.answered || thread.status === 'Answered' ? (
                  <>
                    <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'14px'}}>
                      <span style={{width:'32px',height:'32px',borderRadius:'50%',background:'#B85C3E',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Fredoka',sans-serif",fontWeight:600,fontSize:'13px'}}>S</span>
                      <span style={{fontFamily:"'Fredoka',sans-serif",fontWeight:500,fontSize:'14px'}}>StewardWorks Staff</span>
                      <span style={{fontFamily:"'Space Mono',monospace",fontSize:'10px',letterSpacing:'.06em',textTransform:'uppercase',color:'#A38A5E'}}>Instructor</span>
                    </div>
                    <p style={{margin:0,fontSize:'15px',lineHeight:1.65,color:'#4E4230'}}>{thread.answer}</p>
                  </>
                ) : (
                  <p style={{margin:0,fontSize:'15px',lineHeight:1.65,color:'#4E4230',fontStyle:'italic'}}>Waiting for an official answer.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {askOpen && (
          <div style={{position:'fixed',inset:0,zIndex:55,background:'rgba(45,30,12,.74)',backdropFilter:'blur(5px)',display:'flex',justifyContent:'center',overflowY:'auto',padding:'40px 20px'}}>
            <form onSubmit={handleAskSubmit} className="hd-ask-form" style={{maxWidth:'640px',width:'100%',background:'#fff',borderRadius:'24px',padding:'32px 34px 30px',color:'#3B2E20',animation:'hdIn .3s ease both',boxShadow:'0 40px 90px -34px rgba(0,0,0,.7)',height:'fit-content'}}>
              <h2 style={{fontFamily:"'Fredoka',sans-serif",fontWeight:600,fontSize:'28px',margin:'0 0 6px',color:'#33271A'}}>Ask a Question</h2>
              <p style={{margin:'0 0 24px',fontSize:'14.5px',color:'#7A6A50'}}>Get help from staff and instructors. Provide as much detail as possible.</p>
              <label htmlFor="title" style={{display:'block',fontFamily:"'Nunito',sans-serif",fontWeight:700,fontSize:'13.5px',color:'#4E4230',marginBottom:'8px'}}>Question Title</label>
              <input name="title" required placeholder="e.g. How do I format my resume for ATS?" style={{width:'100%',border:'1px solid #E4D8C0',borderRadius:'13px',padding:'13px 15px',fontSize:'14.5px',color:'#3B2E20',background:'#FCF9EF',outline:'none',marginBottom:'18px'}} />
              <label htmlFor="category_id" style={{display:'block',fontFamily:"'Nunito',sans-serif",fontWeight:700,fontSize:'13.5px',color:'#4E4230',marginBottom:'8px'}}>Category</label>
              <div style={{position:'relative',marginBottom:'18px'}}>
                <select name="category_id" required style={{width:'100%',appearance:'none',WebkitAppearance:'none',border:'1px solid #E4D8C0',borderRadius:'13px',padding:'13px 40px 13px 15px',fontSize:'14.5px',color:'#3B2E20',background:'#FCF9EF',outline:'none',cursor:'pointer'}}>
                  <option value="">Select a category...</option>
                  {serverCats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <span style={{position:'absolute',right:'15px',top:'50%',transform:'translateY(-50%)',pointerEvents:'none',color:'#B07C2F',fontSize:'11px'}}>&#9660;</span>
              </div>
              <label style={{display:'block',fontFamily:"'Nunito',sans-serif",fontWeight:700,fontSize:'13.5px',color:'#4E4230',marginBottom:'10px'}}>Tags (optional)</label>
              <div style={{display:'flex',flexWrap:'wrap',gap:'8px',marginBottom:'20px'}}>
                {serverTags.map(t => (
                  <label key={t.id} style={{display:'flex',alignItems:'center',gap:'7px',border:'1px solid #E4D8C0',borderRadius:'10px',padding:'8px 12px',fontSize:'13px',color:'#5E4E36',cursor:'pointer'}}>
                    <input type="checkbox" name="tags" value={t.id} style={{accentColor:'#B85C3E'}} />{t.name}
                  </label>
                ))}
              </div>
              <label htmlFor="description" style={{display:'block',fontFamily:"'Nunito',sans-serif",fontWeight:700,fontSize:'13.5px',color:'#4E4230',marginBottom:'8px'}}>Details</label>
              <textarea name="description" required placeholder="Provide all the details needed to answer your question..." style={{width:'100%',minHeight:'130px',resize:'vertical',border:'1px solid #E4D8C0',borderRadius:'14px',padding:'14px 16px',fontSize:'14.5px',lineHeight:1.55,color:'#3B2E20',background:'#FCF9EF',outline:'none',marginBottom:'24px'}}></textarea>
              <div style={{display:'flex',alignItems:'center',justifyContent:'flex-end',gap:'12px',borderTop:'1px solid #F0E6D0',paddingTop:'20px'}}>
                <button type="button" onClick={() => setAskOpen(false)} style={{background:'#F3EAD6',color:'#5E4E36',border:'none',cursor:'pointer',fontFamily:"'Fredoka',sans-serif",fontWeight:500,fontSize:'14.5px',padding:'12px 22px',borderRadius:'13px'}}>Cancel</button>
                <button type="submit" disabled={isSubmitting} style={{background:'#B85C3E',color:'#fff',border:'none',cursor:'pointer',fontFamily:"'Fredoka',sans-serif",fontWeight:600,fontSize:'14.5px',padding:'12px 26px',borderRadius:'13px',boxShadow:'0 12px 24px -12px rgba(184,92,62,.7)', opacity: isSubmitting ? 0.7 : 1}}>{isSubmitting ? 'Posting...' : 'Post Question'}</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </>
  );
}
