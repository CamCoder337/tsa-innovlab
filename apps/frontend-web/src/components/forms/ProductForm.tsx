import React, { useEffect, useState, useRef } from 'react';
import type { FormikProps } from 'formik';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Upload, X } from 'lucide-react';
import { useFileUpload } from '@/hooks/useFileUpload';
import { handleSupabaseError } from '@/services/supabase';
import type { CreateProduct, UpdateProduct } from '@/types/product.types';
import type { Category } from '@/types/category.types';
import { toast } from 'sonner';
import { useFormsTranslation } from '@/hooks/useTranslation';

interface ProductFormProps {
  formik: FormikProps<CreateProduct | UpdateProduct>;
  categories: Category[];
  isSubmitting: boolean;
  onCancel: () => void;
}

export const ProductForm: React.FC<ProductFormProps> = ({
  formik,
  categories,
  isSubmitting,
  onCancel,
}) => {
  const { t } = useFormsTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { upload, isUploading } = useFileUpload();
  const [imagePreview, setImagePreview] = useState<string | null>(
    'imageUrl' in formik.values ? formik.values.imageUrl || null : null
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error(t('validation.fileType'));
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('validation.fileSize'));
      return;
    }

    setSelectedFile(file);
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
  };

  const handleRemoveImage = () => {
    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
    setSelectedFile(null);
    formik.setFieldValue('imageUrl', '');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadImage = async (productId: string): Promise<string | null> => {
    if (!selectedFile) return null;

    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${productId}.${fileExt}`;

      const imageUrl = await upload(selectedFile, fileName, 'tsa_products');

      // Update form with the new image URL
      formik.setFieldValue('imageUrl', imageUrl);
      formik.setFieldValue('images', [...(formik.values.images || []), imageUrl]);
      return imageUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error(t('messages.uploadError'));
      throw error;
    }
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      // If we have a new image to upload
      if (selectedFile) {
        // If editing existing product, use its ID, otherwise generate a temporary ID
        const productId =
          'id' in formik.values && formik.values.id ? formik.values.id : `temp-${Date.now()}`;

        // Upload the image and wait for it to complete
        console.log('Before upload - form values:', formik.values);
        const imageUrl = await uploadImage(productId);
        console.log('After upload - imageUrl:', imageUrl);
        console.log('After update - form values:', formik.values);

        // Update form values with the new image URL
        if (imageUrl) {
          formik.setFieldValue('imageUrl', imageUrl);
          formik.setFieldValue('images', [...(formik.values.images || []), imageUrl]);
        }
      }

      // Submit the form with updated values
      formik.handleSubmit(e);
    } catch (error) {
      handleSupabaseError(error as Error);
    }
  };

  return (
    <form onSubmit={handleFormSubmit} className="space-y-4">
      {/* Image Upload */}
      <div className="space-y-2">
        <Label>{t('labels.productImages')}</Label>
        <div className="flex justify-center items-center gap-4">
          <div className="relative">
            {imagePreview ? (
              <div className="relative group">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="h-32 w-32 rounded-md object-cover border border-gray-200"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="h-32 w-32 rounded-md border-2 border-dashed border-gray-300 flex items-center justify-center">
                <Upload className="h-8 w-8 text-gray-400" />
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isUploading}
            />
          </div>
          <div className="text-sm text-gray-500">
            <p>
              {t('labels.supportedFormats', { formats: 'JPG, PNG' })} (
              {t('labels.maxFileSize', { size: '5MB' })})
            </p>
            <p>Recommandé: 800x800px</p>
          </div>
        </div>
        {isUploading && (
          <div className="flex items-center gap-2 text-sm text-tsa-blue">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t('messages.uploading')}...
          </div>
        )}
      </div>

      {/* Basic Information */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">
            {t('labels.productName')} <span className="text-red-700">*</span>
          </Label>
          <Input
            id="name"
            name="name"
            value={formik.values.name}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            placeholder={t('placeholders.productName')}
            required
          />
          {formik.touched.name && formik.errors.name && (
            <p className="text-sm text-red-500">{formik.errors.name}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="reference">
            {t('labels.productReference')} <span className="text-red-700">*</span>
          </Label>
          <Input
            id="reference"
            name="reference"
            value={formik.values.reference || ''}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            placeholder={t('placeholders.productReference')}
            required
          />
          {formik.touched.reference && formik.errors.reference && (
            <p className="text-sm text-red-500">{formik.errors.reference}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="categoryId">
            {t('labels.productCategory')}
            <span className="text-red-700">*</span>
          </Label>
          <Select
            name="categoryId"
            value={formik.values.categoryId || ''}
            onValueChange={(value) => formik.setFieldValue('categoryId', value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t('messages.selectCategory')} />
            </SelectTrigger>
            <SelectContent>
              {categories &&
                categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          {formik.touched.categoryId && formik.errors.categoryId && (
            <p className="text-red-600 text-sm">{formik.errors.categoryId}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="price">
            {t('labels.productPrice')} <span className="text-red-700">*</span>
          </Label>
          <Input
            id="price"
            name="price"
            type="number"
            step="0.01"
            min="0"
            value={formik.values.price}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            placeholder="0.00"
            required
          />
          {formik.touched.price && formik.errors.price && (
            <p className="text-sm text-red-500">{formik.errors.price}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="unit">
            {t('labels.unit')} <span className="text-red-700">*</span>
          </Label>
          <Select
            name="unit"
            value={formik.values.unit}
            onValueChange={(value) => formik.setFieldValue('unit', value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t('messages.selectUnit')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="boîte">Boîte</SelectItem>
              <SelectItem value="bouquet">Bouquet</SelectItem>
              <SelectItem value="gramme">Gramme (g)</SelectItem>
              <SelectItem value="kilogramme">Kilogramme (kg)</SelectItem>
              <SelectItem value="litre">Litre (l)</SelectItem>
              <SelectItem value="millilitre">Millilitre (ml)</SelectItem>
              <SelectItem value="pièce">Pièce</SelectItem>
              <SelectItem value="unité">Unité</SelectItem>
              <SelectItem value="sac">Sac</SelectItem>
            </SelectContent>
          </Select>
          {formik.touched.unit && formik.errors.unit && (
            <p className="text-red-600 text-sm">{formik.errors.unit}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="stock">
            {t('labels.productStock')} <span className="text-red-700">*</span>
          </Label>
          <Input
            id="stock"
            name="stock"
            type="number"
            min="0"
            value={formik.values.stock}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            placeholder="0"
            required
          />
          {formik.touched.stock && formik.errors.stock && (
            <p className="text-sm text-red-500">{formik.errors.stock}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="stockAlert">
            {t('labels.stockAlert')} <span className="text-red-700">*</span>
          </Label>
          <Input
            id="stockAlert"
            name="stockAlert"
            type="number"
            min="1"
            step="1"
            value={formik.values.stockAlert}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            required
          />
          {formik.touched.stockAlert && formik.errors.stockAlert && (
            <p className="text-red-600 text-sm">{formik.errors.stockAlert}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">
          {t('labels.productDescription')} <span className="text-red-700">*</span>
        </Label>
        <Textarea
          id="description"
          name="description"
          value={formik.values.description || ''}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          placeholder={t('placeholders.enterDescription')}
          rows={4}
          required
        />
        {formik.touched.description && formik.errors.description && (
          <p className="text-red-600 text-sm">{formik.errors.description}</p>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-4 pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting || isUploading}
        >
          {t('buttons.cancel')}
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || isUploading}
          className="bg-tsa-blue/90 hover:bg-tsa-blue"
        >
          {isSubmitting || isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isUploading ? t('messages.uploading') : t('messages.saving')}
            </>
          ) : (
            t('buttons.save')
          )}
        </Button>
      </div>
    </form>
  );
};
