import { supabase } from '../services/supabase';

export const uploadFile = async (file: File, path: string, bucket: string): Promise<string> => {
  const { data, error } = await supabase.storage
    .from(bucket) // Your Supabase storage bucket name
    .upload(path, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (error) {
    console.error('Error uploading file:', error);
    throw error;
  }

  // Get the public URL for the uploaded file
  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(data.path);

  return publicUrl;
};

export const deleteFile = async (filePath: string, bucket: string): Promise<void> => {
  const { error } = await supabase.storage.from(bucket).remove([filePath]);

  if (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};
