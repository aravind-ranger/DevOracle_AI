import React from 'react';

interface SkeletonLoaderProps {
  count?: number;
  height?: string;
  className?: string;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  count = 3,
  height = 'h-16',
  className = '',
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`w-full rounded-xl bg-gray-900/40 border border-gray-800/40 p-4 flex flex-col gap-2.5 animate-pulse`}
        >
          <div className="flex items-center justify-between">
            <div className="h-4 bg-gray-800 rounded w-1/3" />
            <div className="h-3 bg-gray-800 rounded w-16" />
          </div>
          <div className={`w-full ${height} bg-gray-800/20 rounded-lg`} />
        </div>
      ))}
    </div>
  );
};

export default SkeletonLoader;
