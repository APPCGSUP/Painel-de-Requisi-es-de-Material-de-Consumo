import React from 'react';

interface ProgressBarProps {
    progress: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => {
    return (
        <div className="w-full bg-gray-700 rounded-full h-2.5">
            <div
                className="bg-blue-500 h-2.5 rounded-full transition-all duration-500 ease-out shadow-[0_0_10px] shadow-blue-500/50"
                style={{ width: `${progress}%` }}
            ></div>
        </div>
    );
};

export default ProgressBar;