import React, { useState, ChangeEvent, FormEvent } from 'react';
import { format } from 'date-fns';

type ApplicationStatus = 'Applied' | 'Interview' | 'Offer' | 'Rejected';

interface JobApplication {
  id: string;
  company: string;
  position: string;
  status: ApplicationStatus;
  appliedDate: string;
  interviewDate?: string;
  interviewTime?: string;
  notes?: string;
  jobLink?: string;
}

function App() {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [newApplication, setNewApplication] = useState<Partial<JobApplication>>({
    company: '',
    position: '',
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
      status: newApplication.status || 'Applied',
      appliedDate: newApplication.appliedDate || format(new Date(), 'yyyy-MM-dd'),
      jobLink: newApplication.jobLink || '',
    };
    
    setApplications([...applications, application]);
    setNewApplication({
      company: '',
      position: '',
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              <label className="block text-sm font-medium text-gray-300 mb-2">Job Link</label>
              <input
                type="url"
                name="jobLink"
                value={newApplication.jobLink}
                onChange={handleInputChange}
                placeholder="https://..."
                className="w-full px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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