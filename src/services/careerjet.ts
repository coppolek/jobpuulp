export interface JobSearchParams {
  keywords?: string;
  location?: string;
  radius?: number;
  sort?: string;
  page?: number;
  contract_type?: string;
  work_hours?: string;
}

export const searchJobsAPI = async (params: JobSearchParams) => {
  const response = await fetch('/api/jobs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch jobs');
  }
  
  return await response.json();
};
