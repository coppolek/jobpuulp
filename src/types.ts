export interface Job {
  id: string;
  title: string;
  company: string;
  locations: string;
  url: string;
  date: string;
  description: string;
  salary: string;
  site: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
}

export interface SavedJob extends Job {
  savedAt: string;
}

export interface JobApplication {
  id: string;
  jobId: string;
  title: string;
  company: string;
  status: 'Applied' | 'Interview' | 'Offer' | 'Rejected';
  appliedAt: string;
  notes?: string;
}


