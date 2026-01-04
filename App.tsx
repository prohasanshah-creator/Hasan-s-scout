import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Lead, SearchCriteria, ScoutStatus } from './types';
import { findLeads } from './services/geminiService';
import { SearchForm } from './components/SearchForm';
import { LeadCard } from './components/LeadCard';

// Helper to validate email format (RFC 5322 compliant regex)
const isValidEmail = (email: string) => {
  if (!email || email === "NULL") return false;
  const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
};

export default function App() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [status, setStatus] = useState<ScoutStatus>({
    isSearching: false,
    isLooping: false,
    totalFound: 0,
    lastSearchTime: null,
    logs: []
  });
  const [currentCriteria, setCurrentCriteria] = useState<SearchCriteria | null>(null);
  const [quotaHit, setQuotaHit] = useState(false);
  
  // Persist data
  useEffect(() => {
    const saved = localStorage.getItem('hasan_scout_leads');
    if (saved) {
      try {
        setLeads(JSON.parse(saved));
      } catch (e) { console.error("Failed to load saved leads"); }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('hasan_scout_leads', JSON.stringify(leads));
    setStatus(prev => ({...prev, totalFound: leads.length}));
  }, [leads]);

  // Logging
  const addLog = (msg: string) => {
    setStatus(prev => ({
      ...prev,
      logs: [msg, ...prev.logs].slice(0, 5) // Keep last 5 logs
    }));
  };

  // Main Search Function
  const executeSearch = useCallback(async (criteria: SearchCriteria) => {
    if (quotaHit) {
        alert("Daily quota reached. Please try again tomorrow.");
        return;
    }
    
    setStatus(prev => ({ ...prev, isSearching: true }));
    addLog("Initiating Scout Sequence...");

    try {
      // Create a set of existing identifiers to prevent duplicates
      const existingIds = new Set<string>(leads.map(l => l.email === "NULL" ? l.linkedin : l.email));
      
      const newLeads = await findLeads(criteria, existingIds);
      
      // Strict Email Validation Pass
      const validatedLeads = newLeads.map(lead => {
         if (lead.email !== "NULL" && !isValidEmail(lead.email)) {
             return { ...lead, email: "NULL" as const, emailConfidence: 'Low' as const }; // Downgrade invalid emails
         }
         return lead;
      });

      // Filter duplicates again just in case API returned some
      const uniqueNewLeads = validatedLeads.filter(lead => {
        const id = lead.email !== "NULL" ? lead.email : lead.linkedin;
        if (!id) return true; // Keep if no ID to check against? No, maybe filtering by name+company
        return !existingIds.has(id);
      });

      if (uniqueNewLeads.length > 0) {
        setLeads(prev => [...uniqueNewLeads, ...prev]);
        addLog(`Scout returned ${uniqueNewLeads.length} new agents.`);
      } else {
        addLog("Scout returned no new unique leads this cycle.");
      }

      setStatus(prev => ({
        ...prev,
        isSearching: false,
        lastSearchTime: new Date().toLocaleTimeString()
      }));

    } catch (error: any) {
      // Critical Error Handling for Quota Limits
      if (error.message === "QUOTA_EXCEEDED") {
          const logMsg = "CRITICAL: Daily Search Quota Hit (100/day). Pausing.";
          setStatus(prev => ({ 
              ...prev, 
              isLooping: false, 
              isSearching: false 
          }));
          setQuotaHit(true);
          addLog(logMsg);
          // Show non-blocking notification or alert
          setTimeout(() => alert("DAILY LIMIT REACHED: Google Search Grounding quota exceeded.\n\nAutomation paused. Try again in 24 hours."), 100);
          return;
      }

      console.error(error);
      addLog("Scout encountered an error.");
      setStatus(prev => ({ ...prev, isSearching: false }));
    }
  }, [leads, quotaHit]);

  // Manual Trigger
  const handleSearch = (criteria: SearchCriteria) => {
    setCurrentCriteria(criteria);
    executeSearch(criteria);
  };

  // Auto-Looping Logic
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;
    if (status.isLooping && currentCriteria && !status.isSearching && !quotaHit) {
       // Loop every 60 seconds
       intervalId = setInterval(() => {
          if (leads.length < currentCriteria.resultsAmount) {
             executeSearch(currentCriteria);
          } else {
             setStatus(prev => ({...prev, isLooping: false})); // Stop if goal reached
             addLog("Goal reached. Looping disabled.");
          }
       }, 60000);
    }
    return () => clearInterval(intervalId);
  }, [status.isLooping, status.isSearching, currentCriteria, leads.length, executeSearch, quotaHit]);

  const toggleLoop = () => {
    if (!currentCriteria && !status.isLooping) {
        alert("Please perform a search first to set criteria.");
        return;
    }
    if (quotaHit) {
        alert("Cannot loop: Quota exceeded.");
        return;
    }
    setStatus(prev => ({ ...prev, isLooping: !prev.isLooping }));
  };

  // Data Export
  const downloadCSV = () => {
    const headers = ["First Name", "Last Name", "Email", "Job Title", "Company", "Location", "Phone", "LinkedIn", "Website", "Confidence"];
    const rows = leads.map(l => [
      l.firstName, l.lastName, l.email, l.jobTitle, l.companyName, l.location, l.phone, l.linkedin, l.website, l.emailConfidence
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(c => `"${c}"`).join(','))].join('\n');
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "hasan_scout_leads.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyEmails = () => {
    const emails = leads
      .map(l => l.email)
      .filter(e => e !== "NULL" && isValidEmail(e))
      .join('\n');
    navigator.clipboard.writeText(emails);
    addLog("Valid emails copied to clipboard.");
  };

  const clearData = () => {
      if(window.confirm("Clear all gathered leads?")) {
          setLeads([]);
          localStorage.removeItem('hasan_scout_leads');
      }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-ios-blue selection:text-white">
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] opacity-40"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] opacity-40"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <header className="mb-10 text-center space-y-2">
          <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">
            HASAN'S SCOUT
          </h1>
          <p className="text-gray-400 font-light tracking-wide text-lg">
            God-Level Reverse Recruiting Agent
          </p>
        </header>

        {/* Search & Controls Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Left: Input Form */}
          <div className="lg:col-span-2">
            <div className="bg-glass-100 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl">
              <SearchForm 
                onSearch={handleSearch} 
                isLoading={status.isSearching} 
                loopActive={status.isLooping} 
              />
            </div>
          </div>

          {/* Right: Status & Actions */}
          <div className="space-y-6">
            {/* Status Card */}
            <div className={`bg-glass-100 backdrop-blur-xl border ${quotaHit ? 'border-red-500/50' : 'border-white/10'} rounded-3xl p-6 shadow-xl transition-colors duration-500`}>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${quotaHit ? 'bg-red-500' : status.isLooping ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></span>
                {quotaHit ? "System Halted (Quota)" : "System Status"}
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                   <span className="text-gray-400">Total Leads</span>
                   <span className="text-2xl font-mono font-bold text-white">{status.totalFound}</span>
                </div>
                <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                   <span className="text-gray-400">Last Scan</span>
                   <span className="text-white">{status.lastSearchTime || "N/A"}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                   <span className="text-gray-400">Auto-Loop</span>
                   <button 
                     onClick={toggleLoop}
                     disabled={quotaHit}
                     className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                       quotaHit ? 'bg-red-900/50 text-red-300 cursor-not-allowed' :
                       status.isLooping ? 'bg-green-500 text-black' : 'bg-gray-700 text-gray-300'
                     }`}
                   >
                     {quotaHit ? 'DISABLED' : status.isLooping ? 'ON (1m)' : 'OFF'}
                   </button>
                </div>
              </div>
              
              {/* Logs */}
              <div className="mt-6 bg-black/40 rounded-lg p-3 h-32 overflow-y-auto text-xs font-mono text-gray-500 space-y-1">
                {status.logs.map((log, i) => (
                  <div key={i} className={log.includes("CRITICAL") ? "text-red-400 font-bold" : ""}>&gt; {log}</div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={copyEmails}
                className="col-span-2 bg-glass-200 hover:bg-glass-300 border border-white/10 text-white py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                Copy All Emails
              </button>
              <button 
                onClick={downloadCSV}
                className="bg-ios-blue/10 hover:bg-ios-blue/20 border border-ios-blue/30 text-ios-blue py-3 rounded-xl font-semibold transition-all"
              >
                Export CSV
              </button>
               <button 
                onClick={clearData}
                className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 py-3 rounded-xl font-semibold transition-all"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Results Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Scout Results</h2>
            {currentCriteria && !status.isSearching && !quotaHit && (
               <button 
                onClick={() => executeSearch(currentCriteria)}
                className="text-sm text-ios-blue hover:text-white transition-colors"
               >
                 + Find More Now
               </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {leads.map((lead) => (
              <LeadCard key={lead.id} lead={lead} />
            ))}
          </div>
          
          {leads.length === 0 && !status.isSearching && (
            <div className="text-center py-20 opacity-30">
              <h4 className="text-2xl font-bold">No leads scouted yet.</h4>
              <p>Enter criteria and start the engine.</p>
            </div>
          )}
          
          {status.isSearching && (
             <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ios-blue"></div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}