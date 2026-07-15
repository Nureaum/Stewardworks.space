'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check, Loader2 } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import Image from 'next/image';

// Bilingual content structure
const CONTENT = {
  en: {
    title: 'Learning',
    subtitle: 'Complete the questionnaire to access AI Labs & Pilot Works',
    required: 'REQUIRED',
    optional: 'OPTIONAL',
    continue: 'Continue',
    saving: 'Saving...',
    selectAll: '(Select all that apply)',
    other: 'Other (please describe)',
    otherPlaceholder: 'Please describe...',
    prefilled: '✓ Already filled from your profile',
    sections: {
      identity: 'Identity & Aspiration',
      age: 'Age + Language',
      tech: 'Technology + Job Interest',
      context: 'Optional Context',
      additional: 'Additional Questions',
    },
    questions: {
      q1: {
        title: 'How long have you called Imperial Valley home?',
        options: ['Less than 1 year', '1–5 years', '6–10 years', 'More than 10 years', 'I grew up here'],
      },
      q2: {
        title: 'What type of learner are you?',
        options: ['Hands-on / learning by doing', 'Visual (videos, images, diagrams)', 'Reading and writing',
          'Group learning / discussion', 'Self-paced / independent', 'Other (please describe)'],
      },
      q3: {
        title: 'What is your dream environmental job?',
        options: ['Environmental educator', 'Media creator / storyteller', 'Conservation or restoration worker',
          'Agriculture or water systems worker', 'Environmental technician', 'Community organizer',
          'Not sure yet', 'Other (please describe)'],
      },
      q4: { title: 'What is your age range?', options: ['Under 18', '18–24', '25–34', '35–44', '45+'] },
      q5: { title: 'Which language do you prefer for learning?', options: ['English', 'Spanish', 'Both English and Spanish'] },
      q6: {
        title: 'What do you usually use to access the internet?',
        options: ['Smartphone only', 'Computer or laptop', 'Tablet',
          'Public computer (library, school, community center)', 'Limited or no access'],
      },
      q7: { title: 'Are you interested in training that could lead to a job in environmental work?',
        options: ['Yes', 'Maybe', 'Just exploring'] },
      q8: { title: 'Which best describes your current situation?',
        options: ['In school', 'Working full-time', 'Working part-time', 'Looking for work', 'Not currently working', 'Other'] },
      q9: { title: 'How much time could you spend learning each week?',
        options: ['Less than 2 hours', '2–5 hours', '5–10 hours', 'More than 10 hours'] },
      q10: { title: 'What might make it hard for you to participate?',
        options: ['Work schedule', 'Transportation', 'Internet or device access',
          'Childcare or family responsibilities', 'Language barriers', 'None of these', 'Other'] },
      q11: { title: 'What is a personal strength or skill you feel proud of?', placeholder: 'A strength I bring is...' },
      q12: { title: 'What do you hope to learn or build through this program?', placeholder: 'My goal is to...' },
      q13: { title: 'Which Imperial Valley communities are you connected to, live in, or care about?',
        options: ['El Centro', 'Calexico', 'Brawley', 'Imperial', 'Holtville', 'Calipatria', 'Westmorland',
          'Heber', 'Seeley', 'Niland', 'Salton City', 'Bombay Beach', 'Slab City', 'Winterhaven', 'Ocotillo', 'Palo Verde'] },
    },
  },
  es: {
    title: 'Aprendizaje',
    subtitle: 'Completa el cuestionario para acceder a AI Labs y Pilot Works',
    required: 'REQUERIDO',
    optional: 'OPCIONAL',
    continue: 'Continuar',
    saving: 'Guardando...',
    selectAll: '(Selecciona todas las que correspondan)',
    other: 'Otro (describe cuál)',
    otherPlaceholder: 'Por favor describe...',
    prefilled: '✓ Ya completado desde tu perfil',
    sections: {
      identity: 'Identidad y Aspiración',
      age: 'Edad + Idioma',
      tech: 'Tecnología + Interés Laboral',
      context: 'Contexto Opcional',
      additional: 'Preguntas Adicionales',
    },
    questions: {
      q1: { title: '¿Cuánto tiempo has vivido en el Valle Imperial?',
        options: ['Menos de 1 año', '1–5 años', '6–10 años', 'Más de 10 años', 'Crecí aquí'] },
      q2: { title: '¿Qué tipo de estudiante eres?',
        options: ['Práctico / aprender haciendo', 'Visual (videos, imágenes, diagramas)', 'Lectura y escritura',
          'Aprendizaje en grupo / conversación', 'A mi propio ritmo / independiente', 'Otro (describe cuál)'] },
      q3: { title: '¿Cuál es tu trabajo ambiental ideal?',
        options: ['Educador/a ambiental', 'Creador/a de medios o narrador/a', 'Trabajador/a de conservación o restauración',
          'Trabajo en agricultura o sistemas de agua', 'Técnico/a ambiental', 'Organizador/a comunitario/a',
          'Aún no estoy seguro/a', 'Otro (describe cuál)'] },
      q4: { title: '¿Cuál es tu rango de edad?', options: ['Menos de 18', '18–24', '25–34', '35–44', '45 o más'] },
      q5: { title: '¿Qué idioma prefieres para aprender?', options: ['Inglés', 'Español', 'Inglés y Español'] },
      q6: { title: '¿Qué usas normalmente para acceder a internet?',
        options: ['Solo teléfono celular', 'Computadora o laptop', 'Tableta',
          'Computadora pública (biblioteca, escuela, centro comunitario)', 'Acceso limitado o sin acceso'] },
      q7: { title: '¿Te interesa recibir capacitación que pueda llevarte a un trabajo ambiental?',
        options: ['Sí', 'Tal vez', 'Solo estoy explorando'] },
      q8: { title: '¿Cuál describe mejor tu situación actual?',
        options: ['Estoy estudiando', 'Trabajo de tiempo completo', 'Trabajo de medio tiempo',
          'Buscando trabajo', 'Actualmente no trabajo', 'Otro'] },
      q9: { title: '¿Cuánto tiempo podrías dedicar al aprendizaje cada semana?',
        options: ['Menos de 2 horas', '2–5 horas', '5–10 horas', 'Más de 10 horas'] },
      q10: { title: '¿Qué podría dificultar tu participación?',
        options: ['Horario de trabajo', 'Transporte', 'Acceso a internet o dispositivos',
          'Cuidado de niños o responsabilidades familiares', 'Barreras de idioma', 'Ninguna de estas', 'Otro'] },
      q11: { title: '¿Cuál es una fortaleza o habilidad personal de la que te sientes orgulloso/a?',
        placeholder: 'Una fortaleza que aporto es...' },
      q12: { title: '¿Qué esperas aprender o construir a través de este programa?', placeholder: 'Mi meta es...' },
      q13: { title: '¿Con qué comunidades del Valle Imperial estás conectado/a, vives o te interesan?',
        options: ['El Centro', 'Calexico', 'Brawley', 'Imperial', 'Holtville', 'Calipatria', 'Westmorland',
          'Heber', 'Seeley', 'Niland', 'Salton City', 'Bombay Beach', 'Slab City', 'Winterhaven', 'Ocotillo', 'Palo Verde'] },
    },
  },
};

