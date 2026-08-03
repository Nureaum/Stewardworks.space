'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';

type BulletinUpdate = {
  id: string;
  tag: string;
  title: string;
  body: string;
  detail: string;
  cta_label: string;
  link_url?: string;
  image_url?: string;
  created_at: string;
};

type BulletinEvent = {
  id: string;
  badge: string;
  title: string;
  event_date: string;
  event_time: string;
  location: string;
  image_url?: string;
  created_at: string;
};

export default function BulletinUI({ updates, events }: { updates: BulletinUpdate[], events: BulletinEvent[] }) {
  const { userId } = useAuth();
  const [selectedUpdate, setSelectedUpdate] = useState(null as BulletinUpdate | null);
  const [selectedEvent, setSelectedEvent] = useState(null as BulletinEvent | null);

  const utilts = ['-.5deg', '.5deg', '-.4deg', '.5deg'];
  const etilts = ['-.7deg', '.6deg', '-.5deg'];
  const papers = ['#F6DE97', '#F3D9C4', '#E9E1B4'];

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="bulletin-wrapper">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes bulFade {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes lbIn {
          from { opacity: 0; transform: scale(.96); }
          to { opacity: 1; transform: scale(1); }
        }
        .bulletin-container {
          position: relative;
          min-height: 100vh;
          font-family: 'Nunito', sans-serif;
          color: #3B2E20;
          overflow: hidden;
          padding: 0 0 100px;
          background: radial-gradient(1200px 620px at 50% -8%, #FCF5E4 0%, #F3E7CD 46%, #EAD8B8 100%);
        }
        .bulletin-content {
          position: relative;
          z-index: 1;
          max-width: 1180px;
          margin: 0 auto;
          padding: 0 32px;
        }
        .bulletin-top-strip {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
          padding: 22px 0 6px;
        }
        .bulletin-h1 {
          font-family: 'Fredoka', sans-serif;
          font-weight: 600;
          font-size: 50px;
          line-height: 1;
          margin: 0 0 12px;
          letter-spacing: -.01em;
          color: #33271A;
        }
        .bulletin-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 26px;
          align-items: start;
          margin-top: 36px;
        }
        .bulletin-popup-inner {
          max-width: 520px;
          width: 100%;
          position: relative;
          background: #FFFDF7;
          border: 1px solid #ECDFC6;
          border-radius: 16px;
          padding: 30px 30px 28px;
          box-shadow: 0 40px 90px -30px rgba(0,0,0,.7);
          animation: lbIn .28s ease both;
        }
        .bulletin-flyer-inner {
          max-width: 600px;
          width: 100%;
          animation: lbIn .28s ease both;
        }
        @media (max-width: 768px) {
          .bulletin-content { padding: 0 16px; }
          .bulletin-grid { grid-template-columns: 1fr; margin-top: 24px; }
          .bulletin-h1 { font-size: 40px; }
          .bulletin-top-strip { justify-content: flex-start; gap: 8px; padding: 16px 0 12px; }
          .bulletin-popup-inner { padding: 24px 20px 20px; }
        }
      `}} />
      
      <div className="bulletin-container">
        {/* Warm overhead spotlight */}
        <div style={{ position: 'absolute', top: '-200px', left: '50%', transform: 'translateX(-50%)', width: '1300px', height: '840px', pointerEvents: 'none', zIndex: 0, background: 'radial-gradient(ellipse 48% 44% at 50% 32%, rgba(255,241,206,.85) 0%, rgba(255,232,180,.35) 42%, rgba(255,232,180,0) 72%)' }}></div>

        <div className="bulletin-content">
          {/* Top strip */}
          <div className="bulletin-top-strip">
            <Link href="/" style={{ fontFamily: "'Space Mono', monospace", fontSize: '12px', letterSpacing: '.14em', textTransform: 'uppercase', color: '#8A6A3E', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
              &larr; Back Home
            </Link>
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '11px', letterSpacing: '.12em', textTransform: 'uppercase', color: '#A38A5E' }}>Public notice board &middot; no login required</span>
          </div>

          {/* Header */}
          <div style={{ textAlign: 'center', padding: '24px 0 8px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '9px', background: '#FFFBF2', border: '1px solid #E7D6B7', borderRadius: '999px', padding: '7px 16px', marginBottom: '16px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#B85C3E' }}></span>
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '11px', letterSpacing: '.16em', textTransform: 'uppercase', color: '#B07C2F', fontWeight: 700 }}>Imperial Valley &middot; StewardWorks</span>
            </div>
            <h1 className="bulletin-h1">Project Bulletin</h1>
            <p style={{ maxWidth: '560px', margin: '0 auto', fontSize: '16px', lineHeight: 1.55, color: '#7A6A50' }}>The latest updates from across StewardWorks, plus community events you can join &mdash; all in one place.</p>
          </div>

          {/* Two clearly delineated columns */}
          <div className="bulletin-grid">
            
            {/* COLUMN 1: PROJECT UPDATES */}
            <section style={{ background: '#FBF4E4', border: '1px solid #E9DABD', borderRadius: '26px', padding: '8px 8px 26px', boxShadow: '0 30px 60px -40px rgba(80,52,20,.55)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '13px', padding: '20px 22px 18px', borderBottom: '1px solid #ECDDC0', marginBottom: '22px' }}>
                <span style={{ width: '44px', height: '44px', borderRadius: '13px', background: '#EFE0BE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ width: '15px', height: '18px', borderRadius: '2px 2px 3px 3px', background: 'linear-gradient(160deg,#C79A3C,#B07C2F)', boxShadow: 'inset 0 -3px 0 rgba(0,0,0,.12)' }}></span>
                </span>
                <div>
                  <h2 style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: '23px', margin: 0, color: '#33271A' }}>Project Updates</h2>
                  <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', letterSpacing: '.12em', textTransform: 'uppercase', color: '#A38A5E' }}>Pinned notes from the team</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '0 22px' }}>
                {updates.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#A38A5E', fontSize: '14px', padding: '20px' }}>No updates posted yet.</div>
                ) : (
                  updates.map((u, i) => (
                    <article key={u.id} style={{ position: 'relative', background: '#FFFDF7', border: '1px solid #ECDFC6', borderRadius: '12px', padding: '22px 22px 20px', boxShadow: '0 16px 34px -26px rgba(80,52,20,.6)', animation: 'bulFade .5s ease both', transform: `rotate(${utilts[i % utilts.length]})` }}>
                      <span style={{ position: 'absolute', top: '-9px', left: '24px', width: '70px', height: '22px', borderRadius: '3px', background: 'linear-gradient(150deg, rgba(184,92,62,.42), rgba(184,92,62,.24))', border: '1px solid rgba(184,92,62,.18)', transform: 'rotate(-4deg)' }}></span>
                      <span style={{ display: 'inline-block', fontFamily: "'Space Mono', monospace", fontSize: '9.5px', letterSpacing: '.1em', textTransform: 'uppercase', color: '#B85C3E', background: '#F7E7DF', borderRadius: '999px', padding: '5px 11px', marginBottom: '12px' }}>{u.tag}</span>
                      <h3 style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: '19px', lineHeight: 1.2, margin: '0 0 8px', color: '#2E2416' }}>{u.title}</h3>
                      {u.image_url && <img src={u.image_url} alt={u.title} style={{ width: '100%', height: 'auto', borderRadius: '8px', marginBottom: '14px', objectFit: 'cover' }} />}
                      <p style={{ margin: '0 0 14px', fontSize: '14px', lineHeight: 1.55, color: '#6E5E46' }}>{u.body}</p>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                        <button onClick={() => setSelectedUpdate(u)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: '13.5px', color: '#B85C3E' }}>{u.cta_label || 'Learn more'} &rarr;</button>
                        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: '#A99A7C' }}>{formatDate(u.created_at)}</span>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>

            {/* COLUMN 2: UPCOMING EVENTS */}
            <section style={{ background: 'linear-gradient(180deg,#F1E3C4 0%,#EAD9B4 100%)', border: '1px solid #DFCCA5', borderRadius: '26px', padding: '8px 8px 30px', boxShadow: '0 30px 60px -40px rgba(80,52,20,.6)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '13px', padding: '20px 22px 18px', borderBottom: '1px solid rgba(140,110,60,.22)', marginBottom: '24px' }}>
                <span style={{ width: '44px', height: '44px', borderRadius: '13px', background: '#E4CF9E', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '19px' }}>&#128197;</span>
                <div>
                  <h2 style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: '23px', margin: 0, color: '#33271A' }}>Upcoming Events</h2>
                  <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', letterSpacing: '.12em', textTransform: 'uppercase', color: '#977E4E' }}>Flyers &middot; tap to enlarge</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '0 22px' }}>
                {events.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#977E4E', fontSize: '14px', padding: '20px' }}>No upcoming events.</div>
                ) : (
                  events.map((ev, i) => (
                    <article key={ev.id} style={{ position: 'relative', background: papers[i % papers.length], borderRadius: '3px', padding: '16px 16px 18px', boxShadow: '0 22px 44px -26px rgba(70,45,15,.7)', animation: 'bulFade .5s ease both', transform: `rotate(${etilts[i % etilts.length]})` }}>
                      <span style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', width: '19px', height: '19px', borderRadius: '50%', background: 'radial-gradient(circle at 35% 30%, #E86A5A, #B23A2C)', boxShadow: '0 5px 9px -2px rgba(0,0,0,.45)', zIndex: 3 }}></span>
                      <button onClick={() => setSelectedEvent(ev)} style={{ display: 'block', width: '100%', border: 'none', padding: 0, margin: '0 0 15px', cursor: 'zoom-in', position: 'relative', aspectRatio: '5/4', borderRadius: '3px', overflow: 'hidden', backgroundImage: ev.image_url ? `url(${ev.image_url})` : 'repeating-linear-gradient(135deg,#F7F1E2 0px,#F7F1E2 11px,#EFE7D2 11px,#EFE7D2 22px)', backgroundSize: 'cover', backgroundPosition: 'center', boxShadow: '0 3px 10px -4px rgba(0,0,0,.3)' }}>
                        {!ev.image_url && (
                          <span style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '7px' }}>
                            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', letterSpacing: '.1em', textTransform: 'uppercase', color: '#A08A5E', background: 'rgba(255,255,255,.82)', padding: '5px 11px', borderRadius: '7px' }}>Event Flyer &middot; drop image</span>
                            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', letterSpacing: '.14em', textTransform: 'uppercase', color: '#B29B6E' }}>&#9906; Click to expand</span>
                          </span>
                        )}
                        <span style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(59,46,32,.85)', color: '#F4E7C6', fontFamily: "'Space Mono', monospace", fontSize: '8.5px', letterSpacing: '.08em', textTransform: 'uppercase', padding: '5px 9px', borderRadius: '6px' }}>{ev.badge}</span>
                      </button>
                      <h3 style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: '17.5px', lineHeight: 1.2, margin: '0 0 12px', color: '#33271A' }}>{ev.title}</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '15px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '9px', fontSize: '13px', color: '#5E4E36' }}><span style={{ fontSize: '13px' }}>&#128197;</span>{ev.event_date}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '9px', fontSize: '13px', color: '#5E4E36' }}><span style={{ fontSize: '13px' }}>&#128336;</span>{ev.event_time}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '9px', fontSize: '13px', color: '#5E4E36' }}><span style={{ fontSize: '13px' }}>&#128205;</span>{ev.location}</div>
                      </div>
                      {!userId && (
                        <a href="/sign-up" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#B85C3E', color: '#fff', fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: '14px', padding: '11px', borderRadius: '11px', boxShadow: '0 10px 22px -12px rgba(184,92,62,.8)' }}>Sign Up / Register</a>
                      )}
                    </article>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>

        {/* Project update popup card */}
        {selectedUpdate && (
          <div onClick={() => setSelectedUpdate(null)} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(45,30,12,.78)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', overflowY: 'auto' }}>
            <div onClick={(e) => e.stopPropagation()} className="bulletin-popup-inner">
              <span style={{ position: 'absolute', top: '-11px', left: '32px', width: '88px', height: '26px', borderRadius: '3px', background: 'linear-gradient(150deg, rgba(184,92,62,.42), rgba(184,92,62,.24))', border: '1px solid rgba(184,92,62,.18)', transform: 'rotate(-4deg)' }}></span>
              <button onClick={() => setSelectedUpdate(null)} style={{ position: 'absolute', top: '16px', right: '16px', background: '#F3E7CD', border: '1px solid #E7D6B7', color: '#8A7A63', width: '34px', height: '34px', borderRadius: '50%', cursor: 'pointer', fontSize: '17px', lineHeight: 1 }}>&times;</button>
              <span style={{ display: 'inline-block', fontFamily: "'Space Mono', monospace", fontSize: '9.5px', letterSpacing: '.1em', textTransform: 'uppercase', color: '#B85C3E', background: '#F7E7DF', borderRadius: '999px', padding: '5px 11px', marginBottom: '14px' }}>{selectedUpdate.tag}</span>
              <h3 style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: '26px', lineHeight: 1.15, margin: '0 0 8px', color: '#2E2416' }}>{selectedUpdate.title}</h3>
              {selectedUpdate.image_url && <img src={selectedUpdate.image_url} alt={selectedUpdate.title} style={{ width: '100%', height: 'auto', borderRadius: '12px', marginBottom: '18px', objectFit: 'cover' }} />}
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', letterSpacing: '.06em', textTransform: 'uppercase', color: '#A99A7C', marginBottom: '18px' }}>Posted {formatDate(selectedUpdate.created_at)}</div>
              <p style={{ margin: '0 0 16px', fontSize: '15px', lineHeight: 1.62, color: '#5E4E36' }}>{selectedUpdate.body}</p>
              <p style={{ margin: '0 0 22px', fontSize: '14.5px', lineHeight: 1.62, color: '#6E5E46' }}>{selectedUpdate.detail}</p>
              {selectedUpdate.link_url && (
                <a href={selectedUpdate.link_url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#B85C3E', color: '#fff', fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: '14px', padding: '11px 22px', borderRadius: '11px', boxShadow: '0 10px 22px -12px rgba(184,92,62,.8)' }}>
                  {selectedUpdate.cta_label || 'Learn more'} &rarr;
                </a>
              )}
            </div>
          </div>
        )}

        {/* Flyer lightbox */}
        {selectedEvent && (
          <div onClick={() => setSelectedEvent(null)} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(45,30,12,.78)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
            <div onClick={(e) => e.stopPropagation()} className="bulletin-flyer-inner">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <span style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: '20px', color: '#FBF1DA' }}>{selectedEvent.title}</span>
                <button onClick={() => setSelectedEvent(null)} style={{ background: 'rgba(255,255,255,.14)', border: 'none', color: '#FBF1DA', width: '38px', height: '38px', borderRadius: '50%', cursor: 'pointer', fontSize: '18px' }}>&times;</button>
              </div>
              {selectedEvent.image_url ? (
                <img src={selectedEvent.image_url} alt={selectedEvent.title} style={{ width: '100%', height: 'auto', maxHeight: '80vh', objectFit: 'contain', borderRadius: '14px', boxShadow: '0 40px 80px -30px rgba(0,0,0,.7)' }} />
              ) : (
                <div style={{ aspectRatio: '1/1.33', borderRadius: '14px', backgroundImage: 'repeating-linear-gradient(135deg,#F1E8D2 0px,#F1E8D2 16px,#E8DCC0 16px,#E8DCC0 32px)', border: '1px solid rgba(255,255,255,.25)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', boxShadow: '0 40px 80px -30px rgba(0,0,0,.7)' }}>
                  <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '12px', letterSpacing: '.14em', textTransform: 'uppercase', color: '#8A7A54', background: 'rgba(255,255,255,.84)', padding: '8px 16px', borderRadius: '9px' }}>Hi-Res Event Flyer</span>
                  <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', letterSpacing: '.1em', textTransform: 'uppercase', color: '#A2946C' }}>Drop full-resolution artwork here</span>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
