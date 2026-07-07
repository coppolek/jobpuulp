import React from 'react';
import { X, ExternalLink } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface JobModalProps {
  job: any;
  onClose: () => void;
}

export function JobModal({ job, onClose }: JobModalProps) {
  const { t } = useLanguage();

  if (!job) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4 sm:p-6">
      <div className="bg-white border border-gray-200 rounded-xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden relative shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-white/80 backdrop-blur">
          <div className="flex-1 min-w-0 pr-4">
            <h2 className="text-lg font-semibold text-gray-900 truncate">{job.title}</h2>
            <p className="text-sm text-gray-500 truncate">{job.company} &bull; {job.locations}</p>
          </div>
          <div className="flex items-center gap-2">
            <a 
              href={job.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors hidden sm:flex items-center gap-2 text-sm font-medium"
            >
              <ExternalLink className="h-4 w-4" /> Open in New Tab
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
        <div className="flex-1 w-full bg-white relative">
          <iframe 
            src={job.url} 
            className="w-full h-full border-none"
            title="Job Details"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
          />
        </div>
      </div>
    </div>
  );
}
