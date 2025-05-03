import { useState, ChangeEvent, FormEvent, useEffect } from 'react';
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
    const searchParams = urlObj.searchParams;
    
    // Helper function to format company names professionally
    const formatCompanyName = (name: string): string => {
      // Remove common suffixes and prefixes
      const cleanName = name
        .replace(/^careers-|^jobs-|^job-|^career-/, '')
        .replace(/-careers$|-jobs$|-job$|-career$/, '')
        .replace(/-inc$|-llc$|-ltd$|-corp$|-co$/, '');
      
      // Split by common separators and format each word
      return cleanName
        .split(/[-_]/)
        .map(word => {
          // Handle common abbreviations
          const abbreviations: { [key: string]: string } = {
            'inc': 'Inc.',
            'llc': 'LLC',
            'ltd': 'Ltd.',
            'corp': 'Corp.',
            'co': 'Co.'
          };
          
          // Convert to proper case
          const formatted = word
            .split(/(?=[A-Z])/) // Split on capital letters
            .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
            .join(' ');
          
          // Check if the word is a known abbreviation
          return abbreviations[word.toLowerCase()] || formatted;
        })
        .join(' ');
    };
    
    // Extract company name from domain
    const getCompanyFromDomain = (domain: string): string => {
      // Remove common subdomains and TLDs
      const cleanDomain = domain
        .replace(/^careers\.|^jobs\.|^www\.|^job-boards\.|^about\./, '')
        .replace(/\.com$|\.org$|\.net$|\.io$|\.ai$/, '');
      
      // Get the main domain part
      const mainDomain = cleanDomain.split('.')[0];
      
      // Format the domain name professionally
      return formatCompanyName(mainDomain);
    };

    // Extract position from URL
    const getPositionFromUrl = (path: string, searchParams: URLSearchParams): string => {
      // Try to get position from search params first
      const titleParam = searchParams.get('title') || searchParams.get('q');
      if (titleParam) {
        return decodeURIComponent(titleParam)
          .replace(/["']/g, '') // Remove quotes
          .trim();
      }

      // Special handling for job boards like Eightfold: if 'pid' param exists and path is generic
      if (searchParams.get('pid')) {
        return '';
      }

      // Try to get position from path
      const pathParts = path.split('/').filter(Boolean);
      const lastPart = pathParts[pathParts.length - 1];
      const genericPaths = ['careers', 'jobs', 'positions', 'search', 'openings', 'opportunities'];
      if (lastPart && !genericPaths.includes(lastPart.toLowerCase())) {
        const positionPart = lastPart.replace(/^\d+-/, '');
        return positionPart
          .split(/[-_]/)
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
      }
      // If last part is generic, return empty string to prompt manual entry
      return '';
    };

    // Extract location from URL
    const getLocationFromUrl = (searchParams: URLSearchParams): string => {
      const locations = searchParams.getAll('location');
      if (locations.length > 0) {
        return locations
          .map(loc => decodeURIComponent(loc))
          .join(', ');
      }
      return '';
    };

    // Get company name from domain
    const company = getCompanyFromDomain(hostname);
    
    // Get position from URL
    const position = getPositionFromUrl(pathname, searchParams);
    
    // Get location from URL
    const location = getLocationFromUrl(searchParams);

    return { company, position, location };
  } catch (error) {
    console.error('Error parsing URL:', error);
    return { company: '', position: '', location: '' };
  }
};

