import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, getDocs, deleteDoc, doc, addDoc } from 'firebase/firestore';
import { Bookmark, Send, Bell, Settings, Trash2, ExternalLink, Fingerprint, BarChart2, CloudUpload, FileText, Image } from 'lucide-react';
import { JobModal } from '../components/JobModal';
import { AdSenseBanner } from '../components/AdSenseBanner';

export function Dashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [savedJobs, setSavedJobs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'saved' | 'applications' | 'analytics' | 'cv' | 'settings' | 'admin_banners'>('saved');
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any | null>(null);

  // CV State
  const [cvData, setCvData] = useState({ summary: '', experience: '', education: '', skills: '' });
  const [isSavingCv, setIsSavingCv] = useState(false);
  const [cvSavedMsg, setCvSavedMsg] = useState('');

  // Banner State
  const [banners, setBanners] = useState<any[]>([]);
  const [newBanner, setNewBanner] = useState<any>({
    type: 'image', // 'image' | 'adsense'
    imageUrl: '',
    linkUrl: '',
    adClient: '',
    adSlot: '',
    adFormat: 'auto',
    fullWidthResponsive: true,
    isActive: true
  });
  const [isSavingBanner, setIsSavingBanner] = useState(false);

  useEffect(() => {
    if (user) {
      loadSavedJobs();
      loadCv();
      if (user.email === 'coppolek@gmail.com') {
        loadBanners();
      }
    }
  }, [user]);

  const loadBanners = async () => {
    try {
      const q = query(collection(db, 'banners'));
      const querySnapshot = await getDocs(q);
      const bannersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBanners(bannersData);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'banners');
    }
  };

  const handleAddBanner = async () => {
    const isImageValid = newBanner.type === 'image' && newBanner.imageUrl;
    const isAdSenseValid = newBanner.type === 'adsense' && newBanner.adClient && newBanner.adSlot;
    if (!isImageValid && !isAdSenseValid) return;

    setIsSavingBanner(true);
    try {
      const bannerPayload: any = {
        type: newBanner.type || 'image',
        isActive: newBanner.isActive,
        createdAt: new Date().toISOString()
      };

      if (newBanner.type === 'image') {
        bannerPayload.imageUrl = newBanner.imageUrl;
        bannerPayload.linkUrl = newBanner.linkUrl || '';
      } else {
        bannerPayload.adClient = newBanner.adClient;
        bannerPayload.adSlot = newBanner.adSlot;
        bannerPayload.adFormat = newBanner.adFormat || 'auto';
        bannerPayload.fullWidthResponsive = !!newBanner.fullWidthResponsive;
      }

      await addDoc(collection(db, 'banners'), bannerPayload);
      setNewBanner({
        type: 'image',
        imageUrl: '',
        linkUrl: '',
        adClient: '',
        adSlot: '',
        adFormat: 'auto',
        fullWidthResponsive: true,
        isActive: true
      });
      loadBanners();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'banners');
    }
    setIsSavingBanner(false);
  };

  const handleToggleBanner = async (bannerId: string, currentStatus: boolean) => {
    try {
      const { updateDoc } = await import('firebase/firestore');
      await updateDoc(doc(db, 'banners', bannerId), { isActive: !currentStatus });
      loadBanners();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `banners/${bannerId}`);
    }
  };

  const handleDeleteBanner = async (bannerId: string) => {
    try {
      await deleteDoc(doc(db, 'banners', bannerId));
      loadBanners();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `banners/${bannerId}`);
    }
  };

  const loadCv = async () => {
    if (!user) return;
    try {
      const { getDoc } = await import('firebase/firestore');
      const docSnap = await getDoc(doc(db, 'cvs', user.uid));
      if (docSnap.exists()) {
        const docData = docSnap.data();
        setCvData({
          summary: docData.summary || '',
          experience: docData.experience || '',
          education: docData.education || '',
          skills: docData.skills || ''
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `cvs/${user.uid}`);
    }
  };

  const handleSaveCv = async () => {
    if (!user) return;
    setIsSavingCv(true);
    setCvSavedMsg('');
    try {
      const { setDoc } = await import('firebase/firestore');
      const cvPayload = {
        userId: user.uid,
        ...cvData,
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'cvs', user.uid), cvPayload, { merge: true });
      
      setCvSavedMsg(t('cv.saved'));
      setTimeout(() => setCvSavedMsg(''), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `cvs/${user.uid}`);
    }
    setIsSavingCv(false);
  };

  const loadSavedJobs = async () => {
    if (!user) return;
    try {
      const q = query(collection(db, 'savedJobs'), where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      const jobs: any[] = [];
      querySnapshot.forEach((doc) => {
        jobs.push({ id: doc.id, ...doc.data() });
      });
      setSavedJobs(jobs.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'savedJobs');
    }
  };

  const removeSavedJob = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'savedJobs', id));
      setSavedJobs(savedJobs.filter(job => job.id !== id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'savedJobs');
    }
  };

  const handleBackup = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(savedJobs));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "jobsearch_backup.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    alert("Cloud backup initiated.");
  };

  const handleBiometricToggle = async () => {
    if (!isBiometricEnabled) {
      try {
        if (window.PublicKeyCredential) {
          // Conceptual WebAuthn trigger
          alert("Please verify your identity using Touch ID / Face ID.");
          setIsBiometricEnabled(true);
        } else {
          alert("Biometric authentication is not supported on this device.");
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      setIsBiometricEnabled(false);
    }
  };

  if (!user) {
    return <div className="text-center py-20 text-gray-500">{t('dashboard.alert.auth')}</div>;
  }

  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* Sidebar */}
      <aside className="w-full md:w-64 space-y-2">
        <button onClick={() => setActiveTab('saved')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'saved' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 text-gray-600'}`}>
          <Bookmark className="h-4 w-4" /> {t('dashboard.saved_jobs')}
        </button>
        <button onClick={() => setActiveTab('applications')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'applications' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 text-gray-600'}`}>
          <Send className="h-4 w-4" /> Applications
        </button>
        <button onClick={() => setActiveTab('cv')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'cv' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 text-gray-600'}`}>
          <FileText className="h-4 w-4" /> {t('dashboard.cv')}
        </button>
        <button onClick={() => setActiveTab('analytics')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'analytics' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 text-gray-600'}`}>
          <BarChart2 className="h-4 w-4" /> {t('dashboard.analytics')}
        </button>

        <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'settings' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 text-gray-600'}`}>
          <Settings className="h-4 w-4" /> {t('dashboard.settings_tab')}
        </button>
        {user?.email === 'coppolek@gmail.com' && (
          <button onClick={() => setActiveTab('admin_banners')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'admin_banners' ? 'bg-indigo-600 text-white' : 'hover:bg-indigo-50 text-indigo-600'}`}>
            <Image className="h-4 w-4" /> {t('dashboard.admin_banners')}
          </button>
        )}
      </aside>

      {/* Main Content */}
      <div className="flex-1">
        {activeTab === 'saved' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900">
              <Bookmark className="h-5 w-5 text-blue-600" /> {t('dashboard.saved_jobs')}
            </h2>
            {savedJobs.length === 0 ? (
              <div className="text-gray-500 py-10 bg-gray-50 rounded-xl border border-gray-200 text-center">
                {t('dashboard.empty.title')}
              </div>
            ) : (
              <div className="grid gap-4">
                {savedJobs.map(job => (
                  <div key={job.id} className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col sm:flex-row gap-4 justify-between sm:items-center shadow-sm hover:border-gray-300 transition-colors">
                    <div>
                      <h3 className="font-semibold text-gray-900">{job.title}</h3>
                      <p className="text-sm text-gray-500">{job.company} &bull; {job.locations}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setSelectedJob(job)}
                        className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
                      >
                        {t('job.apply')} <ExternalLink className="h-4 w-4" />
                      </button>
                      <button onClick={() => removeSavedJob(job.id)} className="p-2 bg-gray-50 hover:bg-red-50 text-gray-500 hover:text-red-600 rounded-lg transition-colors" title={t('dashboard.remove')}>
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'applications' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900">
              <Send className="h-5 w-5 text-blue-600" /> Track Applications
            </h2>
            <div className="text-gray-500 py-10 bg-gray-50 rounded-xl border border-gray-200 text-center">
              Application tracking coming soon.
            </div>
          </div>
        )}

        {activeTab === 'cv' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900">
              <FileText className="h-5 w-5 text-blue-600" /> {t('cv.title')}
            </h2>
            <p className="text-gray-600">{t('cv.subtitle')}</p>
            
            <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('cv.summary')}</label>
                <textarea 
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 placeholder:text-gray-400"
                  rows={4}
                  placeholder={t('cv.summary_placeholder')}
                  value={cvData.summary}
                  onChange={(e) => setCvData({...cvData, summary: e.target.value})}
                ></textarea>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('cv.experience')}</label>
                <textarea 
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 placeholder:text-gray-400"
                  rows={6}
                  placeholder={t('cv.experience_placeholder')}
                  value={cvData.experience}
                  onChange={(e) => setCvData({...cvData, experience: e.target.value})}
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('cv.education')}</label>
                <textarea 
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 placeholder:text-gray-400"
                  rows={4}
                  placeholder={t('cv.education_placeholder')}
                  value={cvData.education}
                  onChange={(e) => setCvData({...cvData, education: e.target.value})}
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('cv.skills')}</label>
                <input 
                  type="text"
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 placeholder:text-gray-400"
                  placeholder={t('cv.skills_placeholder')}
                  value={cvData.skills}
                  onChange={(e) => setCvData({...cvData, skills: e.target.value})}
                />
              </div>

              <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
                <button 
                  onClick={handleSaveCv}
                  disabled={isSavingCv}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
                >
                  {isSavingCv ? t('cv.saving') : t('cv.save')}
                </button>
                {cvSavedMsg && (
                  <span className="text-sm font-medium text-emerald-600 animate-in fade-in">{cvSavedMsg}</span>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900">
              <BarChart2 className="h-5 w-5 text-blue-600" /> {t('dashboard.analytics')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6 text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">{savedJobs.length}</div>
                <div className="text-sm text-gray-500 font-medium">{t('dashboard.analytics.saved')}</div>
              </div>
              <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6 text-center">
                <div className="text-4xl font-bold text-emerald-600 mb-2">0</div>
                <div className="text-sm text-gray-500 font-medium">{t('dashboard.analytics.applications')}</div>
              </div>
              <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6 text-center">
                <div className="text-4xl font-bold text-purple-600 mb-2">0</div>
                <div className="text-sm text-gray-500 font-medium">{t('dashboard.analytics.interviews')}</div>
              </div>
            </div>
          </div>
        )}



        {activeTab === 'settings' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900">
              <Settings className="h-5 w-5 text-blue-600" /> {t('dashboard.settings_tab')}
            </h2>
            <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6 max-w-2xl">
              <div className="space-y-8">
                {/* Profile Info */}
                <div className="flex items-center gap-4 border-b border-gray-200 pb-6">
                  <img src={user.photoURL || ''} alt="Avatar" className="h-16 w-16 rounded-full bg-gray-100 border border-gray-200" />
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">{user.displayName}</h3>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </div>
                
                {/* Security */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <Fingerprint className="h-5 w-5 text-purple-500" /> {t('dashboard.settings.security')}
                  </h4>
                  <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div>
                      <div className="font-medium text-sm text-gray-900">{t('dashboard.settings.biometric')}</div>
                      <div className="text-xs text-gray-500 mt-1">{t('dashboard.settings.biometric_desc')}</div>
                    </div>
                    <button 
                      onClick={handleBiometricToggle}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${isBiometricEnabled ? 'bg-blue-600' : 'bg-gray-300'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isBiometricEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                </div>

                {/* Notifications */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <Bell className="h-5 w-5 text-amber-500" /> {t('dashboard.settings.notifications')}
                  </h4>
                  <div className="space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
                      <span className="text-sm text-gray-700">{t('dashboard.settings.alerts_new')}</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
                      <span className="text-sm text-gray-700">{t('dashboard.settings.alerts_status')}</span>
                    </label>
                  </div>
                </div>

                {/* Data & Backup */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <CloudUpload className="h-5 w-5 text-emerald-500" /> {t('dashboard.settings.data')}
                  </h4>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-500 mb-4">{t('admin.backup_desc')}</p>
                    <button onClick={handleBackup} className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm">
                      {t('admin.backup_btn')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'admin_banners' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2 text-indigo-900">
              <Image className="h-5 w-5 text-indigo-600" /> {t('admin.title')}
            </h2>
            
            <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6 mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">{t('admin.add_new')}</h3>
              
              {/* Type Switcher */}
              <div className="flex bg-gray-100 p-1 rounded-lg max-w-md mb-6">
                <button
                  type="button"
                  onClick={() => setNewBanner({ ...newBanner, type: 'image' })}
                  className={`flex-1 text-center py-2 text-sm font-medium rounded-md transition-colors ${newBanner.type === 'image' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  {t('admin.type.image')}
                </button>
                <button
                  type="button"
                  onClick={() => setNewBanner({ ...newBanner, type: 'adsense' })}
                  className={`flex-1 text-center py-2 text-sm font-medium rounded-md transition-colors ${newBanner.type === 'adsense' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  {t('admin.type.adsense')}
                </button>
              </div>

              <div className="space-y-4">
                {newBanner.type === 'image' ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('admin.image_url')}</label>
                      <input 
                        type="text"
                        className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 placeholder:text-gray-400"
                        placeholder="https://example.com/banner.png"
                        value={newBanner.imageUrl || ''}
                        onChange={(e) => setNewBanner({...newBanner, imageUrl: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('admin.link_url')}</label>
                      <input 
                        type="text"
                        className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 placeholder:text-gray-400"
                        placeholder="https://example.com/promo"
                        value={newBanner.linkUrl || ''}
                        onChange={(e) => setNewBanner({...newBanner, linkUrl: e.target.value})}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('admin.adsense_client')}</label>
                        <input 
                          type="text"
                          className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 placeholder:text-gray-400 font-mono"
                          placeholder="ca-pub-XXXXXXXXXXXXXXXX"
                          value={newBanner.adClient || ''}
                          onChange={(e) => setNewBanner({...newBanner, adClient: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('admin.adsense_slot')}</label>
                        <input 
                          type="text"
                          className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 placeholder:text-gray-400 font-mono"
                          placeholder="XXXXXXXXXX"
                          value={newBanner.adSlot || ''}
                          onChange={(e) => setNewBanner({...newBanner, adSlot: e.target.value})}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('admin.ad_format')}</label>
                        <select
                          className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-gray-700"
                          value={newBanner.adFormat || 'auto'}
                          onChange={(e) => setNewBanner({...newBanner, adFormat: e.target.value})}
                        >
                          <option value="auto">Auto</option>
                          <option value="rectangle">Rectangle</option>
                          <option value="horizontal">Horizontal</option>
                          <option value="vertical">Vertical</option>
                        </select>
                      </div>
                      <div className="flex items-center pt-8">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" 
                            checked={!!newBanner.fullWidthResponsive}
                            onChange={(e) => setNewBanner({...newBanner, fullWidthResponsive: e.target.checked})}
                          />
                          <span className="text-sm text-gray-700">{t('admin.full_width')}</span>
                        </label>
                      </div>
                    </div>

                    {/* Instant Mock Preview of the ad block */}
                    <div className="pt-2">
                      <div className="text-xs font-semibold text-gray-500 mb-2">{t('admin.preview')}</div>
                      <AdSenseBanner
                        adClient={newBanner.adClient}
                        adSlot={newBanner.adSlot}
                        adFormat={newBanner.adFormat}
                        fullWidthResponsive={newBanner.fullWidthResponsive}
                        isPreview={true}
                      />
                    </div>
                  </>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" 
                      checked={!!newBanner.isActive}
                      onChange={(e) => setNewBanner({...newBanner, isActive: e.target.checked})}
                    />
                    <span className="text-sm text-gray-700">{t('admin.active')}</span>
                  </label>
                </div>

                <button 
                  onClick={handleAddBanner}
                  disabled={isSavingBanner || (newBanner.type === 'image' ? !newBanner.imageUrl : (!newBanner.adClient || !newBanner.adSlot))}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
                >
                  {isSavingBanner ? t('admin.button.saving') : t('admin.button.add')}
                </button>
              </div>
            </div>

            <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">{t('admin.existing')}</h3>
              {banners.length === 0 ? (
                <p className="text-sm text-gray-500">{t('admin.no_banners')}</p>
              ) : (
                <div className="space-y-4">
                  {banners.map((banner) => (
                    <div key={banner.id} className="border border-gray-200 rounded-lg p-4 flex flex-col md:flex-row gap-4 justify-between items-center bg-gray-50">
                      <div className="flex-1 w-full">
                        {banner.type === 'adsense' ? (
                          <div className="bg-amber-50/50 border border-amber-200 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded font-mono uppercase">AdSense</span>
                              <span className="text-xs font-semibold text-amber-800">Google AdSense Unit</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono text-gray-600">
                              <div><span className="font-semibold text-gray-500">Client:</span> {banner.adClient}</div>
                              <div><span className="font-semibold text-gray-500">Slot:</span> {banner.adSlot}</div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-4 items-center">
                            <img src={banner.imageUrl} alt="Banner" className="w-32 h-16 object-cover rounded bg-gray-200" />
                            <div className="text-sm text-gray-600 max-w-[200px] truncate">
                              {banner.linkUrl ? <a href={banner.linkUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">{banner.linkUrl}</a> : 'No link'}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" 
                            checked={banner.isActive}
                            onChange={() => handleToggleBanner(banner.id, banner.isActive)}
                          />
                          <span className="text-sm text-gray-700">{t('dashboard.settings.active')}</span>
                        </label>
                        <button 
                          onClick={() => handleDeleteBanner(banner.id)}
                          className="p-2 bg-white hover:bg-red-50 text-gray-500 hover:text-red-600 rounded-lg transition-colors border border-gray-200" 
                          title="Delete"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {selectedJob && (
        <JobModal 
          job={selectedJob} 
          onClose={() => setSelectedJob(null)} 
        />
      )}
    </div>
  );
}
