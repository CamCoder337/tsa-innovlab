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
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  Filter,
  Eye,
  EyeOff,
  DollarSign,
  BarChart3,
  Tag,
} from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { useAllAdminStats } from '@/hooks/useAdminStats';
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
import { toast } from 'sonner';
import type { Category, CreateCategory, UpdateCategory } from '@/types/category.types';
import { CategoryForm } from '@/components/forms/CategoryForm';
import {
  useAdminTranslation,
  useCommonTranslation,
  useErrorsTranslation,
} from '@/hooks/useTranslation';
import { useSearchParams } from 'react-router-dom';
import { formatCurrency } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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
    error: productError,
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
  const allStats = useAllAdminStats();
  const { t: tAdmin } = useAdminTranslation();
  const { t: tCommon } = useCommonTranslation();
  const { t: tErrors } = useErrorsTranslation();

  const [filters, setFilters] = useState<ProductFilterParams>(defaultFilters);
  const [searchParams] = useSearchParams();
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<UpdateProduct | null>(null);
  const [editingCategory, setEditingCategory] = useState<UpdateCategory | null>(null);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        // Search filter
        if (filters.search) {
          const query = filters.search.toLowerCase();
          const matchesName = product.name.toLowerCase().includes(query);
          const matchesDescription = product.description?.toLowerCase().includes(query) ?? false;
          const matchesCategory = product.category?.name.toLowerCase().includes(query) ?? false;

          if (!matchesName && !matchesDescription && !matchesCategory) {
            return false;
          }
        }

        // Category filter
        if (filters.categoryId && filters.categoryId.length > 0) {
          if (Array.isArray(filters.categoryId)) {
            if (!filters.categoryId.includes(product.categoryId ?? '')) {
              return false;
            }
          } else if (filters.categoryId !== product.categoryId) {
            return false;
          }
        }

        // Price range filter
        const productPrice = parseFloat(product.price);
        if (filters.minPrice !== undefined && productPrice < filters.minPrice) {
          return false;
        }
        if (filters.maxPrice !== undefined && productPrice > filters.maxPrice) {
          return false;
        }

        // Stock status filters
        if (filters.inStock && product.stock <= 0) {
          return false;
        }
        if (filters.lowStock && product.stock > product.stockAlert) {
          return false;
        }

        // Active status filter
        if (filters.isActive !== undefined && product.isActive !== filters.isActive) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
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
  }, [products, filters]);

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
        loading: tAdmin('products.creating'),
      });

      if (productError) {
        toast.error(tAdmin('products.createError'));
        return;
      }

      toast.success(tAdmin('products.createSuccess'));
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
        throw new Error(tAdmin('products.notFound'));
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
        loading: tAdmin('products.updating'),
      });

      if (productError) {
        toast.error('Erreur lors de la mise à jour du produit');
        return;
      }

      toast.success(tAdmin('products.updateSuccess'));
      setIsDialogOpen(false);
      setEditingProduct(null);
      productFormik.resetForm();
    } catch (error) {
      console.error('Error updating product:', error);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm(tAdmin('products.deleteConfirm'))) return;

    try {
      await toast.promise(deleteProduct(id), {
        loading: tAdmin('products.deleting'),
      });

      if (productError) {
        toast.error(tAdmin('products.deleteError'));
        return;
      }

      toast.success(tAdmin('products.deleteSuccess'));
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const handleAddCategory = async (values: CreateCategory) => {
    try {
      await toast.promise(createCategory(values), {
        loading: tAdmin('products.creatingCategory'),
      });

      if (categoryError) {
        toast.error(tAdmin('products.createCategoryError'));
        return;
      }

      toast.success(tAdmin('products.createCategorySuccess'));
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
    if (!confirm(tAdmin('products.deleteConfirm'))) return;

    try {
      await toast.promise(deleteCategory(id), {
        loading: tAdmin('products.deleting'),
      });

      if (categoryError) {
        toast.error(tAdmin('products.deleteError'));
        return;
      }

      toast.success(tAdmin('products.deleteSuccess'));
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
        console.error('Error saving product:', error);
        toast.error(tErrors('general.saveError'));
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
        console.error('Error saving category:', error);
        toast.error(tAdmin('products.saveCategoryError'));
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
    <div className="flex flex-1 flex-col bg-gray-50 dark:bg-gray-950 p-3 sm:p-4 lg:p-6">
      <div className="flex-1 p-3 sm:p-4 lg:p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2 truncate">
              {tAdmin('products.title')}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 truncate">
              {tAdmin('products.subtitle')}
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="overview">
              {tAdmin('products.tabs.overview') || "Vue d'ensemble"}
            </TabsTrigger>
            <TabsTrigger value="products">
              {tAdmin('products.tabs.allProducts') || 'Tous les produits'}
            </TabsTrigger>
            <TabsTrigger value="categories">
              {tAdmin('products.tabs.categories') || 'Catégories'}
            </TabsTrigger>
            <TabsTrigger value="analytics">
              {tAdmin('products.tabs.analytics') || 'Analytiques'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Quick Stats - Top 5 */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
              <Card>
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg flex-shrink-0">
                      <Package className="h-4 w-4 sm:h-5 sm:w-5 text-tsa-blue dark:text-tsa-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 truncate">
                        {tAdmin('products.totalProducts')}
                      </p>
                      <p className="text-lg sm:text-xl lg:text-2xl font-bold truncate">
                        {allStats.products.stats?.total || products?.length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg flex-shrink-0">
                      <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 truncate">
                        {tCommon('status.active')}
                      </p>
                      <p className="text-lg sm:text-xl lg:text-2xl font-bold truncate">
                        {allStats.products.stats?.active ||
                          products?.filter((product) => product.isActive).length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="p-1.5 sm:p-2 bg-yellow-100 rounded-lg flex-shrink-0">
                      <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 truncate">
                        {tAdmin('products.lowStock')}
                      </p>
                      <p className="text-lg sm:text-xl lg:text-2xl font-bold truncate">
                        {allStats.products.stats?.lowStockCount || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="p-1.5 sm:p-2 bg-purple-100 rounded-lg flex-shrink-0">
                      <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 truncate">
                        {tAdmin('dashboard.shop.totalValue')}
                      </p>
                      <p className="text-lg sm:text-xl lg:text-2xl font-bold truncate">
                        {formatCurrency(allStats.products.stats?.totalStockValue || 0)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="p-1.5 sm:p-2 bg-indigo-100 rounded-lg flex-shrink-0">
                      <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 truncate">
                        {tAdmin('dashboard.shop.totalQuantity')}
                      </p>
                      <p className="text-lg sm:text-xl lg:text-2xl font-bold truncate">
                        {allStats.products.stats?.totalStock || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Products by Category Chart & Inventory Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
                    {tAdmin('dashboard.shop.productsByCategory') || 'Produits par Catégorie'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={
                        allStats.products.stats?.byCategory.map((cat) => ({
                          name: cat.categoryName,
                          products: cat.productCount,
                          stock: cat.totalStock,
                        })) || []
                      }
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 12 }}
                        stroke="#6b7280"
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                        }}
                      />
                      <Bar
                        dataKey="products"
                        fill="#8b5cf6"
                        name={tAdmin('dashboard.shop.products') || 'Produits'}
                      />
                      <Bar
                        dataKey="stock"
                        fill="#3b82f6"
                        name={tAdmin('dashboard.shop.stock') || 'Stock'}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{tAdmin('dashboard.shop.inventory') || 'Inventaire'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <p className="text-2xl font-bold text-tsa-blue dark:text-tsa-white">
                          {allStats.products.stats?.totalStock || 0}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {tAdmin('dashboard.shop.totalQuantity')}
                        </p>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">
                          {formatCurrency(allStats.products.stats?.totalStockValue || 0)}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {tAdmin('dashboard.shop.totalValue')}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Product Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {tAdmin('dashboard.shop.productDistribution') || 'Distribution des Produits'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      {tCommon('status.active')}s
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{
                            width: `${((allStats.products.stats?.active || 0) / (allStats.products.stats?.total || 1)) * 100}%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">
                        {allStats.products.stats?.active || 0}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      {tAdmin('products.lowStock')}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-orange-600 h-2 rounded-full"
                          style={{
                            width: `${((allStats.products.stats?.lowStockCount || 0) / (allStats.products.stats?.total || 1)) * 100}%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">
                        {allStats.products.stats?.lowStockCount || 0}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      {tAdmin('dashboard.shop.outOfStockShort')}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-red-600 h-2 rounded-full"
                          style={{
                            width: `${((allStats.products.stats?.outOfStockCount || 0) / (allStats.products.stats?.total || 1)) * 100}%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">
                        {allStats.products.stats?.outOfStockCount || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products">
            {/* Filters and Search */}
            <Card className="mb-4 sm:mb-6">
              <CardContent className="p-3 sm:p-4">
                <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                    <Input
                      placeholder={tAdmin('products.searchPlaceholder')}
                      value={filters.search}
                      onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                      className="pl-8 sm:pl-10 text-xs sm:text-sm"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full sm:w-fit justify-start text-xs sm:text-sm"
                        >
                          <Filter className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                          <span className="truncate">
                            {filters.categoryId?.length ? (
                              <span>
                                {tAdmin('products.categoriesSelected', {
                                  count: filters.categoryId.length,
                                })}
                              </span>
                            ) : (
                              <span>{tAdmin('products.filterByCategories')}</span>
                            )}
                          </span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-56">
                        <DropdownMenuLabel>
                          {tAdmin('products.filterByCategories')}
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuCheckboxItem
                          checked={filters.categoryId?.length === 0}
                          onCheckedChange={() =>
                            setFilters((prev) => ({ ...prev, categoryId: [] }))
                          }
                        >
                          {tAdmin('products.allCategories')}
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
                      <SelectTrigger className="w-full sm:w-48 text-xs sm:text-sm">
                        <SelectValue placeholder={tAdmin('products.filterByStatus')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{tAdmin('products.allStatuses')}</SelectItem>
                        <SelectItem value="active">{tCommon('status.active')}</SelectItem>
                        <SelectItem value="inactive">{tCommon('status.inactive')}</SelectItem>
                        <SelectItem value="low_stock">{tAdmin('products.lowStock')}</SelectItem>
                        <SelectItem value="out_of_stock">
                          {tAdmin('products.outOfStock')}
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      className="gap-1 sm:gap-2 bg-tsa-blue text-xs sm:text-sm w-full sm:w-auto"
                      onClick={() => {
                        setEditingProduct(null);
                        productFormik.resetForm();
                        setIsDialogOpen(true);
                      }}
                    >
                      <Plus className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span>{tAdmin('products.addProduct')}</span>
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
                      <SheetContent className="w-4/5 sm:min-w-fit p-3 sm:p-4 max-h-screen overflow-y-auto">
                        <SheetHeader>
                          <SheetTitle className="text-base sm:text-lg">
                            {editingProduct
                              ? tAdmin('products.editProduct')
                              : tAdmin('products.addProduct')}
                          </SheetTitle>
                          <SheetDescription className="text-xs sm:text-sm">
                            {editingProduct
                              ? tAdmin('products.editProductDescription')
                              : tAdmin('products.addProductDescription')}
                          </SheetDescription>
                        </SheetHeader>
                        <div>
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
                </div>
              </CardContent>
            </Card>

            {/* Products List */}
            <Card>
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="text-base sm:text-lg">
                  {tAdmin('products.catalogTitle', { count: filteredProducts.length })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 sm:space-y-4">
                  {filteredProducts.map((product) => {
                    const isLowStock = product.stock > 0 && product.stock <= product.stockAlert;
                    return (
                      <div
                        key={product.id}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 p-3 sm:p-4 border dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:bg-gray-950"
                      >
                        <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0 flex-1">
                          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 dark:bg-gray-800 rounded-md flex items-center justify-center flex-shrink-0">
                            {product.imageUrl ? (
                              <img
                                src={product.imageUrl || product.images[0]}
                                alt={product.name}
                                className="w-full h-full object-cover rounded-md"
                              />
                            ) : (
                              <Package className="h-4 w-4 sm:h-6 sm:w-6 text-gray-400" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-medium text-sm sm:text-base truncate">
                              {product.name}
                            </h3>
                            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                              {product.description || tAdmin('products.noDescription')}
                            </p>
                            <div className="flex items-center gap-1 sm:gap-2 mt-1 sm:mt-2 flex-wrap">
                              <Badge
                                variant={product.isActive ? 'default' : 'secondary'}
                                className="whitespace-nowrap text-xs"
                              >
                                {product.isActive
                                  ? tCommon('status.active')
                                  : tCommon('status.inactive')}
                              </Badge>
                              <Badge
                                variant={isLowStock ? 'destructive' : 'outline'}
                                className="whitespace-nowrap text-xs"
                              >
                                {tAdmin('products.inStockCount', { count: product.stock })}
                              </Badge>
                              {product.category && (
                                <Badge variant="secondary" className="whitespace-nowrap text-xs">
                                  {product.category.name}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                          <div className="text-center sm:text-right">
                            <p className="font-bold text-base sm:text-lg">
                              {formatCurrency(parseFloat(product.price))}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditProduct(product)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteProduct(product.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {tAdmin('products.analytics.salesPerformance') || 'Performance des Ventes'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {tAdmin('dashboard.shop.totalOrders')}
                      </span>
                      <span className="font-medium">
                        {allStats.overview.stats?.orders.total || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {tAdmin('dashboard.shop.revenueFcfa')}
                      </span>
                      <span className="font-medium">
                        {allStats.overview.stats?.revenue.total
                          ? `${allStats.overview.stats.revenue.total.toLocaleString()}`
                          : '0'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {tAdmin('dashboard.shop.availabilityRate')}
                      </span>
                      <span className="font-medium text-green-600">
                        {allStats.products.stats?.total
                          ? `${Math.round(((allStats.products.stats?.active || 0) / allStats.products.stats.total) * 100)}%`
                          : '0%'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>
                    {tAdmin('products.analytics.keyIndicators') || 'Indicateurs Clés'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {tAdmin('dashboard.shop.activeCategories')}
                      </span>
                      <span className="font-medium">
                        {allStats.products.stats?.byCategory?.length || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {tAdmin('dashboard.shop.averageValuePerProduct')}
                      </span>
                      <span className="font-medium">
                        {allStats.products.stats?.totalStockValue && allStats.products.stats?.total
                          ? `${Math.round(allStats.products.stats.totalStockValue / allStats.products.stats.total).toLocaleString()} FCFA`
                          : '0 FCFA'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {tAdmin('dashboard.shop.lowStockRate')}
                      </span>
                      <span className="font-medium">
                        {allStats.products.stats?.total
                          ? `${Math.round(((allStats.products.stats?.lowStockCount || 0) / allStats.products.stats.total) * 100)}%`
                          : '0%'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="categories" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 pb-3 sm:pb-6">
                <CardTitle className="text-base sm:text-lg">
                  {tAdmin('products.categoryManagement')}
                </CardTitle>
                <Button
                  className="gap-1 sm:gap-2 bg-tsa-blue text-xs sm:text-sm w-full sm:w-auto"
                  onClick={() => {
                    setEditingCategory(null);
                    categoryFormik.resetForm();
                    setIsDialogOpen(true);
                  }}
                >
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span>{tAdmin('products.addCategory')}</span>
                </Button>
                <Sheet
                  open={isDialogOpen && editingCategory !== null}
                  onOpenChange={(open) => {
                    if (!open) {
                      categoryFormik.resetForm();
                      setEditingCategory(null);
                    }
                    setIsDialogOpen(open);
                  }}
                >
                  <SheetContent className="w-4/5 sm:min-w-fit p-3 sm:p-4 max-h-screen overflow-y-auto">
                    <SheetHeader>
                      <SheetTitle className="text-base sm:text-lg">
                        {editingCategory
                          ? tAdmin('products.editCategory')
                          : tAdmin('products.addCategory')}
                      </SheetTitle>
                      <SheetDescription className="text-xs sm:text-sm">
                        {editingCategory
                          ? tAdmin('products.editCategoryDescription')
                          : tAdmin('products.addCategoryDescription')}
                      </SheetDescription>
                    </SheetHeader>
                    <div className="pt-4">
                      <CategoryForm
                        formik={categoryFormik}
                        categories={categories}
                        isSubmitting={categoryFormik.isSubmitting}
                        onCancel={() => {
                          setIsDialogOpen(false);
                          categoryFormik.resetForm();
                          setEditingCategory(null);
                        }}
                      />
                    </div>
                  </SheetContent>
                </Sheet>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 sm:space-y-4">
                  {categories.map((category) => (
                    <div
                      key={category.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 p-3 sm:p-4 border dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:bg-gray-950"
                    >
                      <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Tag className="h-4 w-4 sm:h-5 sm:w-5 text-tsa-blue dark:text-tsa-white" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                            <h4 className="font-medium text-gray-900 dark:text-white text-sm sm:text-base truncate">
                              {category.name}
                            </h4>
                            <Badge variant="outline" className="text-xs w-fit">
                              {category.isActive
                                ? tCommon('status.active')
                                : tCommon('status.inactive')}
                            </Badge>
                          </div>

                          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                            {category.products?.length || 0} {tAdmin('dashboard.labels.products')}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 sm:gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className={`gap-1 text-xs ${category.isActive ? 'bg-red-50 hover:bg-red-100 text-red-700' : 'bg-green-50 hover:bg-green-100 text-green-700'}`}
                          onClick={async () => {
                            try {
                              await updateCategory(category.id, {
                                id: category.id,
                                isActive: !category.isActive,
                              });
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
                          <span className="hidden sm:inline">
                            {category.isActive ? 'Masquer' : 'Afficher'}
                          </span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1 bg-transparent text-xs"
                          onClick={() => handleEditCategory(category)}
                        >
                          <Edit className="h-3 w-3" />
                          <span className="hidden sm:inline">{tCommon('actions.edit')}</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1 text-red-600 hover:text-red-700 bg-transparent text-xs"
                          onClick={() => handleDeleteCategory(category.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                          <span className="hidden sm:inline">{tCommon('actions.delete')}</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {tAdmin('products.analytics.salesPerformance') || 'Performance des Ventes'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {tAdmin('dashboard.shop.totalOrders')}
                      </span>
                      <span className="font-medium">
                        {allStats.overview.stats?.orders.total || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {tAdmin('dashboard.shop.revenueFcfa')}
                      </span>
                      <span className="font-medium">
                        {allStats.overview.stats?.revenue.total
                          ? `${allStats.overview.stats.revenue.total.toLocaleString()}`
                          : '0'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {tAdmin('dashboard.shop.availabilityRate')}
                      </span>
                      <span className="font-medium text-green-600">
                        {allStats.products.stats?.total
                          ? `${Math.round(((allStats.products.stats?.active || 0) / allStats.products.stats.total) * 100)}%`
                          : '0%'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>
                    {tAdmin('products.analytics.keyIndicators') || 'Indicateurs Clés'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {tAdmin('dashboard.shop.activeCategories')}
                      </span>
                      <span className="font-medium">
                        {allStats.products.stats?.byCategory?.length || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {tAdmin('dashboard.shop.averageValuePerProduct')}
                      </span>
                      <span className="font-medium">
                        {allStats.products.stats?.totalStockValue && allStats.products.stats?.total
                          ? `${Math.round(allStats.products.stats.totalStockValue / allStats.products.stats.total).toLocaleString()} FCFA`
                          : '0 FCFA'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {tAdmin('dashboard.shop.lowStockRate')}
                      </span>
                      <span className="font-medium">
                        {allStats.products.stats?.total
                          ? `${Math.round(((allStats.products.stats?.lowStockCount || 0) / allStats.products.stats.total) * 100)}%`
                          : '0%'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
