import React, { useState, useCallback } from 'react';
import { UploadIcon, FileTextIcon } from './Icons';

interface FileUploadProps {
    onFileSelect: (file: File) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect }) => {
    const [isDragging, setIsDragging] = useState(false);

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            onFileSelect(e.dataTransfer.files[0]);
            e.dataTransfer.clearData();
        }
    }, [onFileSelect]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            onFileSelect(e.target.files[0]);
        }
    };

    const handleClick = () => {
        document.getElementById('fileInput')?.click();
    };

    return (
        <div className="h-full flex flex-col items-center justify-center animate-fade-in py-12">
             <div className="text-center mb-10 max-w-xl">
                <h2 className="text-4xl font-extrabold text-white tracking-tight mb-4">
                    Separação Inteligente
                </h2>
                <p className="text-lg text-gray-400 leading-relaxed">
                    Importe sua Nota de Saída e deixe nossa IA organizar o processo de picking para você. Rápido, preciso e sem papel.
                </p>
            </div>
            
            <div
                onClick={handleClick}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                className={`
                    group relative flex flex-col items-center justify-center w-full max-w-2xl h-80 rounded-2xl 
                    border-2 border-dashed transition-all duration-300 cursor-pointer overflow-hidden
                    ${isDragging 
                        ? 'border-blue-500 bg-blue-500/10 scale-[1.02]' 
                        : 'border-gray-700 bg-gray-800/30 hover:border-gray-500 hover:bg-gray-800/50'}
                `}
            >
                <div className={`absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`}></div>
                
                <div className="relative z-10 flex flex-col items-center p-8 text-center">
                    <div className={`
                        p-4 rounded-full mb-6 transition-all duration-300
                        ${isDragging ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/50' : 'bg-gray-800 text-gray-400 group-hover:text-blue-400 group-hover:bg-gray-700 group-hover:scale-110'}
                    `}>
                        <UploadIcon className="h-10 w-10" />
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-200 mb-2 group-hover:text-white transition-colors">
                        Clique ou arraste o arquivo aqui
                    </h3>
                    <p className="text-gray-400 text-sm mb-6">
                        Suporta PDF, Excel e CSV
                    </p>
                    
                    <div className="flex gap-3">
                        <span className="px-3 py-1 rounded-full bg-gray-700/50 border border-gray-600/50 text-xs text-gray-400 flex items-center gap-1">
                            <FileTextIcon className="h-3 w-3" /> PDF
                        </span>
                        <span className="px-3 py-1 rounded-full bg-gray-700/50 border border-gray-600/50 text-xs text-gray-400 flex items-center gap-1">
                             XLSX
                        </span>
                    </div>

                    <input
                        id="fileInput"
                        type="file"
                        className="hidden"
                        onChange={handleFileChange}
                        accept=".pdf,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    />
                </div>
            </div>
        </div>
    );
};

export default FileUpload;