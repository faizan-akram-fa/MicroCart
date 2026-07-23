'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import { authAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { Camera } from 'lucide-react';
import imageCompression from 'browser-image-compression';

interface ProfileImageProps {
    size?: 'sm' | 'md' | 'lg' | 'xl';
    editable?: boolean;
}

export default function ProfileImage({ size = 'md', editable = false }: ProfileImageProps) {
    const { user, login } = useAuthStore();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    // Reset preview when user changes (e.g. successful upload confirmed via props/store update)
    useEffect(() => {
        setPreviewImage(null);
    }, [user?.profileImage, user?.firstName, user?.lastName]);

    const sizeClasses = {
        sm: 'w-8 h-8',
        md: 'w-12 h-12',
        lg: 'w-24 h-24',
        xl: 'w-32 h-32',
    };

    const handleImageClick = () => {
        if (editable && fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validations
        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file');
            return;
        }

        // OPTIMISTIC UI: Show preview immediately
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewImage(reader.result as string);
        };
        reader.readAsDataURL(file);

        setUploading(true);
        try {
            // Compress image
            const options = {
                maxSizeMB: 0.2,
                maxWidthOrHeight: 500,
                useWebWorker: true,
                initialQuality: 0.8,
                fileType: 'image/jpeg',
            };

            const compressedFile = await imageCompression(file, options);

            const formData = new FormData();
            formData.append('image', compressedFile);

            const token = localStorage.getItem('token');
            const res = await authAPI.uploadProfileImage(formData);

            // Update local user state with cache-busting timestamp
            if (user && token) {
                const timestamp = new Date().getTime();
                // Check if URL already has query params
                const separator = res.data.imageUrl.includes('?') ? '&' : '?';
                const newImageUrl = `${res.data.imageUrl}${separator}t=${timestamp}`;

                const updatedUser = { ...user, profileImage: newImageUrl };
                login(updatedUser, token);
                toast.success('Profile image updated!');
            }
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Failed to upload image. Reverting...');
            setPreviewImage(null); // Revert optimistic update on error
        } finally {
            setUploading(false);
            // Reset input so same file can be selected again if needed
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    if (!user) return null;

    // Use previewImage if available (optimistic), otherwise user.profileImage, otherwise default avatar
    const displayImage = previewImage || user.profileImage || `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=random&color=fff&t=${new Date().getTime()}`;

    return (
        <div className="relative inline-block group" key={`${user.id}-${user.firstName}-${user.lastName}-${user.profileImage}`}>
            <div
                className={`${sizeClasses[size]} rounded-full overflow-hidden border-2 border-gray-100 shadow-sm ${editable ? 'cursor-pointer' : ''}`}
                onClick={handleImageClick}
            >
                <img
                    src={displayImage}
                    alt={`${user.firstName}'s profile`}
                    className="w-full h-full object-cover transition-opacity duration-300"
                />

                {editable && !uploading && (
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center">
                        <Camera className="text-white opacity-0 group-hover:opacity-100 w-1/3 h-1/3" />
                    </div>
                )}

                {uploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                        <div className="w-1/3 h-1/3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}
            </div>

            {editable && (
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                />
            )}
        </div>
    );
}
