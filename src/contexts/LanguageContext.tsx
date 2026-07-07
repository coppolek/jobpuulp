import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'it';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, Record<string, string>> = {
  en: {
    'nav.home': 'Home',
    'nav.dashboard': 'Dashboard',
    'nav.signin': 'Sign In with Google',
    'nav.signout': 'Sign Out',
    'home.hero.title': 'Find your next job.',
    'home.hero.subtitle': 'Search millions of jobs from thousands of job boards, newspapers, classifieds and company websites.',
    'home.search.placeholder': 'Job title, keywords, or company',
    'home.location.placeholder': 'City, state, or zip',
    'home.search.button': 'Search Jobs',
    'home.search.searching': 'Searching...',
    'home.filters.show': 'Advanced filters',
    'home.filters.hide': 'Hide advanced filters',
    'home.filters.contract.any': 'Any Contract Type',
    'home.filters.contract.permanent': 'Permanent',
    'home.filters.contract.contract': 'Contract',
    'home.filters.contract.temp': 'Temporary',
    'home.filters.contract.internship': 'Internship/Training',
    'home.filters.contract.volunteer': 'Volunteer',
    'home.filters.hours.any': 'Any Work Hours',
    'home.filters.hours.full': 'Full-time',
    'home.filters.hours.part': 'Part-time',
    'home.filters.sort.relevance': 'Sort by Relevance',
    'home.filters.sort.date': 'Sort by Date',
    'home.filters.sort.salary': 'Sort by Salary',
    'home.results.showing': 'Showing',
    'home.results.of': 'of',
    'home.results.jobs': 'jobs',
    'home.empty.title': 'Ready for your next role?',
    'home.empty.subtitle': 'Enter a job title or location above to start searching.',
    'home.page': 'Page',
    'job.save': 'Save Job',
    'job.saved': 'Saved',
    'job.share': 'Share',
    'job.details': 'View Details',
    'job.apply': 'Apply Now',
    'job.description': 'Job Description',
    'dashboard.title': 'My Dashboard',
    'dashboard.subtitle': 'Manage your saved jobs and track your applications.',
    'dashboard.saved_jobs': 'Saved Jobs',
    'dashboard.empty.title': 'No saved jobs yet',
    'dashboard.empty.subtitle': 'Jobs you save will appear here. Start searching to find your next opportunity.',
    'dashboard.empty.action': 'Find Jobs',
    'dashboard.remove': 'Remove',
    'dashboard.stats.saved': 'Saved Jobs',
    'dashboard.stats.applications': 'Applications',
    'dashboard.stats.interviews': 'Interviews',
    'dashboard.settings': 'Settings',
    'dashboard.backup': 'Backup Data',
    'dashboard.alert.auth': 'Please sign in to view your dashboard',
    'error.signin': 'Please sign in to save jobs.',
    'error.search': 'Failed to search jobs. Please try again.',
    'error.multiple_locations': 'Multiple locations found',
    'error.select_location': 'Please select the specific location you meant:',
    'dashboard.cv': 'My CV',
    'cv.title': 'Curriculum Vitae',
    'cv.subtitle': 'Update your resume to apply for jobs faster.',
    'cv.summary': 'Professional Summary',
    'cv.summary_placeholder': 'A brief summary of your professional background...',
    'cv.experience': 'Experience',
    'cv.experience_placeholder': 'Your work experience...',
    'cv.education': 'Education',
    'cv.education_placeholder': 'Your educational background...',
    'cv.skills': 'Skills',
    'cv.skills_placeholder': 'e.g., React, TypeScript, Node.js',
    'cv.save': 'Save CV',
    'cv.saving': 'Saving...',
    'cv.saved': 'CV saved successfully!',
  },
  it: {
    'nav.home': 'Home',
    'nav.dashboard': 'Bacheca',
    'nav.signin': 'Accedi con Google',
    'nav.signout': 'Esci',
    'home.hero.title': 'Trova il tuo prossimo lavoro.',
    'home.hero.subtitle': 'Cerca milioni di lavori da migliaia di bacheche di lavoro, giornali, annunci e siti web aziendali.',
    'home.search.placeholder': 'Titolo del lavoro, parole chiave o azienda',
    'home.location.placeholder': 'Città, stato o cap',
    'home.search.button': 'Cerca Lavoro',
    'home.search.searching': 'Ricerca in corso...',
    'home.filters.show': 'Filtri avanzati',
    'home.filters.hide': 'Nascondi filtri avanzati',
    'home.filters.contract.any': 'Qualsiasi contratto',
    'home.filters.contract.permanent': 'A tempo indeterminato',
    'home.filters.contract.contract': 'A contratto',
    'home.filters.contract.temp': 'Temporaneo',
    'home.filters.contract.internship': 'Stage/Tirocinio',
    'home.filters.contract.volunteer': 'Volontariato',
    'home.filters.hours.any': 'Qualsiasi orario',
    'home.filters.hours.full': 'Tempo pieno',
    'home.filters.hours.part': 'Part-time',
    'home.filters.sort.relevance': 'Ordina per Rilevanza',
    'home.filters.sort.date': 'Ordina per Data',
    'home.filters.sort.salary': 'Ordina per Stipendio',
    'home.results.showing': 'Visualizzati',
    'home.results.of': 'di',
    'home.results.jobs': 'lavori',
    'home.empty.title': 'Pronto per il tuo prossimo ruolo?',
    'home.empty.subtitle': 'Inserisci un titolo o una posizione qui sopra per iniziare a cercare.',
    'home.page': 'Pagina',
    'job.save': 'Salva',
    'job.saved': 'Salvato',
    'job.share': 'Condividi',
    'job.details': 'Dettagli',
    'job.apply': 'Candidati Ora',
    'job.description': 'Descrizione del lavoro',
    'dashboard.title': 'La mia bacheca',
    'dashboard.subtitle': 'Gestisci i tuoi lavori salvati e monitora le tue candidature.',
    'dashboard.saved_jobs': 'Lavori Salvati',
    'dashboard.empty.title': 'Nessun lavoro salvato',
    'dashboard.empty.subtitle': 'I lavori che salvi appariranno qui. Inizia a cercare per trovare la tua prossima opportunità.',
    'dashboard.empty.action': 'Trova Lavoro',
    'dashboard.remove': 'Rimuovi',
    'dashboard.stats.saved': 'Lavori Salvati',
    'dashboard.stats.applications': 'Candidature',
    'dashboard.stats.interviews': 'Colloqui',
    'dashboard.settings': 'Impostazioni',
    'dashboard.backup': 'Backup Dati',
    'dashboard.alert.auth': 'Accedi per visualizzare la tua bacheca',
    'error.signin': 'Accedi per salvare i lavori.',
    'error.search': 'Ricerca fallita. Riprova.',
    'error.multiple_locations': 'Trovate più località',
    'error.select_location': 'Seleziona la località specifica che intendevi:',
    'dashboard.cv': 'Il mio CV',
    'cv.title': 'Curriculum Vitae',
    'cv.subtitle': 'Aggiorna il tuo CV per candidarti più velocemente.',
    'cv.summary': 'Profilo Professionale',
    'cv.summary_placeholder': 'Un breve riassunto del tuo background professionale...',
    'cv.experience': 'Esperienza Lavorativa',
    'cv.experience_placeholder': 'La tua esperienza lavorativa...',
    'cv.education': 'Formazione',
    'cv.education_placeholder': 'Il tuo percorso di studi...',
    'cv.skills': 'Competenze',
    'cv.skills_placeholder': 'es. React, TypeScript, Node.js',
    'cv.save': 'Salva CV',
    'cv.saving': 'Salvataggio in corso...',
    'cv.saved': 'CV salvato con successo!',
  }
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('app_language');
    if (saved === 'en' || saved === 'it') return saved;
    const browserLang = navigator.language.split('-')[0];
    return browserLang === 'it' ? 'it' : 'en';
  });

  useEffect(() => {
    localStorage.setItem('app_language', language);
  }, [language]);

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
