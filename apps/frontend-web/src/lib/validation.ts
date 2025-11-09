import * as yup from 'yup';
import type { CreateProduct, UpdateProduct } from '@/types/product.types';
import type { CreateCategory, UpdateCategory } from '@/types/category.types';

export const productValidationSchema = yup.object<CreateProduct | UpdateProduct>({
  name: yup
    .string()
    .required('Le nom est requis')
    .min(3, 'Le nom doit contenir au moins 3 caractères'),
  description: yup.string().nullable(),
  categoryId: yup.string().required('La catégorie est requise'),
  price: yup.number().required('Le prix est requis').min(0, 'Le prix ne peut pas être négatif'),
  stock: yup
    .number()
    .required('Le stock est requis')
    .integer('Le stock doit être un nombre entier')
    .min(0, 'Le stock ne peut pas être négatif'),
  reference: yup.string().nullable(),
  stockAlert: yup
    .number()
    .integer("Le seuil d'alerte doit être un nombre entier")
    .min(0, "Le seuil d'alerte ne peut pas être négatif")
    .nullable(),
  unit: yup.string().nullable(),
  imageUrl: yup.string().nullable(),
  specifications: yup.object().nullable(),
  isActive: yup.boolean().default(true),
});

export const categoryValidationSchema = yup.object<CreateCategory | UpdateCategory>({
  name: yup
    .string()
    .required('Le nom est requis')
    .min(3, 'Le nom doit contenir au moins 3 caractères'),
  description: yup.string().nullable(),
  parentId: yup.string().nullable(),
  slug: yup.string().nullable(),
  imageUrl: yup.string().nullable(),
  isActive: yup.boolean().default(true),
  displayOrder: yup
    .number()
    .integer("L'ordre d'affichage doit être un nombre entier")
    .min(0, "L'ordre d'affichage ne peut pas être négatif")
    .default(0),
});
