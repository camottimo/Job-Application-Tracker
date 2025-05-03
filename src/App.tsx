import React, { useState, ChangeEvent, FormEvent } from 'react';
import { format } from 'date-fns';

type ApplicationStatus = 'Applied' | 'Interview' | 'Offer' | 'Rejected';

interface JobApplication {
  id: string;
  company: string;
  position: string;
  location: string;
  status: ApplicationStatus;
  appliedDate: string;
  interviewDate?: string;
  interviewTime?: string;
  notes?: string;
  jobLink?: string;
}

const parseJobUrl = async (url: string): Promise<{ company: string; position: string; location: string }> => {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    const pathname = urlObj.pathname;
    
    // Extract company name from domain or path
    const getCompanyFromUrl = (domain: string, path: string): string => {
      // First try to get company from path (for job boards)
      const pathParts = path.split('/');
      const companyIndex = pathParts.findIndex(part => 
        part === 'jobs' || part === 'careers' || part === 'job'
      );
      
      if (companyIndex > 0) {
        const companyPart = pathParts[companyIndex - 1];
        if (companyPart && companyPart !== 'www' && companyPart !== 'careers' && companyPart !== 'jobs') {
          return companyPart
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
        }
      }
      
      // If no company in path, try domain
      const cleanDomain = domain
        .replace(/^careers\.|^jobs\.|^www\.|^job-boards\./, '') // Remove common subdomains
        .replace(/\.com$|\.org$|\.net$|\.io$|\.ai$/, ''); // Remove TLDs
      
      // Split by dots and take the first part
      const companyPart = cleanDomain.split('.')[0];
      
      // Handle special cases
      const specialCases: { [key: string]: string } = {
        'aexp': 'American Express',
        'adobe': 'Adobe',
        'indeed': 'Indeed',
        'linkedin': 'LinkedIn',
        'greenhouse': 'Greenhouse'
      };
      
      if (specialCases[companyPart]) {
        return specialCases[companyPart];
      }
      
      // Convert to proper case for other companies
      return companyPart
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    };

    // Extract position from URL
    const getPositionFromUrl = async (path: string, hostname: string): Promise<string> => {
      const pathParts = path.split('/');
      
      // Try to find position after 'jobs' or 'job'
      const jobIndex = pathParts.findIndex(part => part === 'jobs' || part === 'job');
      if (jobIndex !== -1) {
        // For Greenhouse.io format
        if (hostname.includes('greenhouse.io')) {
          const jobId = pathParts[jobIndex + 1]?.split('?')[0];
          if (jobId) {
            try {
              // Try to fetch job details from Greenhouse API
              const response = await fetch(`https://boards-api.greenhouse.io/v1/boards/${pathParts[jobIndex - 1]}/jobs/${jobId}`);
              if (response.ok) {
                const data = await response.json();
                return data.title || jobId;
              }
            } catch (error) {
              console.error('Error fetching job details:', error);
            }
          }
        }
        
        // For other formats where position is after 'jobs'
        if (pathParts[jobIndex + 1]) {
          const positionPart = pathParts[jobIndex + 1];
          // Remove any query parameters
          const cleanPosition = positionPart.split('?')[0];
          return cleanPosition
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
        }
      }
      
      // Fallback to last part of URL
      const lastPart = pathParts[pathParts.length - 1].split('?')[0];
      return lastPart
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    };

    // Extract location from URL or job details
    const getLocationFromUrl = async (path: string, hostname: string): Promise<string> => {
      // For Greenhouse.io format
      if (hostname.includes('greenhouse.io')) {
        const pathParts = path.split('/');
        const jobIndex = pathParts.findIndex(part => part === 'jobs');
        if (jobIndex !== -1) {
          const jobId = pathParts[jobIndex + 1]?.split('?')[0];
          if (jobId) {
            try {
              // Try to fetch job details from Greenhouse API
              const response = await fetch(`https://boards-api.greenhouse.io/v1/boards/${pathParts[jobIndex - 1]}/jobs/${jobId}`);
              if (response.ok) {
                const data = await response.json();
                if (data.offices && data.offices.length > 0) {
                  // Handle multiple locations
                  const locations = data.offices.map((office: any) => office.name);
                  return locations.join('; ');
                }
              }
            } catch (error) {
              console.error('Error fetching job details:', error);
            }
          }
        }
      }

      // For LinkedIn format
      if (hostname.includes('linkedin.com')) {
        const pathParts = path.split('/');
        const jobIndex = pathParts.findIndex(part => part === 'jobs' || part === 'job');
        if (jobIndex !== -1) {
          try {
            // Try to extract location from the job title or description
            const jobTitle = pathParts[jobIndex + 1];
            if (jobTitle) {
              const locationMatch = jobTitle.match(/(?:in|at|from)\s+([^,]+(?:,\s*[^,]+)*)/i);
              if (locationMatch) {
                return locationMatch[1].trim();
              }
            }
          } catch (error) {
            console.error('Error parsing LinkedIn location:', error);
          }
        }
      }

      // Default to empty string if no location found
      return '';
    };

    const company = getCompanyFromUrl(hostname, pathname);
    const position = await getPositionFromUrl(pathname, hostname);
    const location = await getLocationFromUrl(pathname, hostname);

    return { company, position, location };
  } catch (error) {
    console.error('Error parsing URL:', error);
  }
  
  return { company: '', position: '', location: '' };
};

