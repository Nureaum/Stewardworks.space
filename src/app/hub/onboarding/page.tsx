'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check, Loader2 } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import Image from 'next/image';

type Question = {
  id: string;
  title_en: string;
  title_es: string;
  type: 'text' | 'single' | 'multiple';
  is_required: boolean;
  section: string;
  options_en: string[];
  options_es: string[];
  sort_order: number;
};

// Bilingual static UI content
const UI_CONTENT = {
  en: {
    title: 'Learning',
    subtitle: 'Complete the questionnaire to access AI Labs & Pilot Works',
    required: 'REQUIRED',
    optional: 'OPTIONAL',
    continue: 'Continue',
    saving: 'Saving...',
    selectAll: '(Select all that apply)',
    otherPlaceholder: 'Please describe...',
    sections: {
      identity: 'Identity & Aspiration',
      age: 'Age + Language',
      tech: 'Technology + Job Interest',
      context: 'Optional Context',
      additional: 'Additional Questions',
    } as Record<string, string>,
  },
  es: {
    title: 'Aprendizaje',
    subtitle: 'Completa el cuestionario para acceder a AI Labs y Pilot Works',
    required: 'REQUERIDO',
    optional: 'OPCIONAL',
    continue: 'Continuar',
    saving: 'Guardando...',
    selectAll: '(Selecciona todas las que correspondan)',
    otherPlaceholder: 'Por favor describe...',
    sections: {
      identity: 'Identidad y Aspiración',
      age: 'Edad + Idioma',
      tech: 'Tecnología + Interés Laboral',
      context: 'Contexto Opcional',
      additional: 'Preguntas Adicionales',
    } as Record<string, string>,
  }
};

// Language Selection Screen Component
function LanguageSelectionScreen({ onSelectLanguage }: { onSelectLanguage: (lang: 'en' | 'es') => void }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', position: 'relative' }}>
      {/* Left Side - English */}
      <div
        onClick={() => onSelectLanguage('en')}
        style={{
          flex: 1,
          background: 'linear-gradient(135deg, #DB9B2F 0%, #a27532 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          position: 'relative',
          overflow: 'hidden',
        }}
        onMouseEnter={e => { e.currentTarget.style.flex = '1.1'; }}
        onMouseLeave={e => { e.currentTarget.style.flex = '1'; }}
      >
        <div style={{ position: 'absolute', top: 40, left: 40 }}>
          <div style={{ width: 60, height: 60, background: 'rgba(255,255,255,0.15)', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900,
            color: '#FEFAE0', fontSize: 20 }}>SW</div>
        </div>
        <div style={{ textAlign: 'center', color: '#FEFAE0' }}>
          <div style={{ fontSize: 72, marginBottom: 20 }}>🇺🇸</div>
          <h2 style={{ fontSize: 48, fontWeight: 800, marginBottom: 12, fontFamily: '"Exo", sans-serif' }}>
            Learning
          </h2>
          <p style={{ fontSize: 18, opacity: 0.8, fontFamily: '"DM Mono", monospace' }}>(English)</p>
          <div style={{ marginTop: 40, padding: '16px 40px', background: 'rgba(255,255,255,0.15)',
            borderRadius: 12, fontSize: 14, fontWeight: 600, letterSpacing: '.1em' }}>
            ← SELECT ENGLISH
          </div>
        </div>
      </div>

      {/* Center Logo - Positioned over the split */}
      <div style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        pointerEvents: 'none',
      }}>
        <div style={{
          width: 180,
          height: 180,
          borderRadius: '50%',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
          border: '6px solid rgba(254,250,224,0.9)',
          background: '#fff',
        }}>
          <Image 
            src="/logo 1.jpg" 
            alt="Salton Sea Logo" 
            width={180} 
            height={180}
            style={{ objectFit: 'cover', width: '100%', height: '100%' }}
          />
        </div>
      </div>

      {/* Right Side - Spanish */}
      <div
        onClick={() => onSelectLanguage('es')}
        style={{
          flex: 1,
          background: 'linear-gradient(135deg, #417C98 0%, #2d5a6e 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          position: 'relative',
          overflow: 'hidden',
        }}
        onMouseEnter={e => { e.currentTarget.style.flex = '1.1'; }}
        onMouseLeave={e => { e.currentTarget.style.flex = '1'; }}
      >
        <div style={{ position: 'absolute', top: 40, right: 40 }}>
          <div style={{ width: 60, height: 60, background: 'rgba(255,255,255,0.15)', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900,
            color: '#FEFAE0', fontSize: 20 }}>SW</div>
        </div>
        <div style={{ textAlign: 'center', color: '#FEFAE0' }}>
          <div style={{ fontSize: 72, marginBottom: 20 }}>🇲🇽</div>
          <h2 style={{ fontSize: 48, fontWeight: 800, marginBottom: 12, fontFamily: '"Exo", sans-serif' }}>
            Aprendizaje
          </h2>
          <p style={{ fontSize: 18, opacity: 0.8, fontFamily: '"DM Mono", monospace' }}>(Español)</p>
          <div style={{ marginTop: 40, padding: '16px 40px', background: 'rgba(255,255,255,0.15)',
            borderRadius: 12, fontSize: 14, fontWeight: 600, letterSpacing: '.1em' }}>
            SELECCIONAR ESPAÑOL →
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HubOnboardingPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg,#efe4d2,#e0cdb4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={48} className="animate-spin" style={{ color: '#417C98' }} />
      </div>
    }>
      <HubOnboardingContent />
    </Suspense>
  );
}

function HubOnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoaded } = useUser();
  
  const [lang, setLang] = useState<'en' | 'es' | null>(null); // null = show language selection
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [otherValues, setOtherValues] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorQId, setErrorQId] = useState<string | null>(null);
  const [returnUrl, setReturnUrl] = useState<string>('/hub');

  useEffect(() => {
    const url = searchParams.get('returnUrl');
    if (url) setReturnUrl(decodeURIComponent(url));
  }, [searchParams]);

  useEffect(() => {
    const loadData = async () => {
      if (!isLoaded || !user) { setIsLoading(false); return; }
      try {
        // First check if already completed
        const pRes = await fetch('/api/profile');
        if (pRes.ok) {
          const pData = await pRes.json();
          if (pData.profile?.onboarding_completed) {
            router.push(returnUrl);
            return;
          }
        }

        // Fetch dynamic questions
        const qRes = await fetch('/api/admin/onboarding-questions');
        if (qRes.ok) {
          const qData = await qRes.json();
          setQuestions(qData.questions || []);
        }
      } catch (error) { 
        console.error('Failed to load onboarding data:', error); 
      } finally { 
        setIsLoading(false); 
      }
    };
    loadData();
  }, [isLoaded, user, router, returnUrl]);

  const handleSingleSelect = (qId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [qId]: value }));
    if (errorQId === qId) setErrorQId(null);
  };

  const handleMultiSelect = (qId: string, value: string) => {
    setAnswers(prev => {
      const current = (prev[qId] as string[]) || [];
      if (current.includes(value)) return { ...prev, [qId]: current.filter(v => v !== value) };
      return { ...prev, [qId]: [...current, value] };
    });
    if (errorQId === qId) setErrorQId(null);
  };

  const handleTextChange = (qId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [qId]: value }));
    if (errorQId === qId) setErrorQId(null);
  };

  const handleOtherChange = (qId: string, value: string) => {
    setOtherValues(prev => ({ ...prev, [qId]: value }));
  };

  const handleSubmit = async () => {
    const missing = questions.find(q => {
      if (!q.is_required) return false;
      const ans = answers[q.id];
      if (q.type === 'multiple') return !ans || (ans as string[]).length === 0;
      if (q.type === 'text') return !ans || (ans as string).trim() === '';
      return !ans;
    });
    
    if (missing) {
      setErrorQId(missing.id);
      document.getElementById(`question-${missing.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    
    setIsSaving(true);
    try {
      // Build payload for new answers table
      const formattedAnswers = questions.map(q => {
        let value = answers[q.id];
        
        // Resolve "Other" values
        if (q.type === 'single' && value && typeof value === 'string' && (value.toLowerCase().includes('other') || value.toLowerCase().includes('otro'))) {
          value = otherValues[q.id] || value;
        }
        if (q.type === 'multiple' && Array.isArray(value)) {
          value = value.map(v => (v.toLowerCase().includes('other') || v.toLowerCase().includes('otro')) && otherValues[q.id] ? otherValues[q.id] : v);
        }
        
        return {
          question_id: q.id,
          answer_text: q.type === 'single' || q.type === 'text' ? (value as string) : null,
          answer_array: q.type === 'multiple' ? (value as string[]) : null
        };
      }).filter(a => a.answer_text !== undefined || a.answer_array !== undefined);
      
      const response = await fetch('/api/onboarding-answers', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: formattedAnswers }) 
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save answers');
      }
      
      router.push(returnUrl);
    } catch (error) { 
      console.error('Save error:', error); 
      setIsSaving(false); 
    }
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg,#efe4d2,#e0cdb4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={48} className="animate-spin" style={{ color: '#417C98' }} />
      </div>
    );
  }

  // Show language selection screen if no language selected yet
  if (lang === null) {
    return <LanguageSelectionScreen onSelectLanguage={(selectedLang) => setLang(selectedLang)} />;
  }

  const t = UI_CONTENT[lang];
  // Group questions by section
  const sections = Array.from(new Set(questions.map(q => q.section)));

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg,#efe4d2,#e0cdb4)', fontFamily: '"Exo", sans-serif' }}>
      {/* Header */}
      <div style={{ background: '#21282E', padding: '16px 24px', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 }}>
        <div onClick={() => router.push('/hub')} style={{ width: 40, height: 40, background: '#417C98',
          borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', fontWeight: 900, color: '#FEFAE0', fontSize: 14 }}>SW</div>
        <div style={{ display: 'flex', gap: 0, borderRadius: 8, overflow: 'hidden', border: '2px solid rgba(254,250,224,.2)' }}>
          <button onClick={() => setLang('en')} style={{ padding: '10px 20px',
            background: lang === 'en' ? '#417C98' : 'transparent', color: '#FEFAE0', border: 'none',
            cursor: 'pointer', fontFamily: '"DM Mono", monospace', fontSize: 12,
            fontWeight: lang === 'en' ? 700 : 400, letterSpacing: '.05em' }}>Learning (English)</button>
          <button onClick={() => setLang('es')} style={{ padding: '10px 20px',
            background: lang === 'es' ? '#417C98' : 'transparent', color: '#FEFAE0', border: 'none',
            cursor: 'pointer', fontFamily: '"DM Mono", monospace', fontSize: 12,
            fontWeight: lang === 'es' ? 700 : 400, letterSpacing: '.05em' }}>Aprendizaje (Español)</button>
        </div>
        <div style={{ width: 40 }} />
      </div>

      {/* Content */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px 120px' }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: '#21282E', marginBottom: 8, textAlign: 'center' }}>{t.title}</h1>
        <p style={{ fontSize: 14, color: '#5a4a3a', marginBottom: 40, textAlign: 'center' }}>{t.subtitle}</p>

        {sections.map(sectionKey => {
          const sectionQuestions = questions.filter(q => q.section === sectionKey);
          return (
            <div key={sectionKey} style={{ marginBottom: 48 }}>
              <div style={{ background: '#21282E', color: '#FEFAE0', padding: '12px 20px',
                borderRadius: '12px 12px 0 0', fontFamily: '"DM Mono", monospace', fontSize: 11,
                letterSpacing: '.15em', fontWeight: 700 }}>
                {t.sections[sectionKey] || sectionKey.toUpperCase()}
              </div>
              <div style={{ background: '#fff', borderRadius: '0 0 12px 12px', padding: '24px', boxShadow: '0 8px 24px rgba(0,0,0,.08)' }}>
                {sectionQuestions.map((q, idx) => {
                  const answer = answers[q.id];
                  const isError = errorQId === q.id;
                  const title = lang === 'es' ? q.title_es : q.title_en;
                  const options = lang === 'es' ? q.options_es : q.options_en;
                  
                  return (
                    <div key={q.id} id={`question-${q.id}`} style={{
                      marginBottom: idx < sectionQuestions.length - 1 ? 32 : 0,
                      paddingTop: idx > 0 ? 24 : 0, borderTop: idx > 0 ? '1px solid rgba(0,0,0,.06)' : 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%',
                          background: isError ? '#dc2626' : '#417C98', color: '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{questions.indexOf(q) + 1}</div>
                        <div style={{ flex: 1 }}>
                          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#21282E', marginBottom: 4, lineHeight: 1.4 }}>
                            {title}</h3>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.1em',
                              color: q.is_required ? '#DB9B2F' : 'rgba(0,0,0,.3)' }}>
                              {q.is_required ? t.required : t.optional}</span>
                            {q.type === 'multiple' && <span style={{ fontSize: 11, color: 'rgba(0,0,0,.4)' }}>{t.selectAll}</span>}
                          </div>
                          {isError && <p style={{ fontSize: 12, color: '#dc2626', marginTop: 4, fontWeight: 600 }}>
                            Please answer this question to continue.</p>}
                        </div>
                      </div>
                      {q.type === 'text' && (
                        <textarea value={(answer as string) || ''} onChange={e => handleTextChange(q.id, e.target.value)}
                          placeholder="" style={{ width: '100%', minHeight: 100,
                            padding: '14px 16px', border: isError ? '2px solid #dc2626' : '2px solid rgba(0,0,0,.1)',
                            borderRadius: 10, fontSize: 14, fontFamily: 'inherit', resize: 'vertical', outline: 'none' }} />
                      )}
                      {(q.type === 'single' || q.type === 'multiple') && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {options?.map((option: string) => {
                            const isSelected = q.type === 'multiple'
                              ? ((answer as string[]) || []).includes(option) : answer === option;
                            const isOther = option.toLowerCase().includes('other') || option.toLowerCase().includes('otro');
                            return (
                              <div key={option}>
                                <button onClick={() => q.type === 'single' ? handleSingleSelect(q.id, option) : handleMultiSelect(q.id, option)}
                                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                                    padding: '14px 16px', background: isSelected ? 'rgba(65,124,152,.1)' : '#fff',
                                    border: isSelected ? '2px solid #417C98' : '2px solid rgba(0,0,0,.08)',
                                    borderRadius: 10, cursor: 'pointer', textAlign: 'left', transition: 'all .15s ease' }}>
                                  <div style={{ width: 22, height: 22, borderRadius: q.type === 'multiple' ? 6 : '50%',
                                    border: isSelected ? '2px solid #417C98' : '2px solid rgba(0,0,0,.15)',
                                    background: isSelected ? '#417C98' : '#fff', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    {isSelected && <Check size={14} color="#fff" />}
                                  </div>
                                  <span style={{ fontSize: 14, fontWeight: isSelected ? 600 : 400, color: '#21282E' }}>{option}</span>
                                </button>
                                {isOther && isSelected && (
                                  <input type="text" value={otherValues[q.id] || ''}
                                    onChange={e => handleOtherChange(q.id, e.target.value)} placeholder={t.otherPlaceholder}
                                    style={{ width: '100%', marginTop: 8, marginLeft: 34, maxWidth: 'calc(100% - 34px)',
                                      padding: '10px 14px', border: '2px solid rgba(65,124,152,.3)', borderRadius: 8,
                                      fontSize: 14, outline: 'none' }} />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        
        {questions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No questions found.</p>
          </div>
        )}

        {questions.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 20 }}>
            <button onClick={handleSubmit} disabled={isSaving} style={{ width: '100%', maxWidth: 400,
              padding: '18px 32px', background: isSaving ? '#9aa596' : '#417C98', color: '#FEFAE0',
              border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 800, letterSpacing: '.1em',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              boxShadow: isSaving ? 'none' : '0 12px 28px -8px rgba(65,124,152,.5)', transition: 'all .2s ease' }}>
              {isSaving ? t.saving : t.continue}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
