'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'es';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    'mission.phrase': 'Numen Aquae',
    'mission.body': "Learning AI and media skills to build environmental careers in Imperial County.",
    'mission.body.long': "StewardWorks is an online learning space where people build AI and media skills to prepare for real jobs in environmental work.\n\nWe work with disinvested communities in Imperial County’s Southern Border Region, focusing on learning AI skills for bilingual content creation and developing workforce pathways in environmental careers.\n\nStewardWorks.space is the online home of the AI Content Creation and Environmental Literacy Hub project, an exploratory initiative led by Nureaum, with funding from California Jobs First.",
    'enter.site': 'Log In / Create Account',
    'learn.more': 'Learn More',
    'welcome.en': 'Welcome to stewardworks.space',
    'onboard.en': 'enter here to learn in English',
    'onboard.button.en': 'Onboard',
    'welcome.es': 'Bienvenida a stewardworks.space',
    'onboard.es': 'Entra aquí para aprender en Español',
    'onboard.button.es': 'A bordo',
    'credits': 'Supported by our fiscal contributors',
    'onboarding.title': 'Onboarding Questions',
    'onboarding.save': 'Save Progress',
    'onboarding.required': 'Required',
    'onboarding.optional': 'Optional',
    'onboarding.continue': 'Continue',
    'onboarding.skip': 'Skip to Review',
    'onboarding.q1.title': 'How long have you called Imperial Valley home?',
    'onboarding.q1.options': 'Less than 1 year|1–5 years|6–10 years|More than 10 years|I grew up here',
    'onboarding.q2.title': 'What type of learner are you? (Select all that apply)',
    'onboarding.q2.options': 'Hands-on / Learning by Doing|Visual (Videos, Images, Diagrams)|Reading and Writing|Group Learning / Discussion|Self-paced / Independent|Other (Please Describe)',
    'onboarding.q3.title': 'What is your dream environmental job?',
    'onboarding.q3.options': 'Environmental Educator|Media Creator / Storyteller|Conservation or Restoration Worker|Agriculture or Water Systems Worker|Environmental Technician|Community Organizer|Not Sure Yet|Other (Please Describe)',
    'onboarding.q4.title': 'What is your age range?',
    'onboarding.q4.options': 'Under 18|18–24|25–34|35–44|45+',
    'onboarding.q5.title': 'Which language do you prefer for learning?',
    'onboarding.q5.options': 'English|Spanish|Both English and Spanish',
    'onboarding.q6.title': 'What do you usually use to access the internet?',
    'onboarding.q6.options': 'Smartphone only|Computer or laptop|Tablet|Public computer (library, school, community center)|Limited or no access',
    'onboarding.q7.title': 'Are you interested in training that could lead to a job in environmental work?',
    'onboarding.q7.options': 'Yes|Maybe|Just exploring',
    'onboarding.q8.title': 'Which best describes your current situation?',
    'onboarding.q8.options': 'In school|Working full-time|Working part-time|Looking for work|Not currently working|Other',
    'onboarding.q9.title': 'How much time could you spend learning each week?',
    'onboarding.q9.options': 'Less than 2 hours|2–5 hours|5–10 hours|More than 10 hours',
    'onboarding.q10.title': 'What might make it hard for you to participate? (Select all that apply)',
    'onboarding.q10.options': 'Work schedule|Transportation|Internet or device access|Childcare or family responsibilities|Language barriers|None of these|Other',
    'bulletin.title': 'Project Bulletin',
    'bulletin.fyi.title': 'Project FYI',
    'bulletin.faq.title': 'Project FAQ',
    'bulletin.listening.title': 'Community Listening Sessions',
    'bulletin.dates.title': 'Upcoming Dates',
    'bulletin.workshops.title': 'Workshops & Signups',
    'bulletin.datacenters.title': 'About Data Centers',
    'bulletin.ai.title': 'About AI',
    'bulletin.background.title': 'Project Background',
    'bulletin.scroll': 'Scroll Down for More',
  },
  es: {
    'mission.phrase': 'Numen Aquae',
    'mission.body': "Aprendiendo habilidades en IA и medios digitales для построить carreras ambientales в el Condado de Imperial.",
    'mission.body.long': "StewardWorks es un espacio de aprendizaje в línea где las personas desarrollan habilidades в inteligencia artificial и medios digitales para prepararse para trabajos reales в el sector ambiental.\n\nTrabajamos con comunidades desinvertidas de la Región Fronteriza Sur del Condado de Imperial, с un enfoque в el aprendizaje de habilidades в IA para la creación de contenidos bilingües и el desarrollo de caminos hacia carreras ambientales.\n\nStewardWorks.space es el hogar в línea del проект Centro de Creación de Contenidos con IA и Alfabetización Ambiental, una инициатива exploratoria liderada по Nureaum, с финансированием от California Jobs First.",
    'enter.site': 'Iniciar Sesión / Crear Cuenta',
    'learn.more': 'Más Información',
    'welcome.en': 'Welcome to stewardworks.space',
    'onboard.en': 'enter here to learn in English',
    'onboard.button.en': 'Onboard',
    'welcome.es': 'Bienvenida a stewardworks.space',
    'onboard.es': 'Entra aquí para aprender en Español',
    'onboard.button.es': 'A bordo',
    'credits': 'Con el apoyo de nuestros contribuyentes fiscales',
    'onboarding.title': 'Preguntas de Incorporación',
    'onboarding.save': 'Guardar Progreso',
    'onboarding.required': 'Obligatorio',
    'onboarding.optional': 'Opcional',
    'onboarding.continue': 'Continuar',
    'onboarding.skip': 'Saltar a Revisión',
    'onboarding.q1.title': '¿Cuánto tiempo has vivido en el Valle Imperial?',
    'onboarding.q1.options': 'Menos de 1 año|1–5 años|6–10 años|Más de 10 años|Crecí aquí',
    'onboarding.q2.title': '¿Qué tipo de estudiante eres? (Selecciona todas las que correspondan)',
    'onboarding.q2.options': 'Práctico / Aprender Haciendo|Visual (Videos, Imágenes, Diagramas)|Lectura y Escritura|Aprendizaje en Grupo / Conversación|A Mi Propio Ritmo / Independiente|Otro (Describe Cuál)',
    'onboarding.q3.title': '¿Cuál es tu trabajo ambiental ideal?',
    'onboarding.q3.options': 'Educador/a Ambiental|Creador/a de Medios o Narrador/a|Trabajador/a de Conservación o Restauración|Trabajo en Agricultura o Sistemas de Agua|Técnico/a Ambiental|Organizador/a Comunitario/a|Aún no estoy seguro/a|Otro (Describe Cuál)',
    'onboarding.q4.title': '¿Cuál es tu rango de edad?',
    'onboarding.q4.options': 'Menos de 18|18–24|25–34|35–44|45 o más',
    'onboarding.q5.title': '¿Qué idioma prefieres para aprender?',
    'onboarding.q5.options': 'Inglés|Español|Inglés y Español',
    'onboarding.q6.title': '¿Qué usas normalmente para acceder a internet?',
    'onboarding.q6.options': 'Solo teléfono celular|Computadora o laptop|Tableta|Computadora pública (biblioteca, escuela, centro comunitario)|Acceso limitado o sin acceso',
    'onboarding.q7.title': '¿Te interesa recibir capacitación que pueda llevarte a un trabajo ambiental?',
    'onboarding.q7.options': 'Sí|Tal vez|Solo estoy explorando',
    'onboarding.q8.title': '¿Cuál describe mejor tu situación actual?',
    'onboarding.q8.options': 'Estoy estudiando|Trabajo de tiempo completo|Trabajo de medio tiempo|Buscando trabajo|Actualmente no trabajo|Otro',
    'onboarding.q9.title': '¿Cuánto tiempo podrías dedicar al aprendizaje cada semana?',
    'onboarding.q9.options': 'Menos de 2 horas|2–5 horas|5–10 horas|Más de 10 horas',
    'onboarding.q10.title': '¿Qué podría dificultar tu participación? (Selecciona todas las que correspondan)',
    'onboarding.q10.options': 'Horario de trabajo|Transporte|Acceso a internet o dispositivos|Cuidado de niños o responsabilidades familiares|Barreras de idioma|Ninguna de estas|Otro',
    'bulletin.title': 'Boletín del Proyecto',
    'bulletin.fyi.title': 'Información del Proyecto',
    'bulletin.faq.title': 'Preguntas Frecuentes',
    'bulletin.listening.title': 'Sesiones de Escucha Comunitaria',
    'bulletin.dates.title': 'Próximas Fechas',
    'bulletin.workshops.title': 'Talleres e Inscripciones',
    'bulletin.datacenters.title': 'Sobre los Centros de Datos',
    'bulletin.ai.title': 'Sobre la IA',
    'bulletin.background.title': 'Antecedentes del Proyecto',
    'bulletin.scroll': 'Desliza hacia abajo para más',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string) => {
    return translations[language][key as keyof typeof translations['en']] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
