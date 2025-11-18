import React, { useState, useCallback } from 'react';
import { UploadIcon } from './Icons';

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
        <div className="w-full">
             <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-100">Pronto para começar?</h2>
                <p className="mt-2 text-lg text-gray-400">Faça o upload da nota de saída para iniciar a separação.</p>
            </div>
            <div
                onClick={handleClick}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                className={`relative flex justify-center items-center w-full px-6 py-20 border-2 border-dashed rounded-lg cursor-pointer transition-all duration-300
                    ${isDragging ? 'border-blue-500 bg-gray-800/50 scale-105' : 'border-gray-600 bg-gray-800 hover:border-gray-500'}`}
            >
                <div className="absolute top-0 left-0 w-full h-full bg-grid-pattern opacity-5"></div>
                <div className="text-center z-10">
                    <UploadIcon className="mx-auto h-12 w-12 text-gray-500" />
                    <h3 className="mt-2 text-lg font-semibold text-gray-200">
                        Arraste e solte o arquivo do pedido aqui
                    </h3>
                    <p className="mt-1 text-sm text-gray-400">ou <span className="text-blue-400 font-semibold">clique para selecionar</span></p>
                    <p className="mt-4 text-xs text-gray-500">
                        Suporta PDF, Excel (XLSX, XLS) e CSV
                    </p>
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