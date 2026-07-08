import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { X, ExternalLink, Briefcase, MapPin, DollarSign, Calendar, Building2, Send, CheckCircle, Star } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, addDoc, orderBy } from 'firebase/firestore';
import { BannerRenderer } from './BannerRenderer';

interface JobModalProps {
  job: any;
  onClose: () => void;
}

export function JobModal({ job, onClose }: JobModalProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [banners, setBanners] = useState<any[]>([]);
  
  const [message, setMessage] = useState('');
  const [senderEmail, setSenderEmail] = useState(user?.email || '');
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  // Ratings State
  const [ratings, setRatings] = useState<any[]>([]);
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  useEffect(() => {
    if (user?.email && !senderEmail) {
      setSenderEmail(user.email);
    }
  }, [user]);

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

  useEffect(() => {
    if (job?.isLocal && job?.id) {
      loadRatings();
    }
  }, [job]);

  const loadRatings = async () => {
    try {
      const q = query(collection(db, 'local_job_ratings'), where('jobId', '==', job.id));
      const querySnapshot = await getDocs(q);
      const ratingsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRatings(ratingsData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      console.error('Error fetching ratings', error);
    }
  };

  if (!job) return null;

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message || !senderEmail) return;
    
    setIsSending(true);
    try {
      await addDoc(collection(db, 'local_job_messages'), {
        jobId: job.id,
        jobTitle: job.title,
        receiverId: job.userId || null,
        receiverEmail: job.email,
        senderEmail,
        senderId: user?.uid || null,
        message,
        createdAt: new Date().toISOString()
      });
      setSent(true);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Si è verificato un errore durante l\'invio. Riprova più tardi.');
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmitRating = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('Devi aver effettuato l\'accesso per lasciare una recensione.');
      return;
    }
    if (newRating === 0) {
      alert('Seleziona un voto da 1 a 5 stelle.');
      return;
    }
    
    setIsSubmittingRating(true);
    try {
      await addDoc(collection(db, 'local_job_ratings'), {
        jobId: job.id,
        userId: user.uid,
        userDisplayName: user.displayName || 'Utente',
        rating: newRating,
        comment: newComment,
        createdAt: new Date().toISOString()
      });
      setNewRating(0);
      setNewComment('');
      loadRatings();
    } catch (error) {
      console.error('Error submitting rating:', error);
      alert('Errore durante l\'inserimento della recensione.');
    } finally {
      setIsSubmittingRating(false);
    }
  };

  // Clean description for meta tag
  const cleanDescription = job.description?.replace(/<[^>]*>?/gm, '').substring(0, 160) || '';

  const averageRating = ratings.length > 0 
    ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1)
    : null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4 sm:p-6">
      <Helmet>
        <title>{`${job.title} presso ${job.company} - puulp.it`}</title>
        <meta name="description" content={cleanDescription} />
        {job.url && <link rel="canonical" href={job.url} />}
      </Helmet>
      
      <div className="bg-white border border-gray-200 rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden relative shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-white/80 backdrop-blur sticky top-0 z-10">
          <div className="flex-1 min-w-0 pr-4">
            <h2 className="text-xl font-bold text-gray-900 truncate">{job.title}</h2>
            <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
              <span className="flex items-center gap-1"><Building2 className="h-4 w-4" /> {job.company}</span>
              {job.isLocal && averageRating && (
                <span className="flex items-center gap-1 ml-2 text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full text-xs font-bold">
                  <Star className="h-3 w-3 fill-current" /> {averageRating} ({ratings.length})
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!job.isLocal && (
              <a 
                href={job.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors hidden sm:flex items-center gap-2 text-sm font-medium shadow-sm"
              >
                <ExternalLink className="h-4 w-4" /> {t('nav.signin') === 'Accedi' ? 'Apri annuncio' : 'Open Job'}
              </a>
            )}
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
                {job.isLocal && job.createdAtTime 
                  ? new Date(job.createdAtTime).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
                  : new Date(job.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
            <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
              <Briefcase className="h-5 w-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">{job.site}</span>
            </div>
          </div>

          <div className="prose max-w-none mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Descrizione</h3>
            <div 
              className="text-gray-600 leading-relaxed whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: job.description }}
            />
          </div>
          
          {job.isLocal && (
            <div className="mt-10 space-y-8">
              {/* Ratings Section */}
              <div className="pt-8 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recensioni e Commenti</h3>
                
                {ratings.length > 0 ? (
                  <div className="space-y-4 mb-8">
                    {ratings.map(rating => (
                      <div key={rating.id} className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm text-gray-900">{rating.userDisplayName}</span>
                          <span className="text-xs text-gray-500">{new Date(rating.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1 mb-2">
                          {[1, 2, 3, 4, 5].map(star => (
                            <Star key={star} className={`h-4 w-4 ${star <= rating.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
                          ))}
                        </div>
                        {rating.comment && (
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{rating.comment}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 mb-8">Nessuna recensione presente per questo annuncio.</p>
                )}

                {user ? (
                  <form onSubmit={handleSubmitRating} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                    <h4 className="font-medium text-gray-900 mb-4">Lascia una recensione</h4>
                    <div className="mb-4">
                      <label className="block text-sm text-gray-700 mb-2">Voto *</label>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setNewRating(star)}
                            className="p-1 focus:outline-none"
                          >
                            <Star className={`h-6 w-6 transition-colors ${star <= newRating ? 'fill-amber-400 text-amber-400' : 'text-gray-300 hover:text-amber-200'}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm text-gray-700 mb-2">Commento (opzionale)</label>
                      <textarea
                        rows={3}
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 text-sm"
                        placeholder="Scrivi la tua esperienza..."
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmittingRating || newRating === 0}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-70 text-sm shadow-sm"
                    >
                      {isSubmittingRating ? 'Invio in corso...' : 'Invia Recensione'}
                    </button>
                  </form>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center">
                    <p className="text-sm text-gray-600 mb-3">Devi accedere per lasciare una recensione.</p>
                  </div>
                )}
              </div>

              {/* Contact Section */}
              <div className="pt-8 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Contatta l'inserzionista direttamente
                </h3>
                
                {sent ? (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center animate-in fade-in slide-in-from-bottom-2">
                    <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-3" />
                    <h4 className="text-green-800 font-medium mb-1">Messaggio inviato!</h4>
                    <p className="text-sm text-green-700">L'inserzionista riceverà il tuo messaggio nel suo pannello di controllo.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSendMessage} className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">La tua Email *</label>
                      <input
                        type="email"
                        required
                        value={senderEmail}
                        onChange={(e) => setSenderEmail(e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 text-sm"
                        placeholder="La tua email per essere ricontattato"
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Messaggio *</label>
                      <textarea
                        required
                        rows={4}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 text-sm"
                        placeholder={job.type === 'job' ? "Scrivi il tuo messaggio o presenta la tua candidatura..." : "Scrivi un messaggio per proporre un'offerta..."}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isSending}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-70 flex items-center justify-center gap-2 text-sm shadow-sm"
                    >
                      <Send className="h-4 w-4" />
                      {isSending ? 'Invio in corso...' : 'Invia Messaggio'}
                    </button>
                    <p className="text-xs text-gray-500 text-center mt-3">
                      Il messaggio verrà recapitato privatamente all'inserzionista.
                    </p>
                  </form>
                )}
              </div>
            </div>
          )}

          {!job.isLocal && (
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
          )}
        </div>
      </div>
    </div>
  );
}
