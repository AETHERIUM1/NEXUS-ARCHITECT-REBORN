import React, { useContext } from 'react';
import { AppContext } from '../contexts/AppContext';
import { ActiveView } from '../types';
import { speak } from '../services/speechService';
import { INITIAL_MESSAGE } from '../constants';

const FeatureCard: React.FC<{ icon: string; title: string; description: string; }> = ({ icon, title, description }) => (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 transform hover:scale-105 transition-transform duration-300 hover:border-cyan-400/50">
        <div className="text-3xl mb-4">{icon}</div>
        <h3 className="text-xl font-bold text-glow-cyan mb-2">{title}</h3>
        <p className="text-slate-400 text-sm">{description}</p>
    </div>
);

const ApplicationCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-slate-900/40 border border-slate-700/50 rounded-lg p-6 space-y-3">
        <h3 className="font-bold text-lg text-white">{title}</h3>
        <ul className="list-disc list-inside text-slate-400 text-sm space-y-2">
            {children}
        </ul>
    </div>
);


export const LandingPage: React.FC = () => {
    const { setActiveView, settings, setAvatarState } = useContext(AppContext);

    const handleEnter = () => {
        // By calling `speak` directly inside the user's click handler, we ensure the browser
        // grants permission for audio playback, definitively fixing the "not-allowed" error.
        speak(
            INITIAL_MESSAGE.text,
            settings.voiceURI,
            settings.speechRate,
            settings.speechPitch,
            () => setAvatarState('speaking'),
            () => setAvatarState('idle'),
            false // `false` prevents canceling other sounds and is crucial for the first utterance.
        );
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
                            NEXUS: Architect 3.0 Pro
                        </p>
                    </div>
                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tighter text-white mb-4">
                        Architect Reality
                    </h1>
                    <p className="max-w-3xl mx-auto text-lg md:text-xl text-slate-300 text-glow-blue mb-8">
                       Nexus represents a paradigm shift in AI, designed not just for interaction but for true system architecture and execution. It's a hyper-efficient creative partner designed to bring your most complex visions to life.
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
                    <h2 className="text-4xl font-bold text-center mb-12 text-white">Core Features</h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8">
                        <FeatureCard 
                            icon="🧩" 
                            title="Expanded Multimodal Integration" 
                            description="Natively understand and reason across text, audio, images, real-time video, 3D objects, and even geospatial data in a single, unified conversation." 
                        />
                        <FeatureCard 
                            icon="📚" 
                            title="Enhanced Context Handling" 
                            description="Analyze massive documents, datasets, and code archives seamlessly with a context window exceeding 1 million tokens, perfect for enterprise-scale research." 
                        />
                        <FeatureCard 
                            icon="💡" 
                            title="Built-in Advanced Reasoning" 
                            description="Leverage a sophisticated planning engine that enables autonomous tool use and self-directed, multi-step problem solving for complex workflows." 
                        />
                         <FeatureCard 
                            icon="⚡️" 
                            title="Improved Inference Efficiency" 
                            description="Experience near real-time responses with ultra-low latency, optimized for high-throughput workloads and interactive applications." 
                        />
                    </div>
                </div>
            </section>
            
            {/* Applications Section */}
            <section className="relative py-20 px-8 z-10">
                 <div className="max-w-6xl mx-auto text-center">
                    <h2 className="text-4xl font-bold text-white mb-4">Potential Applications</h2>
                    <p className="text-slate-400 mb-12 max-w-3xl mx-auto">With multimodal mastery and advanced reasoning, Nexus becomes the foundation for autonomous systems, next-gen creativity platforms, and seamless productivity integration.</p>
                    <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8 text-left">
                        <ApplicationCard title="Nexus Workspace Suite">
                            <li>Write and optimize professional emails and documents.</li>
                            <li>Auto-generate complete slide decks with design and copy.</li>
                            <li>Summarize and analyze meetings with actionable insights.</li>
                        </ApplicationCard>
                        <ApplicationCard title="Nexus Creative Suite">
                            <li>Generate high-quality videos, animations, and branded content instantly.</li>
                            <li>Transform photos into fully animated, narrated videos.</li>
                            <li>Utilize AI-assisted video editing and script-to-video pipelines.</li>
                        </ApplicationCard>
                        <ApplicationCard title="Nexus for Mobile & OS">
                            <li>Act as a true default assistant with screen reading and contextual actions.</li>
                            <li>Perform live translation and adaptive, on-device tool use.</li>
                            <li>Engage in real-time voice and visual conversations.</li>
                        </ApplicationCard>
                        <ApplicationCard title="Nexus Cloud AI Platform">
                            <li>Build, train, and deploy next-gen apps on the Nexus engine.</li>
                            <li>Support enterprise-scale automation, orchestration, and integrations.</li>
                            <li>Available via Vertex-like AI services for developers.</li>
                        </ApplicationCard>
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
                <p>NEXUS Core Systems 3.0 Pro: Online. Architect Mode Engaged.</p>
            </footer>

        </div>
    );
};