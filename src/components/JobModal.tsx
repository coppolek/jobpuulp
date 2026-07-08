import React, { useState, useEffect } from 'react';
import { X, ExternalLink, Briefcase, MapPin, DollarSign, Calendar, Building2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { BannerRenderer } from './BannerRenderer';

interface JobModalProps {
  job: any;
  onClose: () => void;
}

export function JobModal({ job, onClose }: JobModalProps) {
  const { t } = useLanguage();
  const [banners, setBanners] = useState<any[]>([]);

  useEffect(() => {
    const loadBanners = async () => {
      try {
        const q = query(collection(db, 'banners'), where('isActive', '==', true), where('position', '==', 'job_popup'));
        const querySnapshot = await getDocs(q);
        const bannersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setBanners(bannersData);
      } catch (error) {
        console.error('Error fetching banners', error);
      }
    };
    loadBanners();
  }, []);

  if (!job) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4 sm:p-6">
      <div className="bg-white border border-gray-200 rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden relative shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-white/80 backdrop-blur sticky top-0 z-10">
          <div className="flex-1 min-w-0 pr-4">
            <h2 className="text-xl font-bold text-gray-900 truncate">{job.title}</h2>
            <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
              <span className="flex items-center gap-1"><Building2 className="h-4 w-4" /> {job.company}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a 
              href={job.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors hidden sm:flex items-center gap-2 text-sm font-medium shadow-sm"
            >
              <ExternalLink className="h-4 w-4" /> {t('nav.signin') === 'Accedi' ? 'Apri annuncio' : 'Open Job'}
            </a>
            <button 
              onClick={onClose}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-colors"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        <div className="flex-1 w-full bg-white relative overflow-y-auto p-6">
          {banners.length > 0 && (
            <div className="mb-6">
              <BannerRenderer banners={banners} position="job_popup" />
            </div>
          )}

          <div className="flex flex-wrap gap-4 mb-8">
            <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
              <MapPin className="h-5 w-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">{job.locations || 'Remote'}</span>
            </div>
            {job.salary && (
              <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
                <DollarSign className="h-5 w-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">{job.salary}</span>
              </div>
            )}
            <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
              <Calendar className="h-5 w-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">
                {new Date(job.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
            <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
              <Briefcase className="h-5 w-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">{job.site}</span>
            </div>
          </div>

          <div className="prose max-w-none">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Descrizione</h3>
            <div 
              className="text-gray-600 leading-relaxed whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: job.description }}
            />
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-100 flex justify-center sm:hidden">
            <a 
              href={job.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full justify-center px-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center gap-2 text-sm font-medium shadow-sm"
            >
              <ExternalLink className="h-4 w-4" /> {t('nav.signin') === 'Accedi' ? 'Apri annuncio originale' : 'Open Original Job'}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
