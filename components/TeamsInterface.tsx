import React, { useState } from 'react';
import { ViewContainer } from './ViewContainer';
import useLocalStorage from '../hooks/useLocalStorage';
import { INITIAL_TEAM_MEMBERS, INITIAL_SHARED_PROJECTS } from '../constants';

const MemberCard: React.FC<{ member: any }> = ({ member }) => (
    <div className="bg-slate-900/50 p-4 rounded-lg flex items-center justify-between border border-slate-700">
        <div>
            <p className="font-bold text-white">{member.name}</p>
            <p className="text-xs text-slate-400">{member.role}</p>
        </div>
        <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${member.status === 'Online' ? 'bg-green-400 animate-pulse' : 'bg-slate-500'}`}></div>
            <span className="text-xs text-slate-300">{member.status}</span>
        </div>
    </div>
);

const ProjectRow: React.FC<{ project: any }> = ({ project }) => (
    <div className="grid grid-cols-3 items-center p-4 bg-slate-900/50 rounded-lg border border-slate-700">
        <p className="font-semibold text-white col-span-2 md:col-span-1">{project.name}</p>
        <div className="hidden md:block">
            <div className="w-full bg-slate-700 rounded-full h-2.5">
                <div className="bg-cyan-500 h-2.5 rounded-full" style={{ width: `${project.progress}%` }}></div>
            </div>
        </div>
        <p className="text-right text-sm text-slate-300">{project.status}</p>
    </div>
);

export const TeamsInterface: React.FC = () => {
    const [teamMembers, setTeamMembers] = useLocalStorage('nexus-team-members', INITIAL_TEAM_MEMBERS);
    const [sharedProjects, setSharedProjects] = useLocalStorage('nexus-shared-projects', INITIAL_SHARED_PROJECTS);
    const [newMemberName, setNewMemberName] = useState('');
    const [newMemberRole, setNewMemberRole] = useState('');
    const [newProjectName, setNewProjectName] = useState('');

    const handleAddMember = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMemberName.trim() || !newMemberRole.trim()) return;
        setTeamMembers([...teamMembers, { name: newMemberName, role: newMemberRole, status: 'Offline' }]);
        setNewMemberName('');
        setNewMemberRole('');
    };
    
    const handleAddProject = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newProjectName.trim()) return;
        setSharedProjects([...sharedProjects, { id: `proj-${Date.now()}`, name: newProjectName, status: 'Planning', progress: 0 }]);
        setNewProjectName('');
    };

  return (
    <ViewContainer title="Teams Interface">
        <p className="text-slate-400 mb-8 max-w-3xl">
            Manage your project team and shared initiatives. All data is saved locally in your browser.
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Team Members */}
            <div className="lg:col-span-1 space-y-4">
                <h3 className="text-xl font-bold text-white">Project Team</h3>
                {teamMembers.map((member: any) => <MemberCard key={member.name} member={member} />)}
                <form onSubmit={handleAddMember} className="p-4 bg-slate-900/50 rounded-lg border border-slate-700 space-y-3">
                    <input type="text" value={newMemberName} onChange={e => setNewMemberName(e.target.value)} placeholder="New member name" className="w-full bg-slate-800 border-slate-600 rounded p-2 text-sm" />
                    <input type="text" value={newMemberRole} onChange={e => setNewMemberRole(e.target.value)} placeholder="Role (e.g., Engineer)" className="w-full bg-slate-800 border-slate-600 rounded p-2 text-sm" />
                    <button type="submit" className="w-full bg-cyan-600/50 hover:bg-cyan-600 text-white text-sm py-2 rounded">Add Member</button>
                </form>
            </div>

            {/* Shared Projects */}
            <div className="lg:col-span-2 space-y-4">
                <h3 className="text-xl font-bold text-white">Shared Projects</h3>
                {sharedProjects.map((project: any) => <ProjectRow key={project.id} project={project} />)}
                <form onSubmit={handleAddProject} className="p-4 bg-slate-900/50 rounded-lg border border-slate-700 flex gap-3">
                    <input type="text" value={newProjectName} onChange={e => setNewProjectName(e.target.value)} placeholder="New project name" className="flex-grow bg-slate-800 border-slate-600 rounded p-2 text-sm" />
                    <button type="submit" className="bg-cyan-600/50 hover:bg-cyan-600 text-white text-sm py-2 px-4 rounded">Add Project</button>
                </form>
            </div>
        </div>
    </ViewContainer>
  );
};