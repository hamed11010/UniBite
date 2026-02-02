'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Order } from '@/lib/mockData'
import styles from './dashboard.module.css'

interface Sauce {
  id: string
  name: string
  price: number
}

interface AddOn {
  id: string
  name: string
  price: number
}

interface Product {
  id: string
  name: string
  price: number
  description: string
  hasSauces: boolean
  sauces?: Sauce[]
  addOns?: AddOn[]
  trackStock?: boolean
  stockQuantity?: number
  isOutOfStock?: boolean
}

interface Category {
  id: string
  name: string
  products: Product[]
}

export default function RestaurantDashboard() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'orders' | 'menu' | 'reports' | 'settings'>('orders')
  const [orders, setOrders] = useState<Order[]>([])
  const [reports, setReports] = useState<any[]>([])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isAuthenticated = sessionStorage.getItem('isAuthenticated')
      const user = JSON.parse(sessionStorage.getItem('user') || '{}')
      
      if (!isAuthenticated || user.role !== 'restaurant_admin') {
        router.push('/auth/login')
        return
      }

      // Load orders
      let allOrders = JSON.parse(sessionStorage.getItem('orders') || '[]')
      
      // If no orders exist, add mock orders for demo
      if (allOrders.length === 0) {
        const mockOrders: Order[] = [
          {
            id: 'order-001',
            restaurantId: 'rest1',
            restaurantName: 'Campus Cafe',
            items: [
              {
                productId: 'prod1',
                productName: 'Classic Burger',
                price: 45,
                quantity: 2,
                comment: 'No onions please',
                sauces: ['Ketchup', 'Mayo'],
              },
              {
                productId: 'prod4',
                productName: 'Coca Cola',
                price: 15,
                quantity: 2,
              },
            ],
            total: 120,
            status: 'received',
            estimatedTime: 10,
            createdAt: new Date().toISOString(),
          },
          {
            id: 'order-002',
            restaurantId: 'rest1',
            restaurantName: 'Campus Cafe',
            items: [
              {
                productId: 'prod2',
                productName: 'Chicken Wrap',
                price: 40,
                quantity: 1,
                sauces: ['Mayo'],
              },
            ],
            total: 40,
            status: 'preparing',
            estimatedTime: 8,
            createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
          },
        ]
        allOrders = mockOrders
        sessionStorage.setItem('orders', JSON.stringify(mockOrders))
      }
      
      // Filter orders for this restaurant
      const restaurantOrders = allOrders.filter(
        (o: Order) => o.restaurantId === user.restaurantId || o.restaurantId === 'rest1'
      )
      setOrders(restaurantOrders)

      // Load reports for this restaurant (demo mode)
      const allReports = JSON.parse(sessionStorage.getItem('reports') || '[]')
      const restaurantReports = allReports.filter(
        (r: any) => r.restaurantId === user.restaurantId || r.restaurantId === 'rest1'
      )
      setReports(restaurantReports)
    }
  }, [router])

  const updateOrderStatus = (orderId: string, newStatus: any) => {
    const updatedOrders = orders.map((order) =>
      order.id === orderId ? { ...order, status: newStatus } : order
    )
    setOrders(updatedOrders)

    // Update in sessionStorage
    if (typeof window !== 'undefined') {
      const allOrders = JSON.parse(sessionStorage.getItem('orders') || '[]')
      const updatedAllOrders = allOrders.map((o: Order) =>
        o.id === orderId ? { ...o, status: newStatus } : o
      )
      sessionStorage.setItem('orders', JSON.stringify(updatedAllOrders))
    }
  }

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.clear()
      router.push('/')
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Restaurant Dashboard</h1>
        <button onClick={handleLogout} className={styles.logoutButton}>
          Logout
        </button>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'orders' ? styles.active : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          Orders
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'menu' ? styles.active : ''}`}
          onClick={() => setActiveTab('menu')}
        >
          Menu Management
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'reports' ? styles.active : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          Reports
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'settings' ? styles.active : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          Settings
        </button>
      </div>

      <div className={styles.content}>
        {activeTab === 'orders' && (
          <OrdersTab orders={orders} onUpdateStatus={updateOrderStatus} />
        )}
        {activeTab === 'menu' && <MenuTab />}
        {activeTab === 'reports' && <ReportsTab reports={reports} />}
        {activeTab === 'settings' && <SettingsTab />}
      </div>
    </div>
  )
}

function ReportsTab({ reports }: { reports: any[] }) {
  return (
    <div className={styles.ordersTab}>
      <h2 className={styles.sectionTitle}>Reports for this restaurant</h2>
      <p className={styles.infoText}>
        Trust & safety is handled automatically at scale in production. This is a demo-only view of reports.
      </p>
      {reports.length === 0 ? (
        <p className={styles.emptyMessage}>No reports submitted yet.</p>
      ) : (
        <div className={styles.ordersList}>
          {reports.map((report) => (
            <div key={report.id} className={styles.orderCard}>
              <div className={styles.orderHeader}>
                <div>
                  <p className={styles.orderId}>{report.reason}</p>
                  <p className={styles.orderTime}>
                    {new Date(report.createdAt).toLocaleString()}
                  </p>
                </div>
                <span className={`${styles.statusBadge} ${styles.received}`}>
                  New
                </span>
              </div>
              {report.comment && (
                <p className={styles.itemComment}>{report.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function OrdersTab({
  orders,
  onUpdateStatus,
}: {
  orders: Order[]
  onUpdateStatus: (orderId: string, status: any) => void
}) {
  const pendingOrders = orders.filter(
    (o) => o.status === 'received' || o.status === 'preparing' || o.status === 'ready'
  )

  const today = new Date().toDateString()
  const todayOrders = orders.filter(
    (o) => new Date(o.createdAt).toDateString() === today
  )
  const historyOrders = orders.filter(
    (o) => new Date(o.createdAt).toDateString() !== today
  )

  return (
    <div className={styles.ordersTab}>
      <h2 className={styles.sectionTitle}>Incoming Orders</h2>
      {pendingOrders.length === 0 ? (
        <p className={styles.emptyMessage}>No pending orders</p>
      ) : (
        <div className={styles.ordersList}>
          {pendingOrders.map((order) => (
            <div key={order.id} className={styles.orderCard}>
              <div className={styles.orderHeader}>
                <div>
                  <p className={styles.orderId}>Order #{order.id.slice(-6)}</p>
                  <p className={styles.orderTime}>
                    {new Date(order.createdAt).toLocaleString()}
                  </p>
                </div>
                <span
                  className={`${styles.statusBadge} ${
                    styles[order.status]
                  }`}
                >
                  {order.status}
                </span>
              </div>

              <div className={styles.orderItems}>
                {order.items.map((item, index) => (
                  <div key={index} className={styles.orderItem}>
                    <span className={styles.itemName}>
                      {item.productName} × {item.quantity}
                    </span>
                    {item.comment && (
                      <p className={styles.itemComment}>Note: {item.comment}</p>
                    )}
                    {item.sauces && item.sauces.length > 0 && (
                      <p className={styles.itemSauces}>
                        Sauces: {item.sauces.join(', ')}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <div className={styles.orderTotal}>
                Total: {order.total} EGP
              </div>

              <div className={styles.orderActions}>
                {order.status === 'received' && (
                  <>
                    <button
                      onClick={() => onUpdateStatus(order.id, 'preparing')}
                      className={styles.actionButton}
                    >
                      Preparing
                    </button>
                    <button
                      onClick={() => onUpdateStatus(order.id, 'ready')}
                      className={styles.actionButton}
                    >
                      Ready
                    </button>
                    <button
                      onClick={() => onUpdateStatus(order.id, 'cancelled_by_restaurant')}
                      className={`${styles.actionButton} ${styles.cancelButton}`}
                    >
                      Cancel (Out of Stock)
                    </button>
                  </>
                )}
                {order.status === 'preparing' && (
                  <>
                    <button
                      onClick={() => onUpdateStatus(order.id, 'received')}
                      className={styles.actionButton}
                    >
                      Received
                    </button>
                    <button
                      onClick={() => onUpdateStatus(order.id, 'ready')}
                      className={styles.actionButton}
                    >
                      Ready
                    </button>
                  </>
                )}
                {order.status === 'ready' && (
                  <>
                    <button
                      onClick={() => onUpdateStatus(order.id, 'received')}
                      className={styles.actionButton}
                    >
                      Received
                    </button>
                    <button
                      onClick={() => onUpdateStatus(order.id, 'preparing')}
                      className={styles.actionButton}
                    >
                      Preparing
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className={styles.orderHistorySection}>
        <h2 className={styles.sectionTitle}>Today's Orders</h2>
        {todayOrders.length === 0 ? (
          <p className={styles.emptyMessage}>No orders today</p>
        ) : (
          <div className={styles.ordersList}>
            {todayOrders.map((order) => (
              <div key={order.id} className={styles.orderCard}>
                <div className={styles.orderHeader}>
                  <div>
                    <p className={styles.orderId}>Order #{order.id.slice(-6)}</p>
                    <p className={styles.orderTime}>
                      {new Date(order.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span
                    className={`${styles.statusBadge} ${
                      styles[order.status === 'cancelled_by_restaurant' ? 'cancelled' : order.status]
                    }`}
                  >
                    {order.status === 'cancelled_by_restaurant' ? 'Cancelled by Restaurant' : order.status}
                  </span>
                  {order.status === 'cancelled_by_restaurant' && (
                    <p className={styles.cancellationNote}>
                      This order was cancelled by the restaurant. (UI only - no notifications or refunds in demo mode)
                    </p>
                  )}
                </div>

                <div className={styles.orderItems}>
                  {order.items.map((item, index) => (
                    <div key={index} className={styles.orderItem}>
                      <span className={styles.itemName}>
                        {item.productName} × {item.quantity}
                      </span>
                      {item.comment && (
                        <p className={styles.itemComment}>Note: {item.comment}</p>
                      )}
                      {item.sauces && item.sauces.length > 0 && (
                        <p className={styles.itemSauces}>
                          Sauces: {item.sauces.join(', ')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                <div className={styles.orderTotal}>
                  Total: {order.total} EGP
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={styles.orderHistorySection}>
        <h2 className={styles.sectionTitle}>Order History (coming soon)</h2>
        <div className={styles.comingSoonBox}>
          <p className={styles.comingSoonText}>
            Older orders will be auto-archived later (backend feature)
          </p>
        </div>
      </div>
    </div>
  )
}

function MenuTab() {
  // Load categories from sessionStorage or use default
  const loadCategories = (): Category[] => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('restaurantMenu')
      if (saved) {
        return JSON.parse(saved)
      }
    }
    return [
      { 
        id: 'cat1', 
        name: 'Sandwiches', 
        products: [
          { 
            id: 'prod1', 
            name: 'Classic Burger', 
            price: 45, 
            description: 'Juicy beef patty', 
            hasSauces: true,
            sauces: [
              { id: 'sauce1', name: 'Ketchup', price: 0 },
              { id: 'sauce2', name: 'Mayo', price: 0 },
            ],
            addOns: [
              { id: 'addon1', name: 'Extra Cheese', price: 5 },
            ],
          },
          { 
            id: 'prod2', 
            name: 'Chicken Wrap', 
            price: 40, 
            description: 'Grilled chicken', 
            hasSauces: true,
            sauces: [
              { id: 'sauce3', name: 'Ketchup', price: 0 },
            ],
            addOns: [],
          },
        ]
      },
      { 
        id: 'cat2', 
        name: 'Crepes', 
        products: [
          { 
            id: 'prod3', 
            name: 'Chocolate Crepe', 
            price: 30, 
            description: 'Sweet crepe', 
            hasSauces: false,
            sauces: [],
            addOns: [],
          },
        ]
      },
      { 
        id: 'cat3', 
        name: 'Drinks', 
        products: [
          { 
            id: 'prod4', 
            name: 'Coca Cola', 
            price: 15, 
            description: '', 
            hasSauces: false,
            sauces: [],
            addOns: [],
          },
        ]
      },
    ]
  }

  const [categories, setCategories] = useState<Category[]>(loadCategories)
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [showAddProduct, setShowAddProduct] = useState<string | null>(null)
  const [editingProduct, setEditingProduct] = useState<{ categoryId: string; product: Product } | null>(null)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    description: '',
    hasSauces: false,
    sauces: [] as Sauce[],
    addOns: [] as AddOn[],
    trackStock: false,
    stockQuantity: 0,
    isOutOfStock: false,
  })

  // Save categories to sessionStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('restaurantMenu', JSON.stringify(categories))
    }
  }, [categories])

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return
    const newCategory = {
      id: `cat${Date.now()}`,
      name: newCategoryName,
      products: [],
    }
    setCategories([...categories, newCategory])
    setNewCategoryName('')
    setShowAddCategory(false)
  }

  const handleAddProduct = (categoryId: string) => {
    if (!newProduct.name.trim() || !newProduct.price) return
    const updatedCategories = categories.map(cat =>
      cat.id === categoryId
        ? {
            ...cat,
            products: [
              ...cat.products,
              {
                id: `prod${Date.now()}`,
                name: newProduct.name,
                price: parseFloat(newProduct.price),
                description: newProduct.description,
                hasSauces: newProduct.hasSauces,
                sauces: newProduct.sauces || [],
                addOns: newProduct.addOns || [],
                trackStock: newProduct.trackStock,
                stockQuantity: newProduct.trackStock ? newProduct.stockQuantity : undefined,
                isOutOfStock: newProduct.isOutOfStock,
              },
            ],
          }
        : cat
    )
    setCategories(updatedCategories)
    setNewProduct({ name: '', price: '', description: '', hasSauces: false, sauces: [], addOns: [] })
    setShowAddProduct(null)
  }

  const handleEditProduct = (categoryId: string, product: Product) => {
    setEditingProduct({ categoryId, product })
    setNewProduct({
      name: product.name,
      price: product.price.toString(),
      description: product.description,
      hasSauces: product.hasSauces,
      sauces: product.sauces || [],
      addOns: product.addOns || [],
      trackStock: product.trackStock || false,
      stockQuantity: product.stockQuantity || 0,
      isOutOfStock: product.isOutOfStock || false,
    })
  }

  const handleUpdateProduct = () => {
    if (!editingProduct || !newProduct.name.trim() || !newProduct.price) return
    const updatedCategories = categories.map(cat =>
      cat.id === editingProduct.categoryId
        ? {
            ...cat,
            products: cat.products.map(p =>
              p.id === editingProduct.product.id
                ? {
                    ...p,
                    name: newProduct.name,
                    price: parseFloat(newProduct.price),
                    description: newProduct.description,
                    hasSauces: newProduct.hasSauces,
                    sauces: newProduct.sauces || [],
                    addOns: newProduct.addOns || [],
                    trackStock: newProduct.trackStock,
                    stockQuantity: newProduct.trackStock ? newProduct.stockQuantity : undefined,
                    isOutOfStock: newProduct.isOutOfStock,
                  }
                : p
            ),
          }
        : cat
    )
    setCategories(updatedCategories)
    setEditingProduct(null)
    setNewProduct({ name: '', price: '', description: '', hasSauces: false, sauces: [], addOns: [] })
  }

  const handleDeleteProduct = (categoryId: string, productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return
    const updatedCategories = categories.map(cat =>
      cat.id === categoryId
        ? {
            ...cat,
            products: cat.products.filter(p => p.id !== productId),
          }
        : cat
    )
    setCategories(updatedCategories)
  }

  const addSauce = () => {
    const newSauce: Sauce = {
      id: `sauce${Date.now()}`,
      name: '',
      price: 0,
    }
    setNewProduct({
      ...newProduct,
      sauces: [...(newProduct.sauces || []), newSauce],
    })
  }

  const updateSauce = (sauceId: string, field: 'name' | 'price', value: string | number) => {
    setNewProduct({
      ...newProduct,
      sauces: (newProduct.sauces || []).map(s =>
        s.id === sauceId ? { ...s, [field]: value } : s
      ),
    })
  }

  const removeSauce = (sauceId: string) => {
    setNewProduct({
      ...newProduct,
      sauces: (newProduct.sauces || []).filter(s => s.id !== sauceId),
    })
  }

  const addAddOn = () => {
    const newAddOn: AddOn = {
      id: `addon${Date.now()}`,
      name: '',
      price: 0,
    }
    setNewProduct({
      ...newProduct,
      addOns: [...(newProduct.addOns || []), newAddOn],
    })
  }

  const updateAddOn = (addOnId: string, field: 'name' | 'price', value: string | number) => {
    setNewProduct({
      ...newProduct,
      addOns: (newProduct.addOns || []).map(a =>
        a.id === addOnId ? { ...a, [field]: value } : a
      ),
    })
  }

  const removeAddOn = (addOnId: string) => {
    setNewProduct({
      ...newProduct,
      addOns: (newProduct.addOns || []).filter(a => a.id !== addOnId),
    })
  }

  return (
    <div className={styles.menuTab}>
      <div className={styles.menuHeader}>
        <h2 className={styles.sectionTitle}>Menu Management</h2>
        <button
          onClick={() => setShowAddCategory(true)}
          className={styles.addCategoryButton}
        >
          + Add Category
        </button>
      </div>

      {showAddCategory && (
        <div className={styles.addForm}>
          <input
            type="text"
            placeholder="Category name (e.g., Sandwiches, Drinks)"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            className={styles.input}
          />
          <div className={styles.formActions}>
            <button onClick={handleAddCategory} className={styles.saveButton}>
              Add Category
            </button>
            <button
              onClick={() => {
                setShowAddCategory(false)
                setNewCategoryName('')
              }}
              className={styles.cancelButton}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className={styles.categoriesList}>
        {categories.map((category) => (
          <div key={category.id} className={styles.categoryCard}>
            <div className={styles.categoryHeader}>
              <h3 className={styles.categoryName}>{category.name}</h3>
              <button
                onClick={() => setShowAddProduct(showAddProduct === category.id ? null : category.id)}
                className={styles.addProductButton}
              >
                + Add Product
              </button>
            </div>

            {(showAddProduct === category.id || editingProduct?.categoryId === category.id) && (
              <div className={styles.productForm}>
                <input
                  type="text"
                  placeholder="Product name"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  className={styles.input}
                />
                <input
                  type="number"
                  placeholder="Base price (EGP)"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                  className={styles.input}
                />
                <textarea
                  placeholder="Description (optional)"
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  className={styles.textarea}
                  rows={2}
                />
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={newProduct.hasSauces}
                    onChange={(e) => setNewProduct({ ...newProduct, hasSauces: e.target.checked })}
                  />
                  <span>Allow sauces/extras</span>
                </label>

                {newProduct.hasSauces && (
                  <div className={styles.extrasSection}>
                    <div className={styles.extrasHeader}>
                      <h4>Sauces (Extras)</h4>
                      <button onClick={addSauce} className={styles.addExtraButton}>+ Add Sauce</button>
                    </div>
                    {newProduct.sauces && newProduct.sauces.map((sauce) => (
                      <div key={sauce.id} className={styles.extraItem}>
                        <input
                          type="text"
                          placeholder="Sauce name"
                          value={sauce.name}
                          onChange={(e) => updateSauce(sauce.id, 'name', e.target.value)}
                          className={styles.input}
                        />
                        <input
                          type="number"
                          placeholder="Price (0 = free)"
                          value={sauce.price}
                          onChange={(e) => updateSauce(sauce.id, 'price', parseFloat(e.target.value) || 0)}
                          className={styles.input}
                          min="0"
                          step="0.5"
                        />
                        <button onClick={() => removeSauce(sauce.id)} className={styles.removeExtraButton}>×</button>
                      </div>
                    ))}
                  </div>
                )}

                <div className={styles.extrasSection}>
                  <div className={styles.extrasHeader}>
                    <h4>Ingredients / Add-ons</h4>
                    <button onClick={addAddOn} className={styles.addExtraButton}>+ Add Ingredient</button>
                  </div>
                  {newProduct.addOns && newProduct.addOns.map((addOn) => (
                    <div key={addOn.id} className={styles.extraItem}>
                      <input
                        type="text"
                        placeholder="Ingredient name"
                        value={addOn.name}
                        onChange={(e) => updateAddOn(addOn.id, 'name', e.target.value)}
                        className={styles.input}
                      />
                      <input
                        type="number"
                        placeholder="Price (0 = free)"
                        value={addOn.price}
                        onChange={(e) => updateAddOn(addOn.id, 'price', parseFloat(e.target.value) || 0)}
                        className={styles.input}
                        min="0"
                        step="0.5"
                      />
                      <button onClick={() => removeAddOn(addOn.id)} className={styles.removeExtraButton}>×</button>
                    </div>
                  ))}
                </div>

                <div className={styles.stockSection}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={newProduct.trackStock}
                      onChange={(e) => setNewProduct({ ...newProduct, trackStock: e.target.checked, stockQuantity: e.target.checked ? newProduct.stockQuantity : 0 })}
                    />
                    <span>Track stock for this product</span>
                  </label>
                  {newProduct.trackStock && (
                    <div className={styles.stockInput}>
                      <label className={styles.settingLabel}>Stock Quantity (Internal Only)</label>
                      <input
                        type="number"
                        placeholder="Stock quantity"
                        value={newProduct.stockQuantity}
                        onChange={(e) => setNewProduct({ ...newProduct, stockQuantity: parseInt(e.target.value) || 0 })}
                        className={styles.input}
                        min="0"
                      />
                    </div>
                  )}
                </div>

                <div className={styles.stockSection}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={newProduct.isOutOfStock}
                      onChange={(e) => setNewProduct({ ...newProduct, isOutOfStock: e.target.checked })}
                    />
                    <span>Mark as Out of Stock</span>
                  </label>
                  <p className={styles.overrideNote}>Manual override (demo mode)</p>
                </div>

                <div className={styles.formActions}>
                  <button
                    onClick={() => editingProduct ? handleUpdateProduct() : handleAddProduct(category.id)}
                    className={styles.saveButton}
                  >
                    {editingProduct ? 'Update Product' : 'Add Product'}
                  </button>
                  <button
                    onClick={() => {
                      setShowAddProduct(null)
                      setEditingProduct(null)
                      setNewProduct({ name: '', price: '', description: '', hasSauces: false, sauces: [], addOns: [], trackStock: false, stockQuantity: 0, isOutOfStock: false })
                    }}
                    className={styles.cancelButton}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className={styles.productsList}>
              {category.products.map((product) => {
                const isAvailable = !product.isOutOfStock && (!product.trackStock || (product.stockQuantity && product.stockQuantity > 0))
                return (
                  <div key={product.id} className={`${styles.productCard} ${!isAvailable ? styles.outOfStock : ''}`}>
                    <div className={styles.productImagePlaceholder}>📷</div>
                    <div className={styles.productDetails}>
                      <div className={styles.productHeader}>
                        <h4 className={styles.productName}>{product.name}</h4>
                        <span className={`${styles.availabilityBadge} ${isAvailable ? styles.available : styles.unavailable}`}>
                          {isAvailable ? '✅ Available' : '❌ Out of Stock'}
                        </span>
                      </div>
                      {product.description && (
                        <p className={styles.productDescription}>{product.description}</p>
                      )}
                      <p className={styles.productPrice}>{product.price} EGP</p>
                      {product.hasSauces && (
                        <span className={styles.sauceBadge}>Sauces available</span>
                      )}
                      {product.trackStock && product.stockQuantity !== undefined && (
                        <p className={styles.stockInfo}>Stock: {product.stockQuantity} (Internal)</p>
                      )}
                    </div>
                    <div className={styles.productActions}>
                      <button 
                        onClick={() => handleEditProduct(category.id, product)}
                        className={styles.editButton}
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteProduct(category.id, product.id)}
                        className={styles.deleteButton}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
      <p className={styles.demoNote}>
        Changes are saved locally (demo mode)
      </p>
    </div>
  )
}

function SettingsTab() {
  const [isOpen, setIsOpen] = useState(true)
  const [openTime, setOpenTime] = useState('08:00')
  const [closeTime, setCloseTime] = useState('22:00')
  const [isManualOverride, setIsManualOverride] = useState(false)

  const handleToggleOpen = (checked: boolean) => {
    setIsOpen(checked)
    setIsManualOverride(true)
    // Update restaurant status in sessionStorage for student view
    if (typeof window !== 'undefined') {
      const user = JSON.parse(sessionStorage.getItem('user') || '{}')
      const restaurants = JSON.parse(sessionStorage.getItem('restaurants') || '[]')
      const updatedRestaurants = restaurants.map((r: any) =>
        r.id === user.restaurantId || r.id === 'rest1'
          ? { ...r, isOpen: checked, manualOverride: true }
          : r
      )
      sessionStorage.setItem('restaurants', JSON.stringify(updatedRestaurants))
    }
  }

  return (
    <div className={styles.settingsTab}>
      <h2 className={styles.sectionTitle}>Restaurant Settings</h2>

      <div className={styles.settingGroup}>
        <div className={styles.scheduleInfo}>
          <p className={styles.scheduleText}>
            <strong>Scheduled Hours:</strong> {openTime} - {closeTime}
          </p>
        </div>
      </div>

      <div className={styles.settingGroup}>
        <label className={styles.settingLabel}>
          <input
            type="checkbox"
            checked={isOpen}
            onChange={(e) => handleToggleOpen(e.target.checked)}
          />
          <span>{isOpen ? 'Restaurant is Open' : 'Restaurant is Closed'}</span>
        </label>
        {isManualOverride && (
          <p className={styles.overrideNote}>Manually overridden (demo mode)</p>
        )}
      </div>

      <div className={styles.settingGroup}>
        <label className={styles.settingLabel}>Opening Time</label>
        <input
          type="time"
          value={openTime}
          onChange={(e) => setOpenTime(e.target.value)}
          className={styles.timeInput}
        />
      </div>

      <div className={styles.settingGroup}>
        <label className={styles.settingLabel}>Closing Time</label>
        <input
          type="time"
          value={closeTime}
          onChange={(e) => setCloseTime(e.target.value)}
          className={styles.timeInput}
        />
      </div>

      <div className={styles.settingGroup}>
        <button className={styles.saveButton}>Save Settings</button>
      </div>
    </div>
  )
}
