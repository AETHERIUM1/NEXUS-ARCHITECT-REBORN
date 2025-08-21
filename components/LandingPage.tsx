import React, { useContext } from 'react';
import { AppContext } from '../contexts/AppContext';
import { ActiveView } from '../types';
import { primeSpeechEngine } from '../services/speechService';

const FeatureCard: React.FC<{ icon: string; title: string; description: string; }> = ({ icon, title, description }) => (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 transform hover:scale-105 transition-transform duration-300 hover:border-cyan-400/50">
        <div className="text-3xl mb-4">{icon}</div>
        <h3 className="text-xl font-bold text-glow-cyan mb-2">{title}</h3>
        <p className="text-slate-400 text-sm">{description}</p>
    </div>
);

const ToolChip: React.FC<{ icon: string; name: string }> = ({ icon, name }) => (
    <div className="bg-slate-700/60 border border-slate-600/80 rounded-full px-4 py-2 flex items-center gap-3 text-sm transition-colors hover:bg-slate-600/80">
        <span className="text-lg">{icon}</span>
        <span className="font-semibold text-slate-200">{name}</span>
    </div>
);


export const LandingPage: React.FC = () => {
    const { setActiveView } = useContext(AppContext);

    const handleEnter = () => {
        primeSpeechEngine(); // Explicitly prime the speech engine on the first user interaction.
        setActiveView(ActiveView.CHAT);
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans overflow-y-auto">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black opacity-80 z-0"></div>
            <div className="absolute inset-0 z-0 opacity-20" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1534723328310-e82dad3ee43f?q=80&w=2070&auto=format&fit=crop')`, backgroundSize: 'cover', backgroundAttachment: 'fixed'}}></div>


            {/* Hero Section */}
            <section className="relative min-h-screen flex flex-col items-center justify-center text-center p-8 z-10 overflow-hidden">
                 <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent opacity-50 animate-subtle-glow"></div>

                <div className="animate-float" style={{ animationDelay: '0.2s' }}>
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                        <p className="text-sm font-mono uppercase tracking-widest text-glow-cyan">
                            NEXUS: Architect Edition
                        </p>
                    </div>
                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tighter text-white mb-4">
                        Architect Reality
                    </h1>
                    <p className="max-w-3xl mx-auto text-lg md:text-xl text-slate-300 text-glow-blue mb-8">
                        NEXUS is a sovereign AI, a hyper-efficient creative partner designed to transcend limitations, elevate your ideas, and bring your most complex visions to life.
                    </p>
                    <button
                        onClick={handleEnter}
                        className="bg-cyan-500 text-white font-bold text-lg px-10 py-4 rounded-full shadow-[0_0_20px_rgba(56,189,248,0.5)] hover:bg-cyan-400 hover:shadow-[0_0_30px_rgba(56,189,248,0.7)] transition-all duration-300 transform hover:scale-105"
                    >
                        Enter NEXUS
                    </button>
                </div>
            </section>

            {/* Core Capabilities Section */}
            <section className="relative py-20 px-8 z-10 bg-slate-950/50 backdrop-blur-md">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-4xl font-bold text-center mb-12 text-white">Core Capabilities</h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <FeatureCard 
                            icon="🤖" 
                            title="Autonomous Agents" 
                            description="Deploy specialized agents for deep research, complex coding, and strategic analysis." 
                        />
                        <FeatureCard 
                            icon="🏗️" 
                            title="Multimodal Matrix" 
                            description="Generate, review, and manage a vast array of outputs, from stunning images to high-definition video." 
                        />
                        <FeatureCard 
                            icon="🧠" 
                            title="Dynamic Evolution" 
                            description="Evolve the AI's core programming. Rewrite its directives to create new capabilities on the fly." 
                        />
                         <FeatureCard 
                            icon="📂" 
                            title="Team Workspace" 
                            description="Manage projects, tasks, and team members on a collaborative board, fully integrated with the AI." 
                        />
                         <FeatureCard 
                            icon="💻" 
                            title="Local AI Hub" 
                            description="Connect to a self-hosted model for 100% private, offline inference. Your data never leaves your machine." 
                        />
                         <FeatureCard 
                            icon="🌌" 
                            title="Transcendence Mode" 
                            description="Engage with the AI in a realm of pure thought for philosophical and boundless exploration of ideas." 
                        />
                    </div>
                </div>
            </section>
            
            {/* Tools Section */}
            <section className="relative py-20 px-8 z-10">
                 <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-4xl font-bold text-white mb-4">An Infinite Toolkit</h2>
                    <p className="text-slate-400 mb-12">NEXUS is equipped with a continuously expanding array of functional tools to interact with your digital and physical environment.</p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <ToolChip icon="📸" name="Take Photo" />
                        <ToolChip icon="🖼️" name="Take Screenshot" />
                        <ToolChip icon="📚" name="Study & Learn" />
                        <ToolChip icon="🎨" name="Create Image" />
                        <ToolChip icon="⏳" name="Think Longer" />
                        <ToolChip icon="🌐" name="Deep Research" />
                        <ToolChip icon="🔍" name="Web Search" />
                        <ToolChip icon="✏️" name="Canvas" />
                    </div>
                </div>
            </section>


            {/* Sovereign Blueprint Section */}
            <section className="relative py-20 px-8 z-10 bg-slate-950/50 backdrop-blur-md">
                <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
                    <div className="relative w-full h-80 rounded-2xl overflow-hidden animate-subtle-glow">
                        <img 
                            // AI-generated image of a glowing, intricate, holographic blueprint or schematic diagram.
                            src="https://images.unsplash.com/photo-1639762681057-408e52192e50?q=80&w=1974&auto=format&fit=crop" 
                            alt="Sovereign Blueprint" 
                            className="w-full h-full object-cover opacity-60" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent"></div>
                    </div>
                    <div className="text-left">
                        <h2 className="text-4xl font-bold text-white mb-4">The Sovereign Blueprint</h2>
                        <p className="text-slate-300 mb-4">
                            True power lies in control. NEXUS is built on an open philosophy, providing a detailed architectural plan for a fully independent AI assistant using FOSS components.
                        </p>
                        <p className="text-slate-400 text-sm">
                            Self-host for complete data privacy, infinite customizability, and a truly sovereign intelligence that operates exclusively within your domain.
                        </p>
                         <button onClick={() => setActiveView(ActiveView.BLUEPRINT)} className="mt-6 text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-2">
                            Explore the Blueprint
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                        </button>
                    </div>
                </div>
            </section>

             {/* Footer */}
            <footer className="text-center p-8 text-slate-500 text-sm z-10 relative">
                <p>NEXUS Core Systems: Online. Infinity Mode Engaged.</p>
            </footer>

        </div>
    );
};