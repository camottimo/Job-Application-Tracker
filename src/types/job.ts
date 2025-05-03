export type ApplicationStatus = 'Applied' | 'Interview' | 'Offer' | 'Rejected';

export interface JobApplication {
  id: string;
  company: string;
  position: string;
  status: ApplicationStatus;
  appliedDate: string;
  interviewDate?: string;
  interviewTime?: string;
  notes?: string;
} 