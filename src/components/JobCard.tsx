import React from 'react';
import { MapPin, Bookmark, BookmarkCheck, Share2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { Job } from '../types';

interface JobCardProps {
  key?: React.Key;
  job: any; // Keeping any to match existing implementation temporarily, can be updated to Job type
  isSaved: boolean;
  onSaveToggle: (job: any) => void;
  onShare: (job: any) => void;
  onViewDetails?: (job: any) => void;
}

export function JobCard({ job, isSaved, onSaveToggle, onShare, onViewDetails }: JobCardProps) {
  const { t } = useLanguage();

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 hover:border-gray-300 transition-colors flex flex-col h-full shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">{job.title}</h3>
          <p className="text-gray-600 font-medium">{job.company}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onSaveToggle(job)}
            className="p-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
            title={isSaved ? t('job.saved') : t('job.save')}
          >
            {isSaved ? <BookmarkCheck className="h-5 w-5 text-blue-600" /> : <Bookmark className="h-5 w-5" />}
          </button>
          <button
            onClick={() => onShare(job)}
            className="p-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
            title={t('job.share')}
          >
            <Share2 className="h-5 w-5" />
          </button>
        </div>
      </div>
      <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
        <div className="flex items-center gap-1">
          <MapPin className="h-4 w-4" />
          <span className="line-clamp-1">{job.locations}</span>
        </div>
        {job.salary && (
          <div className="flex items-center gap-1 text-emerald-600 font-medium">
            <span>{job.salary}</span>
          </div>
        )}
      </div>
      <p className="text-sm text-gray-600 line-clamp-3 mb-6 flex-1">
        {job.description}
      </p>
      <div className="flex justify-between items-center mt-auto">
        <span className="text-xs text-gray-400">Posted on {job.site}</span>
        {onViewDetails ? (
          <button
            onClick={() => onViewDetails(job)}
            className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            {t('job.apply')} &rarr;
          </button>
        ) : (
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            {t('job.apply')} &rarr;
          </a>
        )}
      </div>
    </div>
  );
}
