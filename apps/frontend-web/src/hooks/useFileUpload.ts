import { useState } from 'react';
import { uploadFile } from '../lib/storage';

export const useFileUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<Error | null>(null);

  const upload = async (file: File, path: string, bucket: string): Promise<string> => {
    if (!file) return '';

    setIsUploading(true);
    setUploadError(null);

    try {
      const fileUrl = await uploadFile(file, path, bucket);
      return fileUrl;
    } catch (error) {
      setUploadError(error as Error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  return { upload, isUploading, error: uploadError };
};

export default useFileUpload;
