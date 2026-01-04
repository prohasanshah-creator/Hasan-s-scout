import React, { useState } from 'react';
import { SearchCriteria } from '../types';

interface SearchFormProps {
  onSearch: (criteria: SearchCriteria) => void;
  isLoading: boolean;
  loopActive: boolean;
}

export const SearchForm: React.FC<SearchFormProps> = ({ onSearch, isLoading, loopActive }) => {
  const [formData, setFormData] = useState<SearchCriteria>({
    targetRoles: 'Software Engineer, Product Manager',
    keywords: 'SaaS, B2B, React',
    industries: 'Technology',
    location: 'San Francisco, CA',
    includeContactInfo: true,
    resultsAmount: 50
  });

  const [inputErrors, setInputErrors] = useState<{ [key: string]: string }>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Client-side validation logic for inputs (if user typed specific email/phone as keywords)
    if (name === 'keywords') {
        const emailRegex = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;
        const parts = value.split(',');
        let error = "";
        // If user tries to search for a specific email in keywords, validate it
        parts.forEach(part => {
            const trimmed = part.trim();
            if (trimmed.includes('@') && !emailRegex.test(trimmed)) {
                error = `Invalid email format in keywords: ${trimmed}`;
            }
        });
        setInputErrors(prev => ({...prev, keywords: error}));
    }

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (Object.values(inputErrors).some(err => err)) return;
    onSearch(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Target Roles</label>
          <input
            type="text"
            name="targetRoles"
            value={formData.targetRoles}
            onChange={handleChange}
            className="w-full bg-glass-100 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-ios-blue focus:ring-1 focus:ring-ios-blue transition-all placeholder-gray-600"
            placeholder="e.g. CEO, CTO, Head of Sales"
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Industries</label>
          <input
            type="text"
            name="industries"
            value={formData.industries}
            onChange={handleChange}
            className="w-full bg-glass-100 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-ios-blue focus:ring-1 focus:ring-ios-blue transition-all placeholder-gray-600"
            placeholder="e.g. Fintech, Healthtech"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Keywords (Comma Separated)</label>
        <input
          type="text"
          name="keywords"
          value={formData.keywords}
          onChange={handleChange}
          className={`w-full bg-glass-100 border ${inputErrors.keywords ? 'border-red-500' : 'border-white/10'} rounded-xl px-4 py-3 text-white focus:outline-none focus:border-ios-blue focus:ring-1 focus:ring-ios-blue transition-all placeholder-gray-600`}
          placeholder="e.g. Startups, Series A, Remote"
        />
        {inputErrors.keywords && <p className="text-red-400 text-xs">{inputErrors.keywords}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
           <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Location</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full bg-glass-100 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-ios-blue focus:ring-1 focus:ring-ios-blue transition-all placeholder-gray-600"
              placeholder="e.g. New York, London, Remote"
            />
        </div>
        <div className="space-y-2">
           <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Results Goal</label>
           <select
             name="resultsAmount"
             // @ts-ignore
             value={formData.resultsAmount}
             onChange={handleChange}
             className="w-full bg-glass-100 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-ios-blue focus:ring-1 focus:ring-ios-blue transition-all"
           >
             <option value={50}>50 Leads</option>
             <option value={100}>100 Leads</option>
             <option value={1000}>1,000 Leads</option>
             <option value={5000}>Unlimited</option>
           </select>
        </div>
      </div>

      <div className="flex items-center justify-between bg-glass-100 p-4 rounded-xl border border-white/5">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="includeContact"
            name="includeContactInfo"
            checked={formData.includeContactInfo}
            onChange={handleChange}
            className="w-5 h-5 rounded border-gray-600 text-ios-blue bg-transparent focus:ring-ios-blue focus:ring-offset-gray-900"
          />
          <label htmlFor="includeContact" className="text-sm font-medium text-gray-200 cursor-pointer select-none">
            Include Contact Info (Email & Phone)
          </label>
        </div>
        
        <button
          type="submit"
          disabled={isLoading || loopActive}
          className={`px-8 py-3 rounded-xl font-bold text-white shadow-lg transition-all ${
             isLoading || loopActive
               ? 'bg-gray-700 cursor-not-allowed opacity-50' 
               : 'bg-ios-blue hover:bg-blue-600 hover:shadow-blue-500/30 hover:scale-105'
          }`}
        >
          {isLoading ? 'Scouting...' : loopActive ? 'Auto-Scout Active' : 'Start Scout'}
        </button>
      </div>
    </form>
  );
};