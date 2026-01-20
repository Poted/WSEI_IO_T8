// API Service with Offline Mode Support
class ApiService {
    constructor(baseUrl = 'http://localhost:5000') {
        this.baseUrl = baseUrl;
        this.isOnline = navigator.onLine;
        this.localStorageService = window.localStorageService;
        
        // Listen for online/offline events
        window.addEventListener('online', () => {
            this.isOnline = true;
            console.log('Connection restored - attempting to sync...');
            this.syncOfflineData();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            console.log('Connection lost - switching to offline mode');
        });
        
        // Check connectivity on init
        this.checkConnectivity();
    }

    // Check if backend is available
    async checkConnectivity() {
        try {
            const response = await fetch(`${this.baseUrl}/products`, {
                method: 'GET',
                signal: AbortSignal.timeout(2000) // 2 second timeout
            });
            this.isOnline = response.ok;
            return response.ok;
        } catch (error) {
            this.isOnline = false;
            return false;
        }
    }

    // Get all products (try API, fallback to local storage)
    async getProducts() {
        try {
            const response = await fetch(`${this.baseUrl}/products`);
            
            if (response.ok) {
                const products = await response.json();
                // Sync with local storage
                this.localStorageService.mergeWithServerData(products);
                this.isOnline = true;
                return products;
            }
        } catch (error) {
            console.log('API unavailable, using local storage:', error);
            this.isOnline = false;
        }
        
        // Fallback to local storage
        return this.localStorageService.getProducts();
    }

    // Create a product (try API, fallback to local storage)
    async createProduct(product) {
        try {
            const response = await fetch(`${this.baseUrl}/products`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(product)
            });
            
            if (response.ok) {
                const created = await response.json();
                // Update local storage
                const localProducts = this.localStorageService.getProducts();
                localProducts.push(created);
                this.localStorageService.saveProducts(localProducts);
                this.isOnline = true;
                return created;
            } else {
                throw new Error(`Server error: ${response.status}`);
            }
        } catch (error) {
            console.log('API unavailable, saving to local storage:', error);
            this.isOnline = false;
            
            // Save to local storage
            const created = this.localStorageService.addProduct(product);
            // Add to sync queue
            this.localStorageService.addToSyncQueue({
                type: 'CREATE',
                product: created
            });
            return created;
        }
    }

    // Update a product (try API, fallback to local storage)
    async updateProduct(id, product) {
        try {
            const response = await fetch(`${this.baseUrl}/products/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(product)
            });
            
            if (response.ok) {
                // Update local storage
                const localProducts = this.localStorageService.getProducts();
                const index = localProducts.findIndex(p => p.id === id);
                if (index !== -1) {
                    localProducts[index] = { ...localProducts[index], ...product, id };
                    this.localStorageService.saveProducts(localProducts);
                }
                this.isOnline = true;
                return product;
            } else {
                throw new Error(`Server error: ${response.status}`);
            }
        } catch (error) {
            console.log('API unavailable, updating in local storage:', error);
            this.isOnline = false;
            
            // Update in local storage
            const updated = this.localStorageService.updateProduct(id, product);
            // Add to sync queue
            this.localStorageService.addToSyncQueue({
                type: 'UPDATE',
                id: id,
                product: updated
            });
            return updated;
        }
    }

    // Delete a product (try API, fallback to local storage)
    async deleteProduct(id) {
        try {
            const response = await fetch(`${this.baseUrl}/products/${id}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                // Remove from local storage
                const localProducts = this.localStorageService.getProducts();
                const filtered = localProducts.filter(p => p.id !== id);
                this.localStorageService.saveProducts(filtered);
                this.isOnline = true;
                return true;
            } else {
                throw new Error(`Server error: ${response.status}`);
            }
        } catch (error) {
            console.log('API unavailable, deleting from local storage:', error);
            this.isOnline = false;
            
            // Delete from local storage
            const deleted = this.localStorageService.deleteProduct(id);
            // Add to sync queue
            this.localStorageService.addToSyncQueue({
                type: 'DELETE',
                id: id
            });
            return deleted;
        }
    }

    // Sync offline data when connection is restored
    async syncOfflineData() {
        const queue = this.localStorageService.getSyncQueue();
        if (queue.length === 0) return;
        
        console.log(`Syncing ${queue.length} offline operations...`);
        
        const successful = [];
        
        for (const operation of queue) {
            try {
                if (operation.type === 'CREATE') {
                    await this.createProduct(operation.product);
                    successful.push(operation);
                } else if (operation.type === 'UPDATE') {
                    await this.updateProduct(operation.id, operation.product);
                    successful.push(operation);
                } else if (operation.type === 'DELETE') {
                    await this.deleteProduct(operation.id);
                    successful.push(operation);
                }
            } catch (error) {
                console.error('Failed to sync operation:', operation, error);
            }
        }
        
        // Remove successful operations from queue
        if (successful.length > 0) {
            const remaining = queue.filter(op => 
                !successful.some(s => s.timestamp === op.timestamp)
            );
            if (remaining.length === 0) {
                this.localStorageService.clearSyncQueue();
            } else {
                localStorage.setItem('sync_queue', JSON.stringify(remaining));
            }
        }
        
        console.log(`Sync complete. ${successful.length} operations synced.`);
    }
}

// Export singleton instance
window.apiService = new ApiService();
