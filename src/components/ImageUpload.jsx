import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Loader, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';

const ImageUpload = ({ onUpload, initialImage = '', label = 'Imagen', bucket = 'products', folder = 'promos' }) => {
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState(initialImage);
    const [error, setError] = useState(null);

    const onDrop = useCallback(async (acceptedFiles) => {
        const file = acceptedFiles[0];
        if (!file) return;

        setUploading(true);
        setError(null);

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
            const filePath = `${folder}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage
                .from(bucket)
                .getPublicUrl(filePath);

            setPreview(data.publicUrl);
            onUpload(data.publicUrl);
        } catch (err) {
            console.error('Error uploading image:', err);
            setError('Error al subir la imagen. Verificá tu conexión.');
        } finally {
            setUploading(false);
        }
    }, [onUpload, bucket, folder]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png', '.webp']
        },
        multiple: false,
        disabled: uploading
    });

    const clearImage = (e) => {
        e.stopPropagation();
        setPreview('');
        onUpload('');
    };

    return (
        <div className="w-full">
            <label className="block text-sm font-bold text-[#3D2B1F] mb-1">{label}</label>

            <div
                {...getRootProps()}
                className={`relative border-2 border-dashed rounded-lg p-4 transition-colors cursor-pointer min-h-[160px] flex flex-col items-center justify-center text-center
                    ${isDragActive ? 'border-[#C99A3A] bg-[#F3E6D0]/50' : 'border-gray-300 bg-white hover:border-[#C99A3A]'}
                    ${error ? 'border-red-500' : ''}
                `}
            >
                <input {...getInputProps()} />

                {uploading ? (
                    <div className="flex flex-col items-center text-[#C99A3A]">
                        <Loader className="w-8 h-8 animate-spin mb-2" />
                        <span className="text-sm font-medium">Subiendo...</span>
                    </div>
                ) : preview ? (
                    <div className="relative w-full h-full flex items-center justify-center group">
                        <img
                            src={preview}
                            alt="Preview"
                            className="max-h-[200px] w-full object-contain rounded"
                        />
                        <button
                            type="button"
                            onClick={clearImage}
                            className="absolute top-[-10px] right-[-10px] bg-red-500 text-white p-1 rounded-full shadow-lg hover:bg-red-600 transition-opacity"
                        >
                            <X size={16} />
                        </button>
                    </div>
                ) : (
                    <div className="text-gray-500 flex flex-col items-center">
                        <Upload className="w-8 h-8 mb-2 text-[#C99A3A]" />
                        <p className="text-sm font-medium">
                            {isDragActive ? 'Soltá la imagen acá' : 'Arrastrá una imagen o hacé click'}
                        </p>
                        <p className="text-xs mt-1 text-gray-400">JPG, PNG, WEBP</p>
                    </div>
                )}
            </div>
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
    );
};

export default ImageUpload;
