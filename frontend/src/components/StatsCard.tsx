import type { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  desc?: string;
  color?: 'blue' | 'purple' | 'green' | 'orange' | 'red';
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon: Icon,
  desc,
  color = 'blue',
}) => {
  const getColorClasses = () => {
    switch (color) {
      case 'purple':
        return {
          border: 'border-neonPurple/15 hover:border-neonPurple/40',
          iconBg: 'bg-neonPurple/10 text-neonPurple shadow-[0_0_15px_rgba(189,0,255,0.2)]',
        };
      case 'green':
        return {
          border: 'border-neonGreen/15 hover:border-neonGreen/40',
          iconBg: 'bg-neonGreen/10 text-neonGreen shadow-[0_0_15px_rgba(57,255,20,0.2)]',
        };
      case 'orange':
        return {
          border: 'border-neonOrange/15 hover:border-neonOrange/40',
          iconBg: 'bg-neonOrange/10 text-neonOrange shadow-[0_0_15px_rgba(255,95,31,0.2)]',
        };
      case 'red':
        return {
          border: 'border-neonRed/15 hover:border-neonRed/40',
          iconBg: 'bg-neonRed/10 text-neonRed shadow-[0_0_15px_rgba(255,7,58,0.2)]',
        };
      default:
        return {
          border: 'border-neonBlue/15 hover:border-neonBlue/40',
          iconBg: 'bg-neonBlue/10 text-neonBlue shadow-[0_0_15px_rgba(0,240,255,0.2)]',
        };
    }
  };

  const classes = getColorClasses();

  return (
    <div className={`glass-panel p-6 rounded-2xl border transition-all duration-300 hover:scale-[1.02] flex items-center justify-between ${classes.border}`}>
      <div className="space-y-1">
        <span className="text-xs font-bold uppercase tracking-wider text-gray-500">{title}</span>
        <h4 className="text-3xl font-extrabold tracking-tight text-white">{value}</h4>
        {desc && <p className="text-xs text-gray-400 font-medium pt-1">{desc}</p>}
      </div>

      <div className={`p-3.5 rounded-xl border border-white/5 transition-all duration-300 ${classes.iconBg}`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  );
};

export default StatsCard;
