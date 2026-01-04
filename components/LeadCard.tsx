import React from 'react';
import { Lead } from '../types';

interface LeadCardProps {
  lead: Lead;
}

export const LeadCard: React.FC<LeadCardProps> = ({ lead }) => {
  const getConfidenceColor = (conf: string) => {
    switch (conf) {
      case 'Verified': return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'High': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50';
      case 'Low': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      default: return 'bg-red-500/20 text-red-400 border-red-500/50';
    }
  };

  return (
    <div className="group relative p-5 rounded-2xl bg-glass-100 backdrop-blur-md border border-white/10 hover:border-ios-blue/50 transition-all duration-300 hover:shadow-[0_0_20px_rgba(10,132,255,0.1)]">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-xl font-bold text-white group-hover:text-ios-blue transition-colors">
            {lead.firstName} {lead.lastName}
          </h3>
          <p className="text-sm text-gray-400 flex items-center gap-2">
            <span className="font-medium text-gray-300">{lead.jobTitle}</span>
            <span className="text-gray-600">•</span>
            <span className="text-ios-blue">{lead.companyName}</span>
          </p>
        </div>
        <div className={`px-2 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${getConfidenceColor(lead.emailConfidence)}`}>
          {lead.emailConfidence}
        </div>
      </div>

      <div className="space-y-2 mt-4 text-sm text-gray-300">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          {lead.location}
        </div>
        
        <div className="flex items-center gap-2 overflow-hidden">
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
          <span className={lead.email === "NULL" ? "text-gray-600 italic" : "text-white select-all"}>
            {lead.email}
          </span>
        </div>

        <div className="flex items-center gap-2">
           <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
           <span className={lead.phone === "NULL" ? "text-gray-600 italic" : "text-white select-all"}>
             {lead.phone}
           </span>
        </div>

        <div className="pt-3 flex gap-3 text-xs font-semibold">
           {lead.linkedin && (
             <a href={lead.linkedin} target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300 hover:underline">LinkedIn Profile</a>
           )}
           {lead.website && (
             <a href={lead.website} target="_blank" rel="noreferrer" className="text-purple-400 hover:text-purple-300 hover:underline">Company Site</a>
           )}
        </div>
      </div>
    </div>
  );
};