import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Camera, X, Clock } from 'lucide-react';
import { useVisualRecognitionSearch } from '@/hooks/useVisualRecognitionSearch';
import {
  useShopTranslation,
  useErrorsTranslation,
  useCommonTranslation,
} from '@/hooks/useTranslation';
import { toast } from 'sonner';

interface VisualSearchProps {
  className?: string;
}

export const VisualSearch: React.FC<VisualSearchProps> = ({
  className = '',
}: VisualSearchProps) => {
  const { t: tShop } = useShopTranslation();
  const { t: tCommon } = useCommonTranslation();
  const { t: tErrors } = useErrorsTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const { results, error, isLoading, searchByImage, clearResults } = useVisualRecognitionSearch();

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        toast.error(tErrors('file.fileTooLarge'));
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast.error(tErrors('file.invalidFileType'));
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSearch = useCallback(async () => {
    if (!imageFile) {
      toast.error(tErrors('file.noImageSelected'));
      return;
    }

    try {
      await searchByImage(imageFile);
      if (error) toast.error(tErrors('shop.searchError'));
      if (results) toast.success(tShop('visualSearch.searchCompleted'));
    } catch (err) {
      console.error('Visual search error:', err);
      toast.error(tErrors('shop.searchError'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageFile]);

  const handleClearImage = () => {
    setSelectedImage(null);
    setImageFile(null);
    clearResults();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    if (imageFile) {
      handleSearch();
    }
  }, [handleSearch, imageFile]);

  return (
    <div className={className}>
      {!selectedImage ? (
        <div className=" flex rounded-lg text-center">
          <Button
            variant="outline"
            className="bg-transparent border-none h-auto p-0"
            onClick={() => fileInputRef.current?.click()}
          >
            <Camera className="h-4 w-4" />
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
        </div>
      ) : (
        <div className="flex rounded-lg text-center w-fit">
          {isLoading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-tsa-blue  mr-2" />
          ) : (
            <>
              <img
                src={selectedImage}
                alt={tShop('visualSearch.title')}
                className="w-8 h-8 object-cover rounded-lg"
              />
              <Button
                variant="destructive"
                size="icon"
                className="bg-background rounded-lg w-fit h-fit relative -left-3"
                onClick={handleClearImage}
              >
                <X className="h-4 w-4" />
              </Button>{' '}
            </>
          )}
        </div>
      )}

      {/* Results Section */}
      {results && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">{tShop('visualSearch.title')}</h3>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <Clock className="h-4 w-4" />
              {results.processing_time_ms}ms
              <Badge variant="outline">
                {tCommon('search.results.foundPlural', {
                  count: results.total,
                  type: tShop('product.title').toLowerCase(),
                })}
              </Badge>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
