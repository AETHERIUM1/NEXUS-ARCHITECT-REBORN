import React, { useContext } from 'react';
import { AppContext } from '../contexts/AppContext';
import { ViewContainer } from './ViewContainer';

interface Build {
    imageUrl?: string;
    videoUrl?: string;
    prompt: string;
    conversationId: string;
}

export const BuildsMatrix: React.FC = () => {
    const { conversations } = useContext(AppContext);

    const allBuilds = conversations.flatMap(conv => 
        conv.messages
            .filter(msg => msg.imageUrl || msg.videoUrl)
            .map(msg => ({
                imageUrl: msg.imageUrl,
                videoUrl: msg.videoUrl,
                prompt: msg.text,
                conversationId: conv.id
            }))
    ).reverse(); // Show most recent first

    return (
        <ViewContainer title="Builds Matrix">
            {allBuilds.length === 0 ? (
                <div className="text-center text-slate-400 py-10">
                    <p className="text-lg">No generated images or videos found.</p>
                    <p>Create some in the NEXUS Architect interface and they will appear here.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {allBuilds.map((build, index) => (
                        <div key={index} className="group relative bg-slate-900/50 rounded-lg overflow-hidden shadow-lg border border-slate-700/50 aspect-video">
                            {build.imageUrl && (
                                <img src={build.imageUrl} alt={build.prompt} className="w-full h-full object-cover" />
                            )}
                            {build.videoUrl && (
                                <video src={build.videoUrl} muted loop autoPlay playsInline className="w-full h-full object-cover" />
                            )}
                            <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                                <p className="text-sm font-semibold text-white line-clamp-4">{build.prompt}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </ViewContainer>
    );
};