const QUESTIONS = [
  { id: 'q1', section: 'identity', required: true, type: 'single' },
  { id: 'q2', section: 'identity', required: true, type: 'multiple' },
  { id: 'q3', section: 'identity', required: true, type: 'single' },
  { id: 'q4', section: 'age', required: true, type: 'single' },
  { id: 'q5', section: 'age', required: true, type: 'single' },
  { id: 'q6', section: 'tech', required: true, type: 'single' },
  { id: 'q7', section: 'tech', required: true, type: 'single' },
  { id: 'q8', section: 'context', required: false, type: 'single' },
  { id: 'q9', section: 'context', required: false, type: 'single' },
  { id: 'q10', section: 'context', required: false, type: 'multiple' },
  { id: 'q11', section: 'additional', required: true, type: 'text' },
  { id: 'q12', section: 'additional', required: true, type: 'text' },
  { id: 'q13', section: 'additional', required: true, type: 'multiple' },
];

// Map questions to existing database columns
// Q1-Q10 match the original onboarding fields exactly
// Q11 maps to 'why_here' (personal strength/motivation)
// Q12 maps to 'community_serve' (goals - repurposing this field)
// Q13 uses 'barriers' array field - but we'll store communities separately via a new approach
const DB_FIELD_MAP: Record<string, string> = {
  q1: 'community_status',      // Time in Imperial Valley
  q2: 'learning_style',        // Learning style (array)
  q3: 'dream_job',             // Dream environmental job
  q4: 'age_range',             // Age range
  q5: 'preferred_language',    // Language preference
  q6: 'internet_access',       // Technology access
  q7: 'training_interest',     // Job training interest
  q8: 'employment_status',     // Current situation (optional)
  q9: 'time_commitment',       // Time availability (optional)
  q10: 'barriers',             // Participation barriers (array, optional)
  q11: 'why_here',             // Personal strength/skill
  q12: 'community_serve',      // Learning goals
  q13: 'connected_communities', // Communities connected to (array) - may need DB column
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
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [prefilledQuestions, setPrefilledQuestions] = useState<Set<string>>(new Set()); // Track pre-filled answers
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
    const loadProfile = async () => {
      if (!isLoaded || !user) { setIsLoading(false); return; }
      try {
        const response = await fetch('/api/profile');
        if (response.ok) {
          const data = await response.json();
          if (data.profile) {
            if (data.profile.onboarding_completed) { router.push(returnUrl); return; }
            const loaded: Record<string, string | string[]> = {};
            const prefilled = new Set<string>();
            Object.entries(DB_FIELD_MAP).forEach(([qId, field]) => {
              const value = data.profile[field];
              if (value !== null && value !== undefined) {
                loaded[qId] = value;
                // Track q2 (learning_style) and q3 (dream_job) as pre-filled if they have actual values
                if (qId === 'q2' && Array.isArray(value) && value.length > 0) {
                  prefilled.add(qId);
                }
                if (qId === 'q3' && typeof value === 'string' && value.trim() !== '') {
                  prefilled.add(qId);
                }
              }
            });
            setAnswers(loaded);
            setPrefilledQuestions(prefilled);
          }
        }
      } catch (error) { console.error('Failed to load profile:', error); }
      finally { setIsLoading(false); }
    };
    loadProfile();
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
    const missing = QUESTIONS.find(q => {
      if (!q.required) return false;
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
      // Build payload with all onboarding answers
      const payload: Record<string, any> = {};
      
      QUESTIONS.forEach(q => {
        const field = DB_FIELD_MAP[q.id];
        let value = answers[q.id];
        // Handle "Other" option - replace with user's custom text
        if (q.type === 'single' && value && (value as string).toLowerCase().includes('other'))
          value = otherValues[q.id] || value;
        if (q.type === 'multiple' && Array.isArray(value))
          value = value.map(v => v.toLowerCase().includes('other') && otherValues[q.id] ? otherValues[q.id] : v);
        if (value !== undefined) payload[field] = value;
      });
      
      // Mark onboarding as completed
      payload.onboarding_completed = true;
      
      const response = await fetch('/api/profile', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload) });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Profile save error:', errorData);
        throw new Error(errorData.error || 'Failed to save profile');
      }
      
      router.push(returnUrl);
    } catch (error) { console.error('Save error:', error); setIsSaving(false); }
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

  const t = CONTENT[lang];
  const getSectionQuestions = (section: string) => QUESTIONS.filter(q => q.section === section);

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

        {['identity', 'age', 'tech', 'context', 'additional'].map(sectionKey => (
          <div key={sectionKey} style={{ marginBottom: 48 }}>
            <div style={{ background: '#21282E', color: '#FEFAE0', padding: '12px 20px',
              borderRadius: '12px 12px 0 0', fontFamily: '"DM Mono", monospace', fontSize: 11,
              letterSpacing: '.15em', fontWeight: 700 }}>
              {t.sections[sectionKey as keyof typeof t.sections]}
            </div>
            <div style={{ background: '#fff', borderRadius: '0 0 12px 12px', padding: '24px', boxShadow: '0 8px 24px rgba(0,0,0,.08)' }}>
              {getSectionQuestions(sectionKey).map((q, idx) => {
                const qContent = t.questions[q.id as keyof typeof t.questions];
                const answer = answers[q.id];
                const isError = errorQId === q.id;
                return (
                  <div key={q.id} id={`question-${q.id}`} style={{
                    marginBottom: idx < getSectionQuestions(sectionKey).length - 1 ? 32 : 0,
                    paddingTop: idx > 0 ? 24 : 0, borderTop: idx > 0 ? '1px solid rgba(0,0,0,.06)' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%',
                        background: isError ? '#dc2626' : '#417C98', color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{QUESTIONS.indexOf(q) + 1}</div>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#21282E', marginBottom: 4, lineHeight: 1.4 }}>
                          {qContent.title}</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.1em',
                            color: q.required ? '#DB9B2F' : 'rgba(0,0,0,.3)' }}>
                            {q.required ? t.required : t.optional}</span>
                          {q.type === 'multiple' && <span style={{ fontSize: 11, color: 'rgba(0,0,0,.4)' }}>{t.selectAll}</span>}
                        </div>
                        {isError && <p style={{ fontSize: 12, color: '#dc2626', marginTop: 4, fontWeight: 600 }}>
                          Please answer this question to continue.</p>}
                        {/* Show pre-filled note for q2 and q3 if they have data from profile */}
                        {prefilledQuestions.has(q.id) && (q.id === 'q2' || q.id === 'q3') && (
                          <p style={{ fontSize: 11, color: '#22863a', marginTop: 6, fontWeight: 600,
                            background: 'rgba(34,134,58,.08)', padding: '6px 10px', borderRadius: 6,
                            display: 'inline-block' }}>
                            {(t as any).prefilled || '✓ Already filled from your profile'}
                          </p>
                        )}
                      </div>
                    </div>
                    {q.type === 'text' && (
                      <textarea value={(answer as string) || ''} onChange={e => handleTextChange(q.id, e.target.value)}
                        placeholder={(qContent as any).placeholder || ''} style={{ width: '100%', minHeight: 100,
                          padding: '14px 16px', border: isError ? '2px solid #dc2626' : '2px solid rgba(0,0,0,.1)',
                          borderRadius: 10, fontSize: 14, fontFamily: 'inherit', resize: 'vertical', outline: 'none' }} />
                    )}
                    {(q.type === 'single' || q.type === 'multiple') && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {(qContent as any).options?.map((option: string) => {
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
        ))}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 20 }}>
          <button onClick={handleSubmit} disabled={isSaving} style={{ width: '100%', maxWidth: 400,
            padding: '18px 32px', background: isSaving ? '#9aa596' : '#417C98', color: '#FEFAE0',
            border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 800, letterSpacing: '.1em',
            cursor: isSaving ? 'not-allowed' : 'pointer',
            boxShadow: isSaving ? 'none' : '0 12px 28px -8px rgba(65,124,152,.5)', transition: 'all .2s ease' }}>
            {isSaving ? t.saving : t.continue}
          </button>
        </div>
      </div>
    </div>
  );
}
