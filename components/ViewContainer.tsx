import React from 'react';

interface ViewContainerProps {
    title: string;
    children: React.ReactNode;
}

export const ViewContainer: React.FC<ViewContainerProps> = ({ title, children }) => {
    return (
        <div className="p-4 md:p-6 lg:p-8">
            <div className="max-w-6xl mx-auto">
                <h2 className="text-3xl font-bold text-cyan-400 dark:text-glow-cyan light:text-cyan-600 mb-6 border-b-2 border-slate-700/50 pb-3">{title}</h2>
                <div className="bg-slate-800/20 dark:bg-slate-800/20 light:bg-slate-200/50 p-4 sm:p-6 rounded-lg">
                    {children}
                </div>
            </div>
        </div>
    );
};
