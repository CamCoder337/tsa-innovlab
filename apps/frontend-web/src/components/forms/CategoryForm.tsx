import React, { useEffect, useState } from 'react';
import type { FormikProps } from 'formik';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Category, CreateCategory, UpdateCategory } from '@/types/category.types';

interface CategoryFormProps {
  formik: FormikProps<CreateCategory | UpdateCategory>;
  categories: Category[];
  isSubmitting: boolean;
  onCancel: () => void;
}

export const CategoryForm: React.FC<CategoryFormProps> = ({
  formik,
  categories,
  isSubmitting,
  onCancel,
}) => {
  const [imagePreview, setImagePreview] = useState<string | null>(
    'imageUrl' in formik.values && formik.values.imageUrl ? formik.values.imageUrl : null
  );

  useEffect(() => {
    // Clean up the object URL when the component unmounts
    return () => {
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      formik.setFieldValue('imageUrl', previewUrl.replace('blob:', ''));
    }
  };

  useEffect(() => {
    const handleSlugChange = ({ value }: { value: string }) => {
      const slug = value
        ?.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/-{2,}/g, '-');
      formik.setFieldValue('slug', slug);
    };
    handleSlugChange({ value: formik.values.name || '' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formik.values.name]);

  return (
    <form onSubmit={formik.handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nom de la catégorie *</Label>
          <Input
            id="name"
            name="name"
            value={formik.values.name}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            placeholder="Entrez le nom de la catégorie"
          />
          {formik.touched.name && formik.errors.name && (
            <p className="text-red-500 text-sm">{formik.errors.name}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="parentId">Catégorie parente</Label>
          <select
            id="parentId"
            name="parentId"
            value={formik.values.parentId || ''}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Aucune (catégorie principale)</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            name="slug"
            value={formik.values.slug || ''}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            placeholder="slug-de-la-categorie"
          />
          {formik.touched.slug && formik.errors.slug && (
            <p className="text-red-500 text-sm">{formik.errors.slug}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="displayOrder">Ordre d'affichage</Label>
          <Input
            id="displayOrder"
            name="displayOrder"
            type="number"
            min={0}
            value={formik.values.displayOrder || 0}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          />
          {formik.touched.displayOrder && formik.errors.displayOrder && (
            <p className="text-red-500 text-sm">{formik.errors.displayOrder as string}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          value={formik.values.description || ''}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          rows={4}
          placeholder="Entrez une description pour la catégorie"
        />
        {formik.touched.description && formik.errors.description && (
          <p className="text-red-500 text-sm">{formik.errors.description}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="imageUrl">URL de l'image</Label>
        <div className="flex items-center gap-4">
          <Input
            id="image"
            name="image"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="flex-1"
          />
          {imagePreview && (
            <img
              src={imagePreview}
              alt="Aperçu"
              className="h-20 w-20 rounded object-cover border"
            />
          )}
        </div>
        {formik.touched.imageUrl && formik.errors.imageUrl && (
          <p className="text-red-500 text-sm">{formik.errors.imageUrl}</p>
        )}
      </div>

      <div className="flex justify-end space-x-4 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Annuler
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </div>
    </form>
  );
};
