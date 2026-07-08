import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';

export async function getLocalJobs(keywords: string, location: string) {
  try {
    const q = query(
      collection(db, 'local_jobs'),
      where('isActive', '==', true)
    );
    const querySnapshot = await getDocs(q);
    const jobs = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        isLocal: true,
        url: `#local-job-${doc.id}`,
        title: data.title,
        company: data.type === 'job' ? (data.company || 'Azienda Privata') : (data.company || 'Candidato'),
        locations: data.location,
        site: data.type === 'job' ? 'puulp.it (Offerta di Lavoro)' : 'puulp.it (Candidato)',
        date: data.createdAt,
        salary: '',
        description: `${data.description}\n\nEmail di contatto: <a href="mailto:${data.email}">${data.email}</a>${data.phone ? `\nTelefono: <a href="tel:${data.phone}">${data.phone}</a>` : ''}`,
        type: data.type,
        userId: data.userId || null,
        email: data.email,
        phone: data.phone || '',
        createdAtTime: new Date(data.createdAt || 0).getTime()
      };
    });

    const keywordLower = keywords.toLowerCase();
    const locationLower = location.toLowerCase();

    const filtered = jobs.filter(job => {
      const matchKeyword = !keywordLower || job.title.toLowerCase().includes(keywordLower) || job.description.toLowerCase().includes(keywordLower);
      const matchLocation = !locationLower || job.locations.toLowerCase().includes(locationLower);
      return matchKeyword && matchLocation;
    });

    return filtered.sort((a, b) => b.createdAtTime - a.createdAtTime);
  } catch (error) {
    console.error('Error fetching local jobs:', error);
    return [];
  }
}
