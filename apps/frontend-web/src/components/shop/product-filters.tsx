import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ChevronDown, ChevronRight, X } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import type { ProductFilter, ProductCondition } from "@/types/shop.types"

interface ProductFiltersProps {
    filters: ProductFilter
    onFiltersChange: (filters: ProductFilter) => void
    onClearFilters: () => void
}

const categories = [
    {
        name: "Pièces Moteur",
        subcategories: ["Pistons", "Soupapes", "Joints", "Filtres"],
    },
    {
        name: "Transmission",
        subcategories: ["Boîtes de vitesses", "Embrayages", "Arbres de transmission"],
    },
    {
        name: "Système de Freinage",
        subcategories: ["Plaquettes de frein", "Disques de frein", "Étriers de frein"],
    },
    {
        name: "Suspension",
        subcategories: ["Amortisseurs", "Ressorts", "Jambes de force"],
    },
    {
        name: "Électrique",
        subcategories: ["Alternateurs", "Démarreurs", "Batteries"],
    },
]

const brands = ["Bosch", "Continental", "Valeo", "Denso", "Mahle", "Febi", "Lemförder", "Sachs"]
const conditions: ProductCondition[] = ["Neuf", "Comme Neuf", "Bon", "Correct"]

export function ProductFilters({ filters, onFiltersChange, onClearFilters }: ProductFiltersProps) {
    const [expandedCategories, setExpandedCategories] = useState<string[]>(["Pièces Moteur"])
    const [priceRange, setPriceRange] = useState<[number, number]>(filters.priceRange)

    const toggleCategory = (category: string) => {
        setExpandedCategories((prev) =>
            prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category],
        )
    }

    const handleCategoryChange = (category: string, checked: boolean) => {
        const newCategories = checked ? [...filters.categories, category] : filters.categories.filter((c) => c !== category)

        onFiltersChange({ ...filters, categories: newCategories })
    }

    const handleConditionChange = (condition: ProductCondition, checked: boolean) => {
        const newConditions = checked
            ? [...filters.conditions, condition]
            : filters.conditions.filter((c) => c !== condition)

        onFiltersChange({ ...filters, conditions: newConditions })
    }

    const handleBrandChange = (brand: string, checked: boolean) => {
        const newBrands = checked ? [...filters.brands, brand] : filters.brands.filter((b) => b !== brand)

        onFiltersChange({ ...filters, brands: newBrands })
    }

    const handlePriceRangeChange = (value: number[]) => {
        const newRange: [number, number] = [value[0], value[1]]
        setPriceRange(newRange)
        onFiltersChange({ ...filters, priceRange: newRange })
    }

    const activeFiltersCount =
        filters.categories.length + filters.conditions.length + filters.brands.length + (filters.inStockOnly ? 1 : 0)

    return (
        <Card className="w-80">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Filtres</CardTitle>
                    {activeFiltersCount > 0 && (
                        <Button variant="ghost" size="sm" onClick={onClearFilters} className="gap-2">
                            <X className="h-4 w-4" />
                            Effacer ({activeFiltersCount})
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Categories */}
                <div>
                    <h3 className="font-medium mb-3">Catégories</h3>
                    <div className="space-y-2">
                        {categories.map((category) => (
                            <div key={category.name}>
                                <Collapsible
                                    open={expandedCategories.includes(category.name)}
                                    onOpenChange={() => toggleCategory(category.name)}
                                >
                                    <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-gray-50 rounded">
                                        <div className="flex items-center gap-2">
                                            <Checkbox
                                                checked={filters.categories.includes(category.name)}
                                                onCheckedChange={(checked) => handleCategoryChange(category.name, checked as boolean)}
                                            />
                                            <span className="text-sm">{category.name}</span>
                                        </div>
                                        {expandedCategories.includes(category.name) ? (
                                            <ChevronDown className="h-4 w-4" />
                                        ) : (
                                            <ChevronRight className="h-4 w-4" />
                                        )}
                                    </CollapsibleTrigger>
                                    <CollapsibleContent className="ml-6 mt-2 space-y-2">
                                        {category.subcategories.map((sub) => (
                                            <div key={sub} className="flex items-center gap-2">
                                                <Checkbox
                                                    checked={filters.categories.includes(sub)}
                                                    onCheckedChange={(checked) => handleCategoryChange(sub, checked as boolean)}
                                                />
                                                <span className="text-sm text-muted-foreground">{sub}</span>
                                            </div>
                                        ))}
                                    </CollapsibleContent>
                                </Collapsible>
                            </div>
                        ))}
                    </div>
                </div>

                <Separator />

                {/* Price Range */}
                <div>
                    <h3 className="font-medium mb-3">Gamme de Prix</h3>
                    <div className="space-y-4">
                        <Slider
                            value={priceRange}
                            onValueChange={handlePriceRangeChange}
                            max={5000}
                            min={0}
                            step={50}
                            className="w-full"
                        />
                        <div className="flex items-center gap-2">
                            <Input
                                type="number"
                                value={priceRange[0]}
                                onChange={(e) => handlePriceRangeChange([Number.parseInt(e.target.value) || 0, priceRange[1]])}
                                className="w-20"
                                min={0}
                            />
                            <span>-</span>
                            <Input
                                type="number"
                                value={priceRange[1]}
                                onChange={(e) => handlePriceRangeChange([priceRange[0], Number.parseInt(e.target.value) || 5000])}
                                className="w-20"
                                min={0}
                            />
                            <span className="text-sm text-muted-foreground">FCFA</span>
                        </div>
                    </div>
                </div>

                <Separator />

                {/* Condition */}
                <div>
                    <h3 className="font-medium mb-3">État</h3>
                    <div className="space-y-2">
                        {conditions.map((condition) => (
                            <div key={condition} className="flex items-center gap-2">
                                <Checkbox
                                    checked={filters.conditions.includes(condition)}
                                    onCheckedChange={(checked) => handleConditionChange(condition, checked as boolean)}
                                />
                                <span className="text-sm">{condition}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <Separator />

                {/* Brands */}
                <div>
                    <h3 className="font-medium mb-3">Marques</h3>
                    <div className="space-y-2">
                        {brands.map((brand) => (
                            <div key={brand} className="flex items-center gap-2">
                                <Checkbox
                                    checked={filters.brands.includes(brand)}
                                    onCheckedChange={(checked) => handleBrandChange(brand, checked as boolean)}
                                />
                                <span className="text-sm">{brand}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <Separator />

                {/* Compatibility Checker */}
                <div>
                    <h3 className="font-medium mb-3">Compatibilité</h3>
                    <Input
                        placeholder="Entrez le modèle du véhicule (ex: Toyota Camry 2018)"
                        value={filters.compatibility}
                        onChange={(e) => onFiltersChange({ ...filters, compatibility: e.target.value })}
                    />
                </div>

                <Separator />

                {/* Availability */}
                <div className="flex items-center gap-2">
                    <Checkbox
                        checked={filters.inStockOnly}
                        onCheckedChange={(checked) => onFiltersChange({ ...filters, inStockOnly: checked as boolean })}
                    />
                    <span className="text-sm">En stock seulement</span>
                </div>
            </CardContent>
        </Card>
    )
}
