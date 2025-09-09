import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2, Plus, Minus, ShoppingCart, CreditCard, Truck, Shield, ArrowLeft } from "lucide-react"
import { Link } from "react-router-dom"
import type { CartItem } from '@/types/shop.types'

const mockCartItems: CartItem[] = [
    {
        id: "1",
        name: "Bosch Engine Oil Filter",
        price: 15000,
        originalPrice: 18000,
        image: "/oil-filter.png",
        quantity: 2,
        inStock: true,
        stockQuantity: 25,
        qualityScore: 92,
        warranty: "6 months warranty",
        weight: 0.3,
    },
    {
        id: "2",
        name: "Continental Brake Pads Set",
        price: 45000,
        image: "/brake-pads-close-up.png",
        quantity: 1,
        inStock: true,
        stockQuantity: 2,
        qualityScore: 96,
        warranty: "12 months warranty",
        weight: 1.2,
    },
]

export default function Cart() {
    const [cartItems, setCartItems] = useState(mockCartItems)
    const [promoCode, setPromoCode] = useState("")
    const [deliveryOption, setDeliveryOption] = useState("standard")

    const updateQuantity = (id: string, newQuantity: number) => {
        if (newQuantity <= 0) {
            removeItem(id)
            return
        }
        setCartItems((items) =>
            items.map((item) => (item.id === id ? { ...item, quantity: Math.min(newQuantity, item.stockQuantity) } : item)),
        )
    }

    const removeItem = (id: string) => {
        setCartItems((items) => items.filter((item) => item.id !== id))
    }

    const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const totalWeight = cartItems.reduce((sum, item) => sum + item.weight * item.quantity, 0)
    const deliveryFee = deliveryOption === "express" ? 5000 : deliveryOption === "same-day" ? 10000 : 2000
    const total = subtotal + deliveryFee

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="p-6 max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center gap-4 mb-4">
                        <Link to="/app/shop">
                            <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                                <ArrowLeft className="h-4 w-4" />
                                Continue Shopping
                            </Button>
                        </Link>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Shopping Cart</h1>
                    <p className="text-gray-600">Review your selected parts before checkout</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Cart Items */}
                    <div className="lg:col-span-2 space-y-4">
                        {cartItems.map((item) => (
                            <Card key={item.id}>
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-4">
                                        <img
                                            src={item.image || "/placeholder.svg"}
                                            alt={item.name}
                                            className="w-20 h-20 object-cover rounded-lg"
                                        />
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-lg mb-1">{item.name}</h3>
                                            <div className="flex items-center gap-2 mb-2">
                                                {item.qualityScore && (
                                                    <Badge className="bg-green-100 text-green-800">Quality: {item.qualityScore}%</Badge>
                                                )}
                                                <Badge variant="outline">{item.warranty}</Badge>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                        disabled={item.quantity <= 1}
                                                    >
                                                        <Minus className="h-3 w-3" />
                                                    </Button>
                                                    <Input
                                                        type="number"
                                                        value={item.quantity}
                                                        onChange={(e) => updateQuantity(item.id, Number.parseInt(e.target.value) || 1)}
                                                        className="w-16 text-center"
                                                        min="1"
                                                        max={item.stockQuantity}
                                                    />
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                        disabled={item.quantity >= item.stockQuantity}
                                                    >
                                                        <Plus className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                                <p className="text-sm text-gray-500">{item.stockQuantity} available</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="flex flex-col items-end gap-1">
                                                <p className="text-lg font-bold">{(item.price * item.quantity).toLocaleString()} FCFA</p>
                                                {item.originalPrice && (
                                                    <p className="text-sm text-gray-500 line-through">
                                                        {(item.originalPrice * item.quantity).toLocaleString()} FCFA
                                                    </p>
                                                )}
                                                <p className="text-xs text-gray-500">{item.price.toLocaleString()} FCFA each</p>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removeItem(item.id)}
                                                className="mt-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}

                        {cartItems.length === 0 && (
                            <Card>
                                <CardContent className="p-12 text-center">
                                    <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">Your cart is empty</h3>
                                    <p className="text-gray-600 mb-4">Add some quality parts to get started</p>
                                    <Link to="/app/shop">
                                        <Button style={{ backgroundColor: "var(--tsa-blue)" }}>Browse Products</Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Order Summary */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Order Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between">
                                    <span>Subtotal ({cartItems.length} items)</span>
                                    <span>{subtotal.toLocaleString()} FCFA</span>
                                </div>

                                <div>
                                    <label className="text-sm font-medium mb-2 block">Delivery Option</label>
                                    <Select value={deliveryOption} onValueChange={setDeliveryOption}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="standard">Standard (3-5 days) - 2,000 FCFA</SelectItem>
                                            <SelectItem value="express">Express (1-2 days) - 5,000 FCFA</SelectItem>
                                            <SelectItem value="same-day">Same Day - 10,000 FCFA</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex justify-between">
                                    <span>Delivery</span>
                                    <span>{deliveryFee.toLocaleString()} FCFA</span>
                                </div>

                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>Total Weight</span>
                                    <span>{totalWeight.toFixed(1)} kg</span>
                                </div>

                                <Separator />

                                <div className="flex justify-between text-lg font-bold">
                                    <span>Total</span>
                                    <span>{total.toLocaleString()} FCFA</span>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex gap-2">
                                        <Input placeholder="Promo code" value={promoCode} onChange={(e) => setPromoCode(e.target.value)} />
                                        <Button variant="outline">Apply</Button>
                                    </div>

                                    <Button
                                        className="w-full gap-2"
                                        style={{ backgroundColor: "var(--tsa-blue)" }}
                                        disabled={cartItems.length === 0}
                                    >
                                        <CreditCard className="h-4 w-4" />
                                        Proceed to Checkout
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Delivery Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Truck className="h-5 w-5" />
                                    Delivery Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center gap-2 text-sm">
                                    <Shield className="h-4 w-4 text-green-600" />
                                    <span>All parts quality-tested and guaranteed</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <Truck className="h-4 w-4 text-blue-600" />
                                    <span>Free returns within 30 days</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <CreditCard className="h-4 w-4 text-purple-600" />
                                    <span>Secure payment processing</span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Recommended Parts */}
                        <Card>
                            <CardHeader>
                                <CardTitle>You might also need</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 p-2 border rounded-lg">
                                        <img src="/air-filter.png" alt="Air Filter" className="w-10 h-10 object-cover rounded" />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium">Air Filter</p>
                                            <p className="text-xs text-gray-500">8,500 FCFA</p>
                                        </div>
                                        <Button size="sm" variant="outline">
                                            Add
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}
