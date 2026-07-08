import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { db } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { Briefcase, Building, User, MapPin, Mail, Phone, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export function PostJob() {
  const { user } = useAuth();
  const { t } = useLanguage();
  
  const [type, setType] = useState<'job' | 'candidate'>('job');
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !location || !email) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'local_jobs'), {
        type, // 'job' = azienda che offre, 'candidate' = candidato che cerca
        title,
        company: type === 'job' ? company : user?.displayName || 'Candidato',
        location,
        description,
        email,
        phone,
        userId: user?.uid || null,
        createdAt: new Date().toISOString(),
        isActive: true
      });
      setSubmitted(true);
    } catch (error) {
      console.error('Error posting ad:', error);
      alert('Si è verificato un errore. Riprova.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <div className="bg-green-50 border border-green-200 rounded-2xl p-8">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Annuncio Pubblicato!</h2>
          <p className="text-gray-600 mb-6">Il tuo annuncio è stato inserito con successo nel nostro database.</p>
          <Link to="/" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
            Torna alla Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white text-center">
          <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-90" />
          <h1 className="text-3xl font-bold mb-2">Pubblica un Annuncio</h1>
          <p className="opacity-90">Inserisci un'offerta di lavoro o proponiti come candidato</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Tipologia */}
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setType('job')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium rounded-lg transition-colors ${type === 'job' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
            >
              <Building className="h-4 w-4" /> Azienda (Offro Lavoro)
            </button>
            <button
              type="button"
              onClick={() => setType('candidate')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium rounded-lg transition-colors ${type === 'candidate' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
            >
              <User className="h-4 w-4" /> Candidato (Cerco Lavoro)
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {type === 'job' ? 'Titolo della Posizione *' : 'Quale lavoro cerchi? *'}
              </label>
              <input
                type="text"
                required
                className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                placeholder={type === 'job' ? 'es. Sviluppatore Frontend' : 'es. Autista Patente C'}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {type === 'job' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Azienda</label>
                <input
                  type="text"
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                  placeholder="La tua azienda"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Luogo *</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  required
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg py-3 pl-10 pr-4 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                  placeholder="es. Milano o Smart Working"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email di Contatto *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    required
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg py-3 pl-10 pr-4 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                    placeholder="email@esempio.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefono (Opzionale)</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                  <input
                    type="tel"
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg py-3 pl-10 pr-4 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                    placeholder="+39 ..."
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrizione *</label>
              <textarea
                required
                rows={6}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                placeholder={type === 'job' ? 'Descrivi i requisiti, le responsabilità, ecc...' : 'Descrivi le tue esperienze, le tue competenze, ecc...'}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold transition-colors disabled:opacity-70 shadow-sm"
            >
              {isSubmitting ? 'Pubblicazione in corso...' : 'Pubblica Annuncio'}
            </button>
            <p className="text-center text-xs text-gray-500 mt-4">
              Cliccando su Pubblica, accetti i nostri termini di servizio. { !user && "Ti consigliamo di accedere prima di pubblicare per poter gestire i tuoi annunci." }
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
