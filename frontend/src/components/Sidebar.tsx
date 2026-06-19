import React from 'react';
import { NavLink } from 'react-router-dom';
import { Bug, ShieldAlert, GitPullRequest, Award, FolderGit2, History } from 'lucide-react';

const Sidebar: React.FC = () => {
  const navItems = [
    {
      to: '/dashboard/bugs',
      name: 'Bug Analyzer',
      desc: 'Find logic flaws & errors',
      icon: Bug,
      color: 'hover:text-neonOrange text-neonOrange/70',
      activeColor: 'border-neonOrange/30 text-neonOrange bg-neonOrange/5 bg-opacity-10',
    },
    {
      to: '/dashboard/security',
      name: 'Security Scanner',
      desc: 'Audit vulnerabilities & CWEs',
      icon: ShieldAlert,
      color: 'hover:text-neonRed text-neonRed/70',
      activeColor: 'border-neonRed/30 text-neonRed bg-neonRed/5 bg-opacity-10',
    },
    {
      to: '/dashboard/pr-review',
      name: 'PR Reviewer',
      desc: 'Scan changed files & diffs',
      icon: GitPullRequest,
      color: 'hover:text-neonBlue text-neonBlue/70',
      activeColor: 'border-neonBlue/30 text-neonBlue bg-neonBlue/5 bg-opacity-10',
    },
    {
      to: '/dashboard/senior',
      name: 'Senior Reviewer',
      desc: 'Architecture & scaling checks',
      icon: Award,
      color: 'hover:text-neonPurple text-neonPurple/70',
      activeColor: 'border-neonPurple/30 text-neonPurple bg-neonPurple/5 bg-opacity-10',
    },
    {
      to: '/dashboard/repository',
      name: 'Repository Reviewer',
      desc: 'Full layout & tree analysis',
      icon: FolderGit2,
      color: 'hover:text-neonGreen text-neonGreen/70',
      activeColor: 'border-neonGreen/30 text-neonGreen bg-neonGreen/5 bg-opacity-10',
    },
  ];

  return (
    <aside className="w-80 h-[calc(100vh-73px)] border-r border-gray-800 bg-[#0B0F19]/40 backdrop-blur-sm p-4 hidden md:flex flex-col gap-6">
      <div className="px-3">
        <h2 className="text-xs font-semibold tracking-wider text-gray-500 uppercase">AI ANALYZERS</h2>
      </div>

      <nav className="flex-1 flex flex-col gap-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-start gap-3.5 px-4 py-3.5 rounded-xl border border-transparent transition-all duration-300 group hover:scale-[1.01] ${
                  isActive
                    ? item.activeColor + ' shadow-[inset_0_0_12px_rgba(255,255,255,0.02)]'
                    : 'text-gray-400 hover:bg-gray-800/20 hover:text-white'
                }`
              }
            >
              <Icon className={`w-5 h-5 mt-0.5 transition-colors duration-300 ${item.color}`} />
              <div className="flex flex-col">
                <span className="text-sm font-semibold tracking-wide transition-colors duration-300">
                  {item.name}
                </span>
                <span className="text-[11px] text-gray-500 font-medium group-hover:text-gray-400 transition-colors duration-200 mt-0.5">
                  {item.desc}
                </span>
              </div>
            </NavLink>
          );
        })}
      </nav>
      
      <div className="pt-4 border-t border-gray-800">
        <NavLink
          to="/history"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-300 ${
              isActive
                ? 'text-neonBlue bg-neonBlue/5 border border-neonBlue/20'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/10'
            }`
          }
        >
          <History className="w-4 h-4 text-neonBlue/70" />
          <span>Analysis History</span>
        </NavLink>
      </div>
    </aside>
  );
};

export default Sidebar;
