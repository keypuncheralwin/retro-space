'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Rocket, Users, CheckCircle, LogIn, Layout, Zap, Star } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';

// Feature card icon wrappers using Lucide icons
const RocketIcon = ({ className = "w-12 h-12" }: { className?: string }) => (
  <div className={`rounded-full flex items-center justify-center ${className}`}>
    <Rocket className="w-full h-full" />
  </div>
);

const TeamIcon = ({ className = "w-12 h-12" }: { className?: string }) => (
  <div className={`rounded-full flex items-center justify-center ${className}`}>
    <Users className="w-full h-full" />
  </div>
);

const ActionIcon = ({ className = "w-12 h-12" }: { className?: string }) => (
  <div className={`rounded-full flex items-center justify-center ${className}`}>
    <CheckCircle className="w-full h-full" />
  </div>
);

// Logo component
const Logo = () => (
  <div className="flex items-center gap-2">
    <div className="text-blue-600 w-6 h-6">
      <Rocket size={24} />
    </div>
    <span className="font-bold text-lg">Retro Space</span>
  </div>
);

export default function HomePage() {
  const [retroCode, setRetroCode] = useState('');

  const handleJoinRetro = (e: React.FormEvent) => {
    e.preventDefault();
    if (retroCode.trim()) {
      console.log('Joining retro with code:', retroCode);
    }
  };

  return (
    <main className="flex flex-col min-h-screen bg-[#0E0525] text-white relative">
      <div className="absolute inset-0 bg-space-dots pointer-events-none"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-[#0c1e44]/30 to-[#0E0525] pointer-events-none"></div>
      {/* Navigation */}
      <Navbar transparent={true} />

      {/* Hero Section */}
      <section className="pt-32 pb-16 relative z-10">
        <div className="container mx-auto px-4 relative z-10 text-center max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-6">
            Taking Retrospectives To A <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">New Orbit</span>
          </h1>
          <p className="text-lg text-blue-100 mb-8">
            A collaborative platform for teams to run effective sprint retrospectives. Create and join retrospective boards, add sticky notes, and collaborate in real-time.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth"
              className="inline-flex items-center justify-center rounded-md text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-800 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 bg-gradient-to-r from-blue-800 to-indigo-900 hover:from-blue-900 hover:to-indigo-950 text-white h-11 px-6 py-2 shadow-lg shadow-blue-800/20 transform hover:scale-[1.02] transition-transform duration-300">
              Sign in to create a retro
            </Link>
            <a
              href="#join-retro"
              className="inline-flex items-center justify-center rounded-md text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-800 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 border border-blue-800/30 bg-slate-800/50 backdrop-blur-sm text-blue-100 hover:bg-slate-800 hover:border-blue-500/50 h-11 px-6 py-2 shadow-lg shadow-blue-800/10">
              Join an existing retro
            </a>
          </div>
        </div>
      </section>

      {/* Why Teams Love Retro Space */}
      <section className="py-20 text-white relative z-10">
        <div className="container mx-auto px-4 relative">
          <h2 className="text-3xl font-bold text-center mb-16 text-white">Why Teams Love Retro Space</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="flex flex-col items-center text-center p-6 bg-slate-800/50 backdrop-blur-sm rounded-xl border border-blue-800/20 shadow-lg hover:shadow-blue-800/10 transform hover:-translate-y-1 transition-all duration-300">
              <div className="bg-gradient-to-b from-blue-800 to-indigo-900 rounded-full p-5 mb-5 shadow-lg shadow-blue-800/20">
                <TeamIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-blue-200">Real-time Collaboration</h3>
              <p className="text-slate-300">
                Work together in real-time, just like you would with physical sticky notes, but better.
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-6 bg-slate-800/50 backdrop-blur-sm rounded-xl border border-blue-800/20 shadow-lg hover:shadow-blue-800/10 transform hover:-translate-y-1 transition-all duration-300">
              <div className="bg-gradient-to-b from-blue-800 to-indigo-900 rounded-full p-5 mb-5 shadow-lg shadow-blue-800/20">
                <LogIn className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-blue-200">No Login Required to Join</h3>
              <p className="text-slate-300">
                Participants can easily join with just a room code — no accounts or logins needed.
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-6 bg-slate-800/50 backdrop-blur-sm rounded-xl border border-blue-800/20 shadow-lg hover:shadow-blue-800/10 transform hover:-translate-y-1 transition-all duration-300">
              <div className="bg-gradient-to-b from-blue-800 to-indigo-900 rounded-full p-5 mb-5 shadow-lg shadow-blue-800/20">
                <Layout className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-blue-200">Flexible Templates</h3>
              <p className="text-slate-300">
                Choose from multiple retrospective formats or create your own custom template.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Join a Retro Section */}
      <section id="join-retro" className="py-20 text-white relative z-10">
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-10 max-w-6xl mx-auto">
            {/* Left Side - Text Content */}
            <div className="md:w-1/2 text-left">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Join an existing retrospective</h2>
              <p className="text-blue-200 mb-8 max-w-lg">
                Enter the room code you received from your team lead or facilitator to join the retrospective session.
              </p>
            </div>
            
            {/* Right Side - Form */}
            <div className="md:w-1/2">
              <div className="bg-slate-800/80 backdrop-blur-sm p-8 rounded-lg border border-blue-800/30 shadow-lg shadow-blue-800/10 max-w-md mx-auto">
                <div className="mb-4">
                  <div className="text-blue-200 font-medium mb-1">Room Code</div>
                  <input
                    type="text"
                    value={retroCode}
                    onChange={(e) => setRetroCode(e.target.value.toUpperCase())}
                    placeholder="Enter your 6-digit room code"
                    className="w-full bg-slate-900/70 text-blue-100 border border-blue-800/30 rounded-md py-4 px-4 text-center tracking-wider focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition duration-200 placeholder-slate-500"
                    maxLength={6}
                  />
                </div>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleJoinRetro(e as unknown as React.FormEvent);
                  }}
                  className="w-full bg-gradient-to-r from-blue-800 to-indigo-900 hover:from-blue-900 hover:to-indigo-950 text-white font-semibold py-3 px-4 rounded-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transform hover:scale-[1.02]"
                  disabled={!retroCode.trim()}
                >
                  Join Retrospective
                </button>
                
                <div className="mt-6 text-center text-slate-400 text-sm">
                  <p>Want to create your own retrospective? <Link href="/auth" className="text-blue-400 hover:text-blue-300 font-medium">Sign in here</Link></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 bg-[#080318]/70 backdrop-blur-sm border-t border-blue-950/20 text-slate-400 text-center relative z-10">

        <div className="container mx-auto px-4">
          <div className="flex justify-center space-x-8 mb-6">
            <a href="#" className="hover:text-blue-400 transition-colors duration-300">Twitter</a>
            <a href="#" className="hover:text-blue-400 transition-colors duration-300">GitHub</a>
            <a href="#" className="hover:text-blue-400 transition-colors duration-300">LinkedIn</a>
          </div>
          <p className="text-sm text-slate-500">&copy; {new Date().getFullYear()} Retro Space. All rights reserved.</p>
          <div className="mt-6 flex justify-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-blue-800/40"></div>
            <div className="w-2 h-2 rounded-full bg-blue-900/40"></div>
            <div className="w-2 h-2 rounded-full bg-blue-800/40"></div>
          </div>
        </div>
      </footer>
    </main>
  );
}
