'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { submitReflection } from './actions';

export default function SubmitFeedbackClient({ projectAreas, user }: any) {
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reflection, setReflection] = useState('');
  const [consider, setConsider] = useState('');
  const [valueStr, setValueStr] = useState('');
  
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [ageRange, setAgeRange] = useState('');

  const TOPIC_OPTIONS = [
    { label: 'Workforce', bg: '#fbf5ea', color: '#4a3728' },
    { label: 'Local Control', bg: '#fbf5ea', color: '#4a3728' },
    { label: 'Water & Land', bg: '#fbf5ea', color: '#4a3728' },
    { label: 'Youth', bg: '#fbf5ea', color: '#4a3728' },
    { label: 'Literacy', bg: '#fbf5ea', color: '#4a3728' },
    { label: 'Oversight', bg: '#fbf5ea', color: '#4a3728' }
  ];

  const AGE_OPTIONS = [
    { label: '13-17', bg: '#fbf5ea', color: '#4a3728' },
    { label: '18-24', bg: '#fbf5ea', color: '#4a3728' },
    { label: '25-34', bg: '#fbf5ea', color: '#4a3728' },
    { label: '35-50', bg: '#fbf5ea', color: '#4a3728' },
    { label: '51-64', bg: '#fbf5ea', color: '#4a3728' },
    { label: '65+', bg: '#fbf5ea', color: '#4a3728' }
  ];

  const toggleTopic = (label: string) => {
    setSelectedTopics(prev => prev.includes(label) ? prev.filter(t => t !== label) : [...prev, label]);
  };

  const handleSubmit = async () => {
    if (!reflection || !ageRange) {
      alert('Please fill out your reflection and age range.');
      return;
    }

    setIsSubmitting(true);
    try {
      await submitReflection({
        reflection,
        consider,
        value: valueStr,
        topic_tags: selectedTopics,
        name,
        location,
        age_range: ageRange
      });
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      alert('Failed to submit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    // Should be handled by middleware or server, but fallback here
    return <div className="p-10 text-center">Please sign in to submit feedback.</div>;
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fdfbfa', paddingBottom: 110 }}>
      {/* Top Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '12px 24px', backgroundColor: '#fdfbfa', borderBottom: '1px solid #efe4cf' }}>
        <Link href="/hub/community-listening" style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 11.5, letterSpacing: '.16em', textTransform: 'uppercase', color: '#a86c28', fontWeight: 600 }}>&larr; Listening Wall</Link>
      </div>

      <div style={{ padding: '44px 24px 110px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 760 }}>

          {submitted ? (
            <div style={{ background: '#fbf5ea', borderRadius: 20, padding: '52px 44px', boxShadow: '0 18px 40px rgba(60,40,20,.16)', textAlign: 'center', animation: 'fadeUp .4s ease both' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#3f9e8f', color: '#fff', fontSize: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>&#10003;</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#4a3728', marginTop: 20 }}>Thank you for continuing the listening.</div>
              <p style={{ fontFamily: 'var(--font-newsreader)', fontSize: 17, lineHeight: 1.6, color: '#6b573f', maxWidth: 520, margin: '12px auto 0' }}>Your reflection is now with the team. When we integrate an idea into the workshops, the AI Lab, or the roadmap, it shows up on the <strong>You Said &rarr; We Did</strong> board &mdash; traced right back to your words.</p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 28 }}>
                <Link href="/hub/community-listening/you-said" style={{ cursor: 'pointer', background: '#c98a3d', color: '#fff', padding: '12px 22px', borderRadius: 12, fontWeight: 600, fontSize: 14 }}>See You Said &rarr; We Did</Link>
                <div onClick={() => setSubmitted(false)} style={{ cursor: 'pointer', background: '#fbf5ea', border: '1px solid #d9c3a0', color: '#6b573f', padding: '12px 22px', borderRadius: 12, fontWeight: 600, fontSize: 14 }}>Share another thought</div>
              </div>
            </div>
          ) : (
            <div style={{ animation: 'fadeUp .4s ease both' }}>
              <div style={{ textAlign: 'center', marginBottom: 8 }}>
                <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 11, letterSpacing: '.22em', color: '#a07b4d', textTransform: 'uppercase' }}>Continue the Listening</div>
                <div style={{ fontSize: 36, fontWeight: 700, color: '#4a3728', marginTop: 6, letterSpacing: '-.01em' }}>Tell us what we should hear</div>
                <p style={{ fontFamily: 'var(--font-newsreader)', fontStyle: 'italic', fontSize: 17, color: '#8a6f4d', maxWidth: 540, margin: '8px auto 0' }}>Your thoughts on AI, this grant, what to consider, and what you value &mdash; we listen, and we build them in.</p>
              </div>

              {/* clerk signed-in banner */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#eef4f2', border: '1px solid #cfe3dd', borderRadius: 12, padding: '12px 16px', margin: '22px 0 18px' }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#3f9e8f', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>{user?.firstName?.[0] || 'U'}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#2f6b60' }}>Signed in as {user?.firstName} {user?.lastName}</div>
                  <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 10.5, color: '#5a8880' }}>Authenticated via Clerk &middot; submissions are tied to your account</div>
                </div>
                <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 10, color: '#7aa39b', border: '1px solid #bcd8d1', padding: '4px 9px', borderRadius: 14 }}>SECURE</div>
              </div>

              <div style={{ background: '#fbf5ea', borderRadius: 20, padding: '30px 32px', boxShadow: '0 18px 40px rgba(60,40,20,.14)' }}>
                {/* open box */}
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#4a3728' }}>Your open reflection <span style={{ color: '#c05a5a' }}>*</span></label>
                <div style={{ fontFamily: 'var(--font-newsreader)', fontStyle: 'italic', fontSize: 13, color: '#8a6f4d', margin: '3px 0 8px' }}>Anything about AI, this grant, your community, concerns, or hopes.</div>
                <textarea value={reflection} onChange={e => setReflection(e.target.value)} placeholder="Write freely, like pen on paper…" style={{ width: '100%', minHeight: 130, resize: 'vertical', border: '1px solid #e2d2b4', borderRadius: 12, padding: '14px 16px', fontFamily: 'var(--font-newsreader)', fontSize: 16, lineHeight: 1.55, color: '#4a3728', background: 'repeating-linear-gradient(180deg,#fffdf8,#fffdf8 27px,#f0e6d2 27px,#f0e6d2 28px)', outline: 'none' }}></textarea>

                {/* guided prompts */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 20 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#4a3728' }}>What should we consider?</label>
                    <div style={{ fontFamily: 'var(--font-newsreader)', fontStyle: 'italic', fontSize: 12.5, color: '#8a6f4d', margin: '3px 0 8px' }}>A guided nudge &mdash; one thing on your mind.</div>
                    <input value={consider} onChange={e => setConsider(e.target.value)} placeholder="e.g. Our water and the data center" style={{ width: '100%', border: '1px solid #e2d2b4', borderRadius: 10, padding: '11px 13px', fontSize: 14, color: '#4a3728', background: '#fffdf8', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#4a3728' }}>What value matters most to you?</label>
                    <div style={{ fontFamily: 'var(--font-newsreader)', fontStyle: 'italic', fontSize: 12.5, color: '#8a6f4d', margin: '3px 0 8px' }}>The principle we should hold onto.</div>
                    <input value={valueStr} onChange={e => setValueStr(e.target.value)} placeholder="e.g. Community over profit" style={{ width: '100%', border: '1px solid #e2d2b4', borderRadius: 10, padding: '11px 13px', fontSize: 14, color: '#4a3728', background: '#fffdf8', outline: 'none' }} />
                  </div>
                </div>

                {/* tags */}
                <div style={{ marginTop: 20 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#4a3728', marginBottom: 9 }}>Topics this touches</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {TOPIC_OPTIONS.map((t, i) => {
                      const isSelected = selectedTopics.includes(t.label);
                      return (
                        <div key={i} onClick={() => toggleTopic(t.label)} style={{ cursor: 'pointer', background: isSelected ? '#c98a3d' : t.bg, color: isSelected ? '#fff' : t.color, border: '1px solid #d9c3a0', padding: '7px 14px', borderRadius: 20, fontSize: 13, fontWeight: 500, transition: 'all .15s ease' }}>{t.label}</div>
                      );
                    })}
                  </div>
                </div>

                {/* demographics */}
                <div style={{ marginTop: 24, paddingTop: 22, borderTop: '1px dashed #d9c3a0' }}>
                  <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 10.5, letterSpacing: '.14em', color: '#a07b4d', textTransform: 'uppercase', marginBottom: 14 }}>A little about you &mdash; helps us quote &amp; reference later</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#4a3728', marginBottom: 6 }}>Name <span style={{ color: '#8a6f4d', fontWeight: 400 }}>(optional)</span></label>
                      <input value={name} onChange={e => setName(e.target.value)} placeholder="Leave blank to stay anonymous" style={{ width: '100%', border: '1px solid #e2d2b4', borderRadius: 10, padding: '11px 13px', fontSize: 14, color: '#4a3728', background: '#fffdf8', outline: 'none' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#4a3728', marginBottom: 6 }}>Location <span style={{ color: '#8a6f4d', fontWeight: 400 }}>(optional)</span></label>
                      <input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Brawley" style={{ width: '100%', border: '1px solid #e2d2b4', borderRadius: 10, padding: '11px 13px', fontSize: 14, color: '#4a3728', background: '#fffdf8', outline: 'none' }} />
                    </div>
                  </div>
                  <div style={{ marginTop: 14 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#4a3728', marginBottom: 8 }}>Age range <span style={{ color: '#c05a5a' }}>*</span></label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {AGE_OPTIONS.map((a, i) => {
                        const isSelected = ageRange === a.label;
                        return (
                          <div key={i} onClick={() => setAgeRange(a.label)} style={{ cursor: 'pointer', background: isSelected ? '#c98a3d' : a.bg, color: isSelected ? '#fff' : a.color, border: '1px solid #d9c3a0', padding: '7px 14px', borderRadius: 20, fontSize: 13, fontWeight: 500, transition: 'all .15s ease' }}>{a.label}</div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div onClick={handleSubmit} style={{ opacity: isSubmitting ? 0.7 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer', marginTop: 26, background: '#c98a3d', color: '#fff', padding: 15, borderRadius: 12, textAlign: 'center', fontWeight: 700, fontSize: 15, boxShadow: '0 8px 20px rgba(201,138,61,.35)', transition: 'transform .15s ease' }} className="hover:scale-[1.01]">{isSubmitting ? 'Submitting...' : 'Add my voice to the listening'}</div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
