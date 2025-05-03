# Job Application Tracker

A modern, responsive web application built with React and TypeScript to help job seekers track their job applications and interviews

Available at https://job-application-tracker-eosin.vercel.app/

## Features

- 📝 Track job applications with detailed information
- 🔍 Auto-parse job details from URLs (supports LinkedIn and Workday)
- 📅 Manage interview schedules
- 📊 Track application status (Applied, Interview, Offer, Rejected)
- 📱 Mobile-friendly design

## Tech Stack

- React
- TypeScript
- Tailwind CSS
- date-fns for date formatting

## Usage

1. **Adding a New Application**
   - Click the "Add Application" button
   - Fill in the required fields (Company, Position, Location)
   - Optionally paste a job posting URL and click "Parse URL" to auto-fill details
   - Set the application status
   - Add interview details if applicable

2. **Managing Applications**
   - View all applications in the table view
   - Update application status using the dropdown
   - Add or modify interview details
   - Delete applications using the delete button

3. **URL Parsing**
   - Supports LinkedIn job URLs
   - Supports Workday job URLs
   - Automatically extracts company, position, and location information

## Acknowledgments

- Built with [Create React App](https://create-react-app.dev/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Date formatting with [date-fns](https://date-fns.org/) 
