import React, { useContext, useState } from 'react';
import { AppContext } from './AppContext';

const mockProfiles = [
  { id: 'ADM-01', name: 'Zentryx Master', role: 'ADMIN', title: 'System Administrator' },
  { id: 'MGR-01', name: 'Rini Oktaviani', role: 'MANAGER', title: 'Operations Manager' },
  { id: 'EXC-01', name: 'Sarah Chen', role: 'EXECUTIVE', title: 'Chief Supply Chain Officer' },
  { id: 'OPR-01', name: 'Alex Wibowo', role: 'OPERATOR', title: 'Scanner & Logistics Operator' }
];

const Login = () => {
  const { setUser, setHalaman } = useContext(AppContext);
  const [selectedProfile, setSelectedProfile] = useState(mockProfiles[1]); // Default to Manager
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API Network Delay
    setTimeout(() => {
      setUser(selectedProfile);
      
      // Auto-route based on role
      if (selectedProfile.role === 'OPERATOR') setHalaman('receivePO');
      else if (selectedProfile.role === 'EXECUTIVE') setHalaman('supplyChainDashboard');
      else setHalaman('dashboard');
      
      setIsLoading(false);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center relative overflow-hidden font-sans">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#125ab2] blur-[150px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600 blur-[150px] rounded-full"></div>
      </div>

      <div className="w-full max-w-[420px] bg-white rounded-sm shadow-2xl z-10 overflow-hidden animate-fade-in">
        <div className="bg-[#125ab2] p-8 text-center border-b-4 border-emerald-500">
          <h1 className="text-4xl font-black text-white tracking-widest leading-none mb-2">ZENTRYX</h1>
          <p className="text-[10px] text-blue-200 font-bold uppercase tracking-widest">Enterprise Gigafactory WMS</p>
        </div>
        
        <form onSubmit={handleLogin} className="p-8 space-y-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-slate-800">Authentication Portal</h2>
            <p className="text-xs text-slate-500 mt-1">Select a demo profile to establish access clearance.</p>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Clearance Profile</label>
            <div className="space-y-3">
              {mockProfiles.map(profile => (
                <div 
                  key={profile.id} 
                  onClick={() => setSelectedProfile(profile)}
                  className={`p-3 border-2 rounded-sm cursor-pointer transition-all flex items-center justify-between ${
                    selectedProfile.id === profile.id ? 'border-[#125ab2] bg-blue-50' : 'border-slate-200 hover:border-blue-300'
                  }`}
                >
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{profile.name}</p>
                    <p className="text-[10px] text-slate-500">{profile.title}</p>
                  </div>
                  <span className={`px-2 py-1 text-[9px] font-black uppercase tracking-wider rounded-sm ${
                    profile.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
                    profile.role === 'EXECUTIVE' ? 'bg-amber-100 text-amber-800' :
                    profile.role === 'MANAGER' ? 'bg-emerald-100 text-emerald-800' :
                    'bg-slate-200 text-slate-700'
                  }`}>
                    {profile.role}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-[#125ab2] hover:bg-[#0e4487] text-white py-4 rounded-sm font-black uppercase tracking-widest shadow-md transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
          >
            {isLoading ? <span className="animate-pulse">Authenticating...</span> : <span>Initiate Session ➔</span>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;