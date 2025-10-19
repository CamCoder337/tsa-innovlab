import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Package,
  Search,
  Plus,
  Edit,
  Trash2,
  Tag,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  Filter,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import type {
  ProductFilterParams,
  CreateProduct,
  UpdateProduct,
  Product,
} from '@/types/product.types';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { ProductForm } from '@/components/forms/ProductForm';
import { categoryValidationSchema, productValidationSchema } from '@/lib/validation';
import { useFormik } from 'formik';
import { toast } from 'react-hot-toast';
import type { Category, CreateCategory, UpdateCategory } from '@/types/category.types';
import { CategoryForm } from '@/components/forms/CategoryForm';
import { adminService } from '@/services/admin.service';

const defaultFilters: ProductFilterParams = {
  search: '',
  categoryId: [],
  minPrice: 0,
  inStock: true,
  isActive: undefined,
  sortBy: 'name',
  sortOrder: 'desc',
  page: 1,
  limit: 20,
};

export default function AdminProductsPage() {
  const {
    products,
    stats,
    error: productError,
    filterProducts,
    createProduct,
    updateProduct,
    deleteProduct,
  } = useProducts();
  const {
    categories,
    error: categoryError,
    createCategory,
    updateCategory,
    deleteCategory,
  } = useCategories();

  const [filters, setFilters] = useState<ProductFilterParams>(defaultFilters);
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('products');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<UpdateProduct | null>(null);
  const [editingCategory, setEditingCategory] = useState<UpdateCategory | null>(null);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    return filterProducts(filters).sort((a, b) => {
      // Sort products
      let result = 0;

      switch (filters.sortBy) {
        case 'price':
          result = parseFloat(a.price) - parseFloat(b.price);
          break;
        case 'updatedAt':
          result = new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
          break;
        case 'name':
          result = a.name.localeCompare(b.name);
          break;
        default:
          return 0;
      }

      // Apply sort order (asc/desc)
      return filters.sortOrder === 'desc' ? -result : result;
    });
  }, [filterProducts, filters]);

  const handleAddProduct = async (values: CreateProduct) => {
    try {
      // Ensure numeric fields are properly converted
      const payload = {
        ...values,
        price: Number(values.price),
        stock: values.stock ? Number(values.stock) : 0,
        stockAlert: values.stockAlert ? Number(values.stockAlert) : 0,
      };

      await toast.promise(createProduct(payload), {
        loading: 'Création du produit...',
      });

      if (productError) {
        toast.error('Erreur lors de la création du produit');
        return;
      }

      toast.success('Produit créé avec succès');
      setIsDialogOpen(false);
      productFormik.resetForm();
    } catch (error) {
      console.error('Error adding product:', error);
    }
  };

  const handleUpdateProduct = async (values: UpdateProduct) => {
    if (!editingProduct?.id) return;

    try {
      // Find the original product
      const originalProduct = products.find((p) => p.id === editingProduct.id);

      if (!originalProduct) {
        throw new Error('Produit introuvable');
      }

      // Create a map of changed fields
      const changes: Partial<UpdateProduct> = {};

      // Helper function to compare values
      const hasChanged = (key: keyof UpdateProduct, value: unknown): boolean => {
        if (key === 'id') return false;

        const originalValue = originalProduct[key as keyof Product];

        // Direct comparison for other fields
        return value !== originalValue;
      };

      // Check each field for changes
      (Object.entries(values) as [keyof UpdateProduct, unknown][]).forEach(([key, value]) => {
        if (hasChanged(key, value)) {
          changes[key] = value as never;
        }
      });

      // If nothing changed, show a message and return
      if (Object.keys(changes).length === 0) {
        toast('Aucune modification détectée', { icon: 'ℹ️' });
        return;
      }

      // Create the final payload with required id and changes
      const payload: UpdateProduct = {
        id: editingProduct.id,
        ...changes,
      };

      await toast.promise(updateProduct(editingProduct.id, payload), {
        loading: 'Mise à jour du produit...',
      });

      if (productError) {
        toast.error('Erreur lors de la mise à jour du produit');
        return;
      }

      toast.success('Produit mis à jour avec succès');
      setIsDialogOpen(false);
      setEditingProduct(null);
      productFormik.resetForm();
    } catch (error) {
      console.error('Error updating product:', error);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) return;

    try {
      await toast.promise(deleteProduct(id), {
        loading: 'Suppression du produit...',
      });

      if (productError) {
        toast.error('Erreur lors de la suppression du produit');
        return;
      }

      toast.success('Produit supprimé avec succès');
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const handleAddCategory = async (values: CreateCategory) => {
    try {
      await toast.promise(createCategory(values), {
        loading: 'Création de la catégorie...',
      });

      if (categoryError) {
        toast.error('Erreur lors de la création de la catégorie');
        return;
      }

      toast.success('Catégorie créée avec succès');
      setIsDialogOpen(false);
      categoryFormik.resetForm();
    } catch (error) {
      console.error('Error adding category:', error);
    }
  };

  const handleUpdateCategory = async (values: UpdateCategory) => {
    if (!editingCategory?.id) return;

    try {
      // Find the original category
      const originalCategory = categories.find((p) => p.id === editingCategory.id);

      if (!originalCategory) {
        throw new Error('Catégorie introuvable');
      }

      // Create a map of changed fields
      const changes: Partial<UpdateCategory> = {};

      // Helper function to compare values
      const hasChanged = (key: keyof UpdateCategory, value: unknown): boolean => {
        if (key === 'id') return false;

        const originalValue = originalCategory[key as keyof Category];

        // Direct comparison for other fields
        return value !== originalValue;
      };

      // Check each field for changes
      (Object.entries(values) as [keyof UpdateCategory, unknown][]).forEach(([key, value]) => {
        if (hasChanged(key, value)) {
          changes[key] = value as never;
        }
      });

      // If nothing changed, show a message and return
      if (Object.keys(changes).length === 0) {
        toast('Aucune modification détectée', { icon: 'ℹ️' });
        return;
      }

      // Create the final payload with required id and changes
      const payload: UpdateCategory = {
        id: editingCategory.id,
        ...changes,
      };

      await toast.promise(updateCategory(editingCategory.id, payload), {
        loading: 'Mise à jour de la catégorie...',
      });

      if (categoryError) {
        toast.error('Erreur lors de la mise à jour de la catégorie');
        return;
      }

      toast.success('Catégorie mise à jour avec succès');
      setIsDialogOpen(false);
      setEditingCategory(null);
      categoryFormik.resetForm();
    } catch (error) {
      console.error('Error updating category:', error);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) return;

    try {
      await toast.promise(deleteCategory(id), {
        loading: 'Suppression de la catégorie...',
      });

      if (categoryError) {
        toast.error('Erreur lors de la suppression de la catégorie');
        return;
      }

      toast.success('Catégorie supprimée avec succès');
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  const productFormik = useFormik<CreateProduct | UpdateProduct>({
    initialValues: editingProduct || {
      name: '',
      description: '',
      categoryId: '',
      price: 0,
      stock: 0,
      reference: '',
      stockAlert: 5,
      unit: 'pièce',
      isActive: true,
      images: [],
    },
    validateOnBlur: true,
    validateOnChange: true,
    validationSchema: productValidationSchema,
    enableReinitialize: true,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        console.log('Submitting product form with values:', values);
        if (editingProduct) {
          await handleUpdateProduct(values as UpdateProduct);
        } else {
          await handleAddProduct(values as CreateProduct);
        }
      } catch (error) {
        console.error('Erreur lors de la sauvegarde du produit:', error);
        toast.error('Une erreur est survenue lors de la sauvegarde du produit');
      } finally {
        setSubmitting(false);
      }
    },
  });

  const categoryFormik = useFormik<CreateCategory | UpdateCategory>({
    initialValues: editingCategory || {
      name: '',
      description: '',
      parentId: '',
      slug: '',
      imageUrl: '',
      displayOrder: categories.length + 1,
    },
    validateOnBlur: true,
    validateOnChange: true,
    validationSchema: categoryValidationSchema,
    enableReinitialize: true,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        console.log('Submitting category form with values:', values);
        if (editingCategory) {
          await handleUpdateCategory(values as UpdateCategory);
        } else {
          await handleAddCategory(values as CreateCategory);
        }
      } catch (error) {
        console.error('Erreur lors de la sauvegarde de la catégorie:', error);
        toast.error('Une erreur est survenue lors de la sauvegarde de la catégorie');
      } finally {
        setSubmitting(false);
      }
    },
  });

  const handleEditProduct = (product: Product) => {
    setEditingProduct({
      ...product,
      price: parseFloat(product.price),
    });
    setIsDialogOpen(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category as UpdateCategory);
    setIsDialogOpen(true);
  };

  return (
    <div className="flex min-h-screen bg-gray-50 p-6">
      <div className="flex-1 p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestion des Produits</h1>
            <p className="text-gray-600">
              Gérez le catalogue de pièces détachées et les catégories
            </p>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Package className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Produits</p>
                  <p className="text-2xl font-bold">
                    {stats?.products?.totalProducts || products?.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Produits Actifs</p>
                  <p className="text-2xl font-bold">
                    {stats?.products?.activeProducts ||
                      products?.filter((product) => product.isActive).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Stock Faible</p>
                  <p className="text-2xl font-bold">{stats?.products?.lowStockProducts}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Revenus Total</p>
                  <p className="text-2xl font-bold">
                    {(stats?.products?.totalValue / 1000000).toFixed(1)}M
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Onglets */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="products">
              Produits ({stats?.products?.totalProducts || products?.length})
            </TabsTrigger>
            <TabsTrigger value="categories">Catégories ({categories.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            {/* Filtres et recherche */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Rechercher par nom, desc ou catégorie..."
                      value={filters.search}
                      onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                      className="pl-10"
                    />
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-fit justify-start">
                        <Filter className="mr-2 h-4 w-4" />
                        {filters.categoryId?.length ? (
                          <span>{filters.categoryId.length} catégorie(s) sélectionnée(s)</span>
                        ) : (
                          <span>Filtrer par catégories</span>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56">
                      <DropdownMenuLabel>Filtrer par catégories</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuCheckboxItem
                        checked={filters.categoryId?.length === 0}
                        onCheckedChange={() => setFilters((prev) => ({ ...prev, categoryId: [] }))}
                      >
                        Toutes les catégories
                      </DropdownMenuCheckboxItem>
                      {categories?.map((category) => (
                        <DropdownMenuCheckboxItem
                          key={category.id}
                          checked={filters.categoryId?.includes(category.id)}
                          onCheckedChange={(checked) => {
                            setFilters((prev) => {
                              const currentCategoryIds = Array.isArray(prev.categoryId)
                                ? prev.categoryId
                                : prev.categoryId
                                  ? [prev.categoryId]
                                  : [];

                              return {
                                ...prev,
                                categoryId: checked
                                  ? [...currentCategoryIds, category.id]
                                  : currentCategoryIds.filter((id) => id !== category.id),
                              };
                            });
                          }}
                        >
                          {category.name}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Select
                    value={statusFilter}
                    onValueChange={(value) => {
                      setStatusFilter(value);
                      switch (value) {
                        case 'all':
                          setFilters((prev) => ({
                            ...prev,
                            isActive: undefined,
                            inStock: true,
                            lowStock: false,
                          }));
                          break;
                        case 'active':
                          setFilters((prev) => ({ ...prev, isActive: true }));
                          break;
                        case 'inactive':
                          setFilters((prev) => ({ ...prev, isActive: false }));
                          break;
                        case 'low_stock':
                          setFilters((prev) => ({ ...prev, lowStock: true }));
                          break;
                        case 'out_of_stock':
                          setFilters((prev) => ({ ...prev, inStock: false }));
                          break;
                      }
                    }}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filtrer par statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="active">Actif</SelectItem>
                      <SelectItem value="inactive">Inactif</SelectItem>
                      <SelectItem value="low_stock">Stock Faible</SelectItem>
                      <SelectItem value="out_of_stock">Rupture de stock</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    className="gap-2 bg-tsa-blue"
                    onClick={() => {
                      setEditingProduct(null);
                      productFormik.resetForm();
                      setIsDialogOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    Nouveau Produit
                  </Button>
                  <Sheet
                    open={isDialogOpen}
                    onOpenChange={(open) => {
                      if (!open) {
                        productFormik.resetForm();
                        setEditingProduct(null);
                      }
                      setIsDialogOpen(open);
                    }}
                  >
                    <SheetContent className="w-4/5 sm:min-w-fit p-4 max-h-screen overflow-y-auto">
                      <SheetHeader>
                        <SheetTitle>
                          {editingProduct ? 'Modifier le produit' : 'Ajouter un nouveau produit'}
                        </SheetTitle>
                        <SheetDescription>
                          {editingProduct
                            ? 'Modifiez les détails du produit'
                            : 'Remplissez les informations pour créer un nouveau produit'}
                        </SheetDescription>
                      </SheetHeader>
                      <div className="p">
                        <ProductForm
                          formik={productFormik}
                          categories={categories}
                          isSubmitting={productFormik.isSubmitting}
                          onCancel={() => {
                            setIsDialogOpen(false);
                            productFormik.resetForm();
                            setEditingProduct(null);
                          }}
                        />
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
              </CardContent>
            </Card>

            {/* Liste des produits */}
            <Card>
              <CardHeader>
                <CardTitle>{`Catalogue des Produits (${filteredProducts.length})`}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredProducts.map((product) => {
                    const isLowStock = product.stock > 0 && product.stock <= product.stockAlert;
                    return (
                      <div
                        key={product.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-gray-100 rounded-md flex items-center justify-center flex-shrink-0">
                            {product.imageUrl ? (
                              <img
                                src={product.imageUrl || product.images[0]}
                                alt={product.name}
                                className="w-full h-full object-cover rounded-md"
                              />
                            ) : (
                              <Package className="h-6 w-6 text-gray-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-medium truncate">{product.name}</h3>
                            <p className="text-sm text-gray-500 truncate">
                              {product.description || 'Aucune description'}
                            </p>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <Badge
                                variant={product.isActive ? 'default' : 'secondary'}
                                className="whitespace-nowrap"
                              >
                                {product.isActive ? 'Actif' : 'Inactif'}
                              </Badge>
                              <Badge
                                variant={isLowStock ? 'destructive' : 'outline'}
                                className="whitespace-nowrap"
                              >
                                {product.stock} en stock
                              </Badge>
                              {product.category && (
                                <Badge variant="secondary" className="whitespace-nowrap">
                                  {product.category.name}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-bold text-lg">
                              {parseFloat(product.price).toLocaleString()} FCFA
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className={`gap-1 ${product.isActive ? 'bg-red-50 hover:bg-red-100 text-red-700' : 'bg-green-50 hover:bg-green-100 text-green-700'}`}
                              onClick={async () => {
                                try {
                                  await updateProduct(product.id, {
                                    id: product.id,
                                    isActive: !product.isActive,
                                  });
                                  if (productError) {
                                    toast.error('Erreur lors de la mise à jour du produit');
                                    return;
                                  }
                                } catch (error) {
                                  console.log(error);
                                }
                              }}
                            >
                              {product.isActive ? (
                                <EyeOff className="h-3 w-3" />
                              ) : (
                                <Eye className="h-3 w-3" />
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1 bg-transparent"
                              onClick={() => handleEditProduct(product)}
                            >
                              <Edit className="h-3 w-3" />
                              Modifier
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700 gap-1 bg-transparent"
                              onClick={() => handleDeleteProduct(product.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                              Supprimer
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {filteredProducts.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Aucun produit trouvé avec ces critères.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Gestion des Catégories</CardTitle>
                <Button
                  className="gap-2 bg-tsa-blue"
                  onClick={() => {
                    setEditingCategory(null);
                    categoryFormik.resetForm();
                    setIsDialogOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Nouvelle Catégorie
                </Button>
                <Sheet
                  open={isDialogOpen}
                  onOpenChange={(open) => {
                    if (!open) {
                      categoryFormik.resetForm();
                      setEditingCategory(null);
                    }
                    setIsDialogOpen(open);
                  }}
                >
                  <SheetContent className="w-4/5 sm:min-w-fit p-4 max-h-screen overflow-y-auto">
                    <SheetHeader>
                      <SheetTitle>
                        {editingCategory
                          ? 'Modifier la catégorie'
                          : 'Ajouter une nouvelle catégorie'}
                      </SheetTitle>
                      <SheetDescription>
                        {editingCategory
                          ? 'Modifiez les détails de la catégorie'
                          : 'Remplissez les informations pour créer une nouvelle catégorie'}
                      </SheetDescription>
                    </SheetHeader>
                    <div className="p">
                      <CategoryForm
                        formik={categoryFormik}
                        categories={categories}
                        isSubmitting={categoryFormik.isSubmitting}
                        onCancel={() => {
                          setIsDialogOpen(false);
                          productFormik.resetForm();
                          setEditingProduct(null);
                        }}
                      />
                    </div>
                  </SheetContent>
                </Sheet>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categories.map((category) => (
                    <div
                      key={category.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Tag className="h-5 w-5 text-blue-600" />
                        </div>

                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-gray-900">{category.name}</h4>
                            <Badge variant="outline">
                              {category.isActive ? 'ACTIF' : 'INACTIF'}
                            </Badge>
                          </div>

                          <div className="text-sm text-gray-600">
                            {category.products?.length || 0} produits
                          </div>

                          {/*  */}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className={`gap-1 ${category.isActive ? 'bg-red-50 hover:bg-red-100 text-red-700' : 'bg-green-50 hover:bg-green-100 text-green-700'}`}
                          onClick={async () => {
                            try {
                              const response = await adminService.updateCategory(category.id, {
                                id: category.id,
                                isActive: !category.isActive,
                              });
                              if (response.data) {
                                updateCategory(category.id, response.data.category);
                              }
                            } catch (error) {
                              console.log(error);
                            }
                          }}
                        >
                          {category.isActive ? (
                            <EyeOff className="h-3 w-3" />
                          ) : (
                            <Eye className="h-3 w-3" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1 bg-transparent"
                          onClick={() => handleEditCategory(category)}
                        >
                          <Edit className="h-3 w-3" />
                          Modifier
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1 text-red-600 hover:text-red-700 bg-transparent"
                          onClick={() => handleDeleteCategory(category.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                          Supprimer
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
