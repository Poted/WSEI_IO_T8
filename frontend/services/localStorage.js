// Local Storage Service for Offline Mode
class LocalStorageService {
    constructor() {
        this.STORAGE_KEY = 'products_offline';
        this.SYNC_QUEUE_KEY = 'sync_queue';
    }

    // Get all products from local storage
    getProducts() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return [];
        }
    }

    // Save products to local storage
    saveProducts(products) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(products));
            return true;
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            return false;
        }
    }

    // Add a product to local storage
    addProduct(product) {
        const products = this.getProducts();
        
        // Generate a temporary ID if not provided (negative for offline items)
        if (!product.id) {
            const maxId = products.length > 0 
                ? Math.max(...products.map(p => Math.abs(p.id) || 0))
                : 0;
            product.id = -(maxId + 1); // Negative ID indicates offline item
        }
        
        // Add timestamp for sync tracking
        product._offline = true;
        product._createdAt = new Date().toISOString();
        
        products.push(product);
        this.saveProducts(products);
        return product;
    }

    // Update a product in local storage
    updateProduct(id, updatedProduct) {
        const products = this.getProducts();
        const index = products.findIndex(p => p.id === id);
        
        if (index === -1) {
            return null;
        }
        
        // Preserve original properties
        updatedProduct.id = id;
        updatedProduct._offline = true;
        updatedProduct._updatedAt = new Date().toISOString();
        
        products[index] = { ...products[index], ...updatedProduct };
        this.saveProducts(products);
        return products[index];
    }

    // Delete a product from local storage
    deleteProduct(id) {
        const products = this.getProducts();
        const filtered = products.filter(p => p.id !== id);
        
        if (filtered.length === products.length) {
            return false; // Product not found
        }
        
        this.saveProducts(filtered);
        return true;
    }

    // Get sync queue (operations to sync when online)
    getSyncQueue() {
        try {
            const data = localStorage.getItem(this.SYNC_QUEUE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error reading sync queue:', error);
            return [];
        }
    }

    // Add operation to sync queue
    addToSyncQueue(operation) {
        const queue = this.getSyncQueue();
        queue.push({
            ...operation,
            timestamp: new Date().toISOString()
        });
        try {
            localStorage.setItem(this.SYNC_QUEUE_KEY, JSON.stringify(queue));
            return true;
        } catch (error) {
            console.error('Error adding to sync queue:', error);
            return false;
        }
    }

    // Clear sync queue
    clearSyncQueue() {
        try {
            localStorage.removeItem(this.SYNC_QUEUE_KEY);
            return true;
        } catch (error) {
            console.error('Error clearing sync queue:', error);
            return false;
        }
    }

    // Merge server data with local data (for sync)
    mergeWithServerData(serverProducts) {
        const localProducts = this.getProducts();
        const localOfflineProducts = localProducts.filter(p => p._offline && p.id < 0);
        
        // Update local products with server data (matching by name/quantity/unit)
        const merged = serverProducts.map(serverProduct => {
            const localMatch = localProducts.find(local => 
                !local._offline && local.id === serverProduct.id
            );
            return localMatch || serverProduct;
        });
        
        // Add offline-only products that haven't been synced
        merged.push(...localOfflineProducts);
        
        this.saveProducts(merged);
        return merged;
    }

    // Clear all local storage data
    clearAll() {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
            localStorage.removeItem(this.SYNC_QUEUE_KEY);
            return true;
        } catch (error) {
            console.error('Error clearing localStorage:', error);
            return false;
        }
    }
}

// Export singleton instance
window.localStorageService = new LocalStorageService();