function App() {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [newApplication, setNewApplication] = useState<Partial<JobApplication>>({
    company: '',
    position: '',
    location: '',
    status: 'Applied',
    appliedDate: format(new Date(), 'yyyy-MM-dd'),
    jobLink: '',
  });

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const application: JobApplication = {
      id: crypto.randomUUID(),
      company: newApplication.company || '',
      position: newApplication.position || '',
      location: newApplication.location || '',
      status: newApplication.status || 'Applied',
      appliedDate: newApplication.appliedDate || format(new Date(), 'yyyy-MM-dd'),
      jobLink: newApplication.jobLink || '',
    };
    
    setApplications([...applications, application]);
    setNewApplication({
      company: '',
      position: '',
      location: '',
      status: 'Applied',
      appliedDate: format(new Date(), 'yyyy-MM-dd'),
      jobLink: '',
    });
  };

  const handleStatusChange = (id: string, status: ApplicationStatus) => {
    setApplications(applications.map((app: JobApplication) => 
      app.id === id ? { ...app, status } : app
    ));
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewApplication((prev: Partial<JobApplication>) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleParseUrl = async () => {
    if (newApplication.jobLink) {
      const { company, position, location } = await parseJobUrl(newApplication.jobLink);
      setNewApplication((prev: Partial<JobApplication>) => ({
        ...prev,
        company: company || prev.company,
        position: position || prev.position,
        location: location || prev.location
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Job Application Tracker
          </h1>
          <p className="text-gray-400">Keep track of your job applications and interviews</p>
        </div>
        
        <form onSubmit={handleSubmit} className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-xl shadow-xl mb-8 border border-gray-700">
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Job URL</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  name="jobLink"
                  value={newApplication.jobLink}
                  onChange={handleInputChange}
                  placeholder="https://..."
                  className="flex-1 px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={handleParseUrl}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-colors duration-200"
                >
                  Parse URL
                </button>
              </div>
              <p className="mt-1 text-sm text-gray-400">Paste the job posting URL and click Parse URL to auto-fill company and position</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Company</label>
              <input
                type="text"
                name="company"
                value={newApplication.company}
                onChange={handleInputChange}
                className="w-full px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Position</label>
              <input
                type="text"
                name="position"
                value={newApplication.position}
                onChange={handleInputChange}
                className="w-full px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Location</label>
              <input
                type="text"
                name="location"
                value={newApplication.location}
                onChange={handleInputChange}
                placeholder="City, State or Remote"
                className="w-full px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
              <select
                name="status"
                value={newApplication.status}
                onChange={handleInputChange}
                className="w-full px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Applied">Applied</option>
                <option value="Interview">Interview</option>
                <option value="Offer">Offer</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Applied Date</label>
              <input
                type="date"
                name="appliedDate"
                value={newApplication.appliedDate}
                onChange={handleInputChange}
                className="w-full px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            {newApplication.status === 'Interview' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Interview Date</label>
                  <input
                    type="date"
                    name="interviewDate"
                    value={newApplication.interviewDate}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Interview Time</label>
                  <input
                    type="time"
                    name="interviewTime"
                    value={newApplication.interviewTime}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </>
            )}
          </div>
          <div className="mt-6">
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-all duration-200"
            >
              Add Application
            </button>
          </div>
        </form>

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-xl border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-700/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Company</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Position</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Applied Date</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Interview</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-700/30 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">{app.company}</div>
                      {app.jobLink && (
                        <a 
                          href={app.jobLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-blue-400 hover:text-blue-300"
                        >
                          View Job
                        </a>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{app.position}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{app.location}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={app.status}
                        onChange={(e) => handleStatusChange(app.id, e.target.value as ApplicationStatus)}
                        className="text-sm rounded-md bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="Applied">Applied</option>
                        <option value="Interview">Interview</option>
                        <option value="Offer">Offer</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{app.appliedDate}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {app.status === 'Interview' && app.interviewDate && (
                        <span>{app.interviewDate} {app.interviewTime}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App; 