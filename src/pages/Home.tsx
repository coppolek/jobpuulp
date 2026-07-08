import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Search, MapPin, Filter, Map, Briefcase, Clock, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, deleteDoc, doc, query, where, getDocs } from 'firebase/firestore';
import { searchJobsAPI } from '../services/careerjet';
import { JobCard } from '../components/JobCard';
import { JobModal } from '../components/JobModal';
import { BannerRenderer } from '../components/BannerRenderer';

export function Home() {
  const { user, signInWithGoogle } = useAuth();
  const { t } = useLanguage();
  
  // Search state
  const [keywords, setKeywords] = useState('');
  const [location, setLocation] = useState('');
  const [radius, setRadius] = useState(50);
  const [sort, setSort] = useState('relevance');
  const [contractType, setContractType] = useState('');
  const [workHours, setWorkHours] = useState('');
  
  // Results state
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalHits, setTotalHits] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [locationsSuggestion, setLocationsSuggestion] = useState<string[]>([]);
  
  // Interaction state
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set());
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [warningMsg, setWarningMsg] = useState<string | null>(null);
  const [banners, setBanners] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      loadSavedJobs();
    } else {
      setSavedJobs(new Set());
    }
  }, [user]);

  useEffect(() => {
    const loadBanners = async () => {
      try {
        const q = query(collection(db, 'banners'), where('isActive', '==', true));
        const querySnapshot = await getDocs(q);
        const bannersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setBanners(bannersData);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'banners');
      }
    };
    loadBanners();
  }, []);

  const loadSavedJobs = async () => {
    if (!user) return;
    try {
      const q = query(collection(db, 'savedJobs'), where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      const saved = new Set<string>();
      querySnapshot.forEach((doc) => {
        saved.add(doc.data().jobId);
      });
      setSavedJobs(saved);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'savedJobs');
    }
  };

  const executeSearch = async (pageToFetch: number = 1, locOverride?: string) => {
    setLoading(true);
    setLocationsSuggestion([]);
    setErrorMsg(null);
    setWarningMsg(null);
    
    try {
      const response = await searchJobsAPI({ 
        keywords, 
        location: locOverride || location, 
        radius, 
        sort, 
        page: pageToFetch,
        contract_type: contractType || undefined,
        work_hours: workHours || undefined
      });
      
      if (response.error) {
        setErrorMsg(response.error || t('error.search'));
        setJobs([]);
        setTotalHits(0);
        setTotalPages(0);
      } else if (response.type === 'LOCATIONS') {
        setLocationsSuggestion(response.locations || []);
        setJobs([]);
        setTotalHits(0);
        setTotalPages(0);
      } else if (response.type === 'JOBS') {
        setJobs(response.jobs || []);
        setTotalHits(response.hits || 0);
        setTotalPages(response.pages || 0);
        setCurrentPage(pageToFetch);
        if (response.warning) setWarningMsg(response.warning);
        if (locOverride) setLocation(locOverride);
      } else {
        setJobs([]);
        setTotalHits(0);
        setTotalPages(0);
      }
    } catch (error: any) {
      console.error('Error fetching jobs:', error);
      setErrorMsg(t('error.search'));
    }
    setLoading(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(1);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      executeSearch(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSaveJob = async (job: any) => {
    if (!user) {
      alert(t('error.signin'));
      return;
    }
    
    try {
      if (savedJobs.has(job.url)) {
        const q = query(collection(db, 'savedJobs'), where('userId', '==', user.uid), where('jobId', '==', job.url));
        const querySnapshot = await getDocs(q);
        const deletePromises: Promise<void>[] = [];
        querySnapshot.forEach((docSnapshot) => {
          deletePromises.push(deleteDoc(doc(db, 'savedJobs', docSnapshot.id)));
        });
        await Promise.all(deletePromises);
        
        setSavedJobs(prev => {
          const next = new Set(prev);
          next.delete(job.url);
          return next;
        });
      } else {
        await addDoc(collection(db, 'savedJobs'), {
          userId: user.uid,
          jobId: job.url,
          title: job.title || '',
          company: job.company || '',
          locations: job.locations || '',
          url: job.url || '',
          date: job.date || '',
          description: job.description || '',
          salary: job.salary || '',
          site: job.site || '',
          savedAt: new Date().toISOString()
        });
        setSavedJobs(prev => new Set(prev).add(job.url));
      }
    } catch (error) {
      if (savedJobs.has(job.url)) {
        handleFirestoreError(error, OperationType.DELETE, 'savedJobs');
      } else {
        handleFirestoreError(error, OperationType.CREATE, 'savedJobs');
      }
    }
  };

  const handleShare = async (job: any) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: job.title,
          text: `Check out this job at ${job.company}`,
          url: job.url,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(job.url);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Before Search Banners */}
      <BannerRenderer banners={banners} position="before_search" />

      {/* Registration Banner */}
      {!user && (
        <div className="bg-indigo-600 text-white rounded-2xl p-4 sm:p-6 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-full hidden sm:block">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bell-ring"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/><path d="M4 2C2.8 3.7 2 5.7 2 8"/><path d="M22 8c0-2.3-.8-4.3-2-6"/></svg>
            </div>
            <div>
              <p className="font-medium text-lg">{t('home.register_banner')}</p>
            </div>
          </div>
          <button 
            onClick={signInWithGoogle}
            className="whitespace-nowrap bg-white text-indigo-600 hover:bg-indigo-50 px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm"
          >
            {t('home.register_button')}
          </button>
        </div>
      )}

      {/* Search Hero Section */}
      <section className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm">
        <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-gray-900">
          {t('home.hero.title')}
        </h1>
        <p className="text-gray-600 mb-8">{t('home.hero.subtitle')}</p>
        
        <form onSubmit={handleSearchSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-5 relative">
              <Search className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder={t('home.search.placeholder')}
                className="w-full bg-white border border-gray-300 rounded-xl py-3 pl-12 pr-4 text-base focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 placeholder:text-gray-400"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
              />
            </div>
            <div className="md:col-span-4 relative">
              <MapPin className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder={t('home.location.placeholder')}
                className="w-full bg-white border border-gray-300 rounded-xl py-3 pl-12 pr-4 text-base focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 placeholder:text-gray-400"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <div className="md:col-span-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 px-4 font-semibold text-base transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <span className="animate-pulse">{t('home.search.searching')}</span> : t('home.search.button')}
              </button>
            </div>
          </div>

          {/* Advanced Filters Toggle */}
          <div>
            <button 
              type="button" 
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
            >
              <Filter className="h-4 w-4" /> 
              {showAdvanced ? t('home.filters.hide') : t('home.filters.show')}
            </button>
            
            {showAdvanced && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200 animate-in fade-in slide-in-from-top-2">
                <div className="relative">
                  <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <select
                    className="w-full bg-white border border-gray-300 rounded-lg py-2.5 pl-9 pr-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none text-gray-700"
                    value={contractType}
                    onChange={(e) => setContractType(e.target.value)}
                  >
                    <option value="">{t('home.filters.contract.any')}</option>
                    <option value="p">{t('home.filters.contract.permanent')}</option>
                    <option value="c">{t('home.filters.contract.contract')}</option>
                    <option value="t">{t('home.filters.contract.temp')}</option>
                    <option value="i">{t('home.filters.contract.internship')}</option>
                    <option value="v">{t('home.filters.contract.volunteer')}</option>
                  </select>
                </div>
                <div className="relative">
                  <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <select
                    className="w-full bg-white border border-gray-300 rounded-lg py-2.5 pl-9 pr-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none text-gray-700"
                    value={workHours}
                    onChange={(e) => setWorkHours(e.target.value)}
                  >
                    <option value="">{t('home.filters.hours.any')}</option>
                    <option value="f">{t('home.filters.hours.full')}</option>
                    <option value="p">{t('home.filters.hours.part')}</option>
                  </select>
                </div>
                <div className="relative">
                  <Filter className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <select
                    className="w-full bg-white border border-gray-300 rounded-lg py-2.5 pl-9 pr-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none text-gray-700"
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                  >
                    <option value="relevance">{t('home.filters.sort.relevance')}</option>
                    <option value="date">{t('home.filters.sort.date')}</option>
                    <option value="salary">{t('home.filters.sort.salary')}</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </form>
      </section>

      {/* Main Content Area */}
      <section>
        {/* Error Message */}
        {errorMsg && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-8 flex items-start gap-3 animate-in fade-in zoom-in-95">
            <div className="bg-red-100 p-2 rounded-lg">
              <span className="text-red-600 font-bold">!</span>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-red-800 mb-1">{t('error.search_title')}</h3>
              <p className="text-sm text-red-600">{errorMsg}</p>
            </div>
          </div>
        )}
        
        {/* Warning Message */}
        {warningMsg && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 flex items-start gap-3 animate-in fade-in zoom-in-95">
            <div className="bg-amber-100 p-2 rounded-lg">
              <span className="text-amber-600 font-bold">!</span>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-amber-800 mb-1">Avviso</h3>
              <p className="text-sm text-amber-700">{warningMsg}</p>
            </div>
          </div>
        )}

        {/* Disambiguation for Locations */}
        {locationsSuggestion.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-8 text-center animate-in fade-in zoom-in-95">
            <Map className="h-10 w-10 text-amber-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-amber-800 mb-2">{t('error.multiple_locations')}</h3>
            <p className="text-amber-700 mb-4">{t('error.select_location')}</p>
            <div className="flex flex-wrap justify-center gap-2">
              {locationsSuggestion.map((loc, idx) => (
                <button
                  key={idx}
                  onClick={() => executeSearch(1, loc)}
                  className="bg-white hover:bg-amber-100 text-amber-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-amber-200"
                >
                  {loc}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results Header */}
        {!loading && jobs.length > 0 && (
          <div className="mb-6 flex justify-between items-center text-sm text-gray-500">
            <p>{t('home.results.showing')} {((currentPage - 1) * 20) + 1}-{Math.min(currentPage * 20, totalHits)} {t('home.results.of')} <strong className="text-gray-900">{totalHits}</strong> {t('home.results.jobs')}</p>
          </div>
        )}

        {/* Job List */}
        <div className="space-y-4">
          {jobs.map((job, idx) => (
            <JobCard
              key={idx}
              job={job}
              isSaved={savedJobs.has(job.url)}
              onSaveToggle={handleSaveJob}
              onShare={handleShare}
              onViewDetails={async (job) => {
                if (!user) {
                  alert(t('error.apply_signin'));
                  try {
                    await signInWithGoogle();
                  } catch (e) {
                    console.error(e);
                  }
                  return;
                }
                setSelectedJob(job);
              }}
            />
          ))}
        </div>

        {/* Empty State */}
        {!loading && jobs.length === 0 && locationsSuggestion.length === 0 && (
          <div className="text-center py-20 text-gray-500 bg-gray-50 rounded-2xl border border-gray-200 border-dashed">
            <Briefcase className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t('home.empty.title')}</h3>
            <p>{t('home.empty.subtitle')}</p>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="mt-12 flex items-center justify-center gap-4">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="text-sm font-medium text-gray-500">
              {t('home.page')} <span className="text-gray-900">{currentPage}</span> {t('home.results.of')} <span className="text-gray-900">{totalPages}</span>
            </div>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* After Search Banners */}
        {!loading && jobs.length > 0 && (
          <div className="mt-8">
            <BannerRenderer banners={banners} position="after_search" />
          </div>
        )}
      </section>

      {/* Modal Overlay */}
      {selectedJob && (
        <JobModal 
          job={selectedJob} 
          onClose={() => setSelectedJob(null)} 
        />
      )}
    </div>
  );
}