function App() {
  // Load applications from localStorage on initial render
  const [applications, setApplications] = useState<JobApplication[]>(() => {
    const savedApplications = localStorage.getItem('jobApplications');
    return savedApplications ? JSON.parse(savedApplications) : [];
  });

  // Save applications to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('jobApplications', JSON.stringify(applications));
  }, [applications]);

  const [newApplication, setNewApplication] = useState<Partial<JobApplication>>({
    company: '',
    position: '',
    location: '',
    status: 'Applied',
    appliedDate: format(new Date(), 'yyyy-MM-dd'),
    jobLink: '',
    interviewDate: '',
    interviewTime: '',
  });
  const [editingApplication, setEditingApplication] = useState<string | null>(null);
  const [hasTriedParse, setHasTriedParse] = useState(false);

  // Add export functionality
  const handleExportData = () => {
    const dataStr = JSON.stringify(applications, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `job-applications-${format(new Date(), 'yyyy-MM-dd')}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // Add CSV export functionality
  const handleExportCSV = () => {
    if (applications.length === 0) return;
    // Define user-friendly headers and mapping
    const headers = [
      'Company',
      'Position',
      'Location',
      'Status',
      'Date Applied',
      'Interview Date',
      'Interview Time',
      'Job Link',
    ];
    const csvRows = [
      headers.join(','),
      ...applications.map(app => {
        // Use the raw jobLink URL (quoted)
        let jobLinkDisplay = app.jobLink ?? '';
        // Format interview time as 12-hour with AM/PM
        let interviewTimeDisplay = '';
        if (app.interviewTime) {
          const [hours, minutes] = app.interviewTime.split(':');
          const date = new Date();
          date.setHours(parseInt(hours, 10));
          date.setMinutes(parseInt(minutes, 10));
          interviewTimeDisplay = format(date, 'h:mm a');
        }
        // Ensure interview date is always just the date string
        let interviewDateDisplay = app.interviewDate ?? '';
        return [
          JSON.stringify(app.company ?? ''),
          JSON.stringify(app.position ?? ''),
          JSON.stringify(app.location ?? ''),
          JSON.stringify(app.status ?? ''),
          JSON.stringify(app.appliedDate ?? ''),
          JSON.stringify(interviewDateDisplay),
          JSON.stringify(interviewTimeDisplay),
          JSON.stringify(jobLinkDisplay)
        ].join(',');
      })
    ].join('\r\n');

    const blob = new Blob([csvRows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `job-applications-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Add import functionality
  const handleImportData = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedData = JSON.parse(e.target?.result as string);
          if (Array.isArray(importedData)) {
            setApplications(importedData);
          }
        } catch (error) {
          console.error('Error importing data:', error);
          alert('Error importing data. Please make sure the file is valid.');
        }
      };
      reader.readAsText(file);
    }
  };

  // Add clear all data functionality
  const handleClearData = () => {
    if (window.confirm('Are you sure you want to clear all your job applications? This cannot be undone.')) {
      setApplications([]);
      localStorage.removeItem('jobApplications');
    }
  };

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
      interviewDate: newApplication.interviewDate || '',
      interviewTime: newApplication.interviewTime || '',
    };
    
    setApplications([...applications, application]);
    setNewApplication({
      company: '',
      position: '',
      location: '',
      status: 'Applied',
      appliedDate: format(new Date(), 'yyyy-MM-dd'),
      jobLink: '',
      interviewDate: '',
      interviewTime: '',
    });
  };

  const handleStatusChange = (id: string, status: ApplicationStatus) => {
    setApplications(applications.map((app: JobApplication) => 
      app.id === id ? { ...app, status } : app
    ));
  };

  const handleInterviewDetailsChange = (id: string, field: 'interviewDate' | 'interviewTime', value: string) => {
    setApplications(applications.map((app: JobApplication) => 
      app.id === id ? { ...app, [field]: value } : app
    ));
  };

  const startEditing = (id: string) => {
    setEditingApplication(id);
  };

  const stopEditing = () => {
    setEditingApplication(null);
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
        position: position === undefined ? prev.position : position,
        location: location || prev.location
      }));
      setHasTriedParse(true);
    }
  };

  const handleDeleteApplication = (id: string) => {
    setApplications(applications.filter(app => app.id !== id));
  };

  const formatInterviewDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return format(date, 'MMMM d, yyyy');
    } catch (error) {
      return dateStr;
    }
  };

  const formatInterviewTime = (timeStr: string) => {
    try {
      // Convert 24-hour time to 12-hour time with AM/PM
      const [hours, minutes] = timeStr.split(':');
      const date = new Date();
      date.setHours(parseInt(hours, 10));
      date.setMinutes(parseInt(minutes, 10));
      return format(date, 'h:mm a');
    } catch (error) {
      return timeStr;
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
          
          {/* Add data management buttons */}
          <div className="mt-4 flex justify-center gap-4">
            <button
              onClick={handleExportData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-colors duration-200"
            >
              Export Data
            </button>
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-colors duration-200"
            >
              Export as CSV
            </button>
            <label className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-colors duration-200 cursor-pointer">
              Import Data
              <input
                type="file"
                accept=".json"
                onChange={handleImportData}
                className="hidden"
              />
            </label>
            <button
              onClick={handleClearData}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-colors duration-200"
            >
              Clear All Data
            </button>
          </div>
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
              {hasTriedParse && newApplication.position === '' && (
                <p className="mt-1 text-sm text-red-400">Can't fetch job title. Please enter it manually.</p>
              )}
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
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"></th>
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
                      {app.status === 'Interview' && (
                        <div className="flex flex-col gap-2">
                          {editingApplication === app.id ? (
                            <>
                              <div>
                                <label className="block text-xs text-gray-400 mb-1">Date</label>
                                <input
                                  type="date"
                                  value={app.interviewDate}
                                  onChange={(e) => handleInterviewDetailsChange(app.id, 'interviewDate', e.target.value)}
                                  className="text-sm rounded-md bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-400 mb-1">Time</label>
                                <input
                                  type="time"
                                  value={app.interviewTime}
                                  onChange={(e) => handleInterviewDetailsChange(app.id, 'interviewTime', e.target.value)}
                                  className="text-sm rounded-md bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              </div>
                              <button
                                onClick={stopEditing}
                                className="text-xs text-blue-400 hover:text-blue-300 mt-1"
                              >
                                Done
                              </button>
                            </>
                          ) : (
                            <>
                              {app.interviewDate && (
                                <span className="text-gray-300">Date: {formatInterviewDate(app.interviewDate)}</span>
                              )}
                              {app.interviewTime && (
                                <span className="text-gray-300">Time: {formatInterviewTime(app.interviewTime)}</span>
                              )}
                              <button
                                onClick={() => startEditing(app.id)}
                                className="text-xs text-blue-400 hover:text-blue-300 mt-1"
                              >
                                Edit
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDeleteApplication(app.id)}
                        className="text-red-400 hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-800 rounded-full p-1 transition-colors duration-200"
                        title="Delete application"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
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