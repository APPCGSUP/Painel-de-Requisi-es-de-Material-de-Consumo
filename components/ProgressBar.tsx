import React from 'react';

interface ProgressBarProps {
    progress: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => {
    return (
        <div className="w-full bg-gray-900 rounded-full h-3 shadow-inner border border-gray-800">
            <div
                className={`h-full rounded-full transition-all duration-700 ease-out relative
                    ${progress === 100 ? 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.6)]' : 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.6)]'}
                `}
                style={{ width: `${progress}%` }}
            >
                <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-full"></div>
            </div>
        </div>
    );
};

export default ProgressBar;