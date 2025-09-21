import React, { useEffect, useState } from 'react';
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
import type { CreateProduct, UpdateProduct } from '@/types/product.types';
import type { Category } from '@/types/category.types';
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
      formik.setFieldValue('images', [
        ...(formik.values.images || []),
        previewUrl.replace('blob:', ''),
      ]);
      // if (formik.values.images?.length === 0) formik.setFieldValue('imageUrl', previewUrl);
    }
  };

  return (
    <form onSubmit={formik.handleSubmit} className="space-y-4">
      {/* Basic Information */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">
            Nom du produit <span className="text-red-700">*</span>
          </Label>
          <Input
            id="name"
            name="name"
            value={formik.values.name}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            placeholder="Nom du produit"
            required
          />
          {formik.touched.name && formik.errors.name && (
            <p className="text-red-600 text-sm">{formik.errors.name}</p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="reference">
            Code Référence <span className="text-red-700">*</span>
          </Label>
          <Input
            id="reference"
            name="reference"
            value={formik.values.reference}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            placeholder="Réf. produit"
            required
          />
          {formik.touched.reference && formik.errors.reference && (
            <p className="text-red-600 text-sm">{formik.errors.reference}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="categoryId">
            Catégorie<span className="text-red-700">*</span>
          </Label>
          <Select
            name="categoryId"
            value={formik.values.categoryId || ''}
            onValueChange={(value) => formik.setFieldValue('categoryId', value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choisir une catégorie" />
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
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="price">
            Prix (FCFA) <span className="text-red-700">*</span>
          </Label>
          <Input
            id="price"
            name="price"
            type="number"
            min="0"
            step="0.01"
            value={formik.values.price}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            placeholder="0.00"
            required
          />
          {formik.touched.price && formik.errors.price && (
            <p className="text-red-600 text-sm">{formik.errors.price}</p>
          )}
        </div>
      </div>

      {/* Pricing, Units and Stock */}
      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="unit">
            Unité <span className="text-red-700">*</span>
          </Label>
          <Select
            name="unit"
            value={formik.values.unit}
            onValueChange={(value) => formik.setFieldValue('unit', value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choisir une unité" />
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
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="stock">
            Stock disponible <span className="text-red-700">*</span>
          </Label>
          <Input
            id="stock"
            name="stock"
            type="number"
            min="0"
            step="1"
            value={formik.values.stock}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            required
          />
          {formik.touched.stock && formik.errors.stock && (
            <p className="text-red-600 text-sm">{formik.errors.stock}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="stockAlert">
            Alerte stock <span className="text-red-700">*</span>
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

      {/* Description */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">
          Description <span className="text-red-700">*</span>
        </Label>
        <Textarea
          id="description"
          name="description"
          value={formik.values.description}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          placeholder="Décrivez votre produit..."
          rows={4}
          required
        />
        {formik.touched.description && formik.errors.description && (
          <p className="text-red-600 text-sm">{formik.errors.description}</p>
        )}
      </div>

      {/* Image Upload */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="image">Image du produit</Label>
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
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-4 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Annuler
        </Button>
        <Button type="submit" disabled={isSubmitting} className="min-w-40" variant="default">
          {isSubmitting ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Enregistrement...
            </>
          ) : (
            'Enregistrer le produit'
          )}
        </Button>
      </div>
    </form>
  );
};
