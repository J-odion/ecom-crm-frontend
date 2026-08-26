import type { AxiosInstance } from "axios";

/**
 * Injects mock data interceptors into the axios instance.
 * This allows testing the UI without a functioning backend.
 */
export function setupMockInterceptors(api: AxiosInstance) {
  api.interceptors.request.use(async (config) => {
    const { url, method } = config;
    
    // Simulate network delay
    await new Promise(r => setTimeout(r, 400));

    // --- Media Buyer ---
    if (url?.includes("/media-buyers/performance")) {
      return {
        ...config,
        adapter: async () => ({
          data: {
            leads: 124,
            ordersScheduled: 86,
            ordersDelivered: 52,
            adSpend: 450000,
            deliveryRate: 60.4,
            CPA: 8653,
            series: [
              { date: "2024-05-01", delivered: 5, spend: 40000 },
              { date: "2024-05-02", delivered: 8, spend: 45000 },
              { date: "2024-05-03", delivered: 4, spend: 38000 },
              { date: "2024-05-04", delivered: 12, spend: 55000 },
              { date: "2024-05-05", delivered: 7, spend: 42000 },
              { date: "2024-05-06", delivered: 9, spend: 48000 },
              { date: "2024-05-07", delivered: 7, spend: 45000 },
            ]
          },
          status: 200,
          statusText: "OK",
          headers: {},
          config,
        }),
      };
    }

    if (url?.includes("/media-buyers/spend-log") && method === "post") {
      return { ...config, adapter: async () => ({ data: { success: true }, status: 201, statusText: "Created", headers: {}, config }) };
    }

    // --- Leads ---
    if (url === "/leads" && method === "get") {
      return {
        ...config,
        adapter: async () => ({
          data: [
            { id: "L1", customerName: "John Doe", product: "Wireless Earbuds", callNumber: "08012345678", whatsappNumber: "08012345678", status: "new", source: "Facebook Ads" },
            { id: "L2", customerName: "Jane Smith", product: "Smart Watch", callNumber: "08087654321", whatsappNumber: "08087654321", status: "contacted", source: "Google Search" },
            { id: "L3", customerName: "Michael Obi", product: "Wireless Earbuds", callNumber: "07011223344", whatsappNumber: "07011223344", status: "new", source: "Instagram" },
            { id: "L4", customerName: "Sarah Ahmed", product: "Power Bank", callNumber: "09055667788", whatsappNumber: "09055667788", status: "failed", source: "Facebook Ads" },
          ],
          status: 200,
          statusText: "OK",
          headers: {},
          config,
        }),
      };
    }

    if (url?.match(/\/leads\/[A-Z0-9]+/i) && method === "get") {
      return {
        ...config,
        adapter: async () => ({
          data: { id: "L1", customerName: "John Doe", product: "Wireless Earbuds", callNumber: "08012345678", whatsappNumber: "08012345678", status: "new", source: "Facebook Ads", email: "john@example.com" },
          status: 200,
          statusText: "OK",
          headers: {},
          config,
        }),
      };
    }

    // --- Orders ---
    if (url === "/orders" && method === "get") {
      return {
        ...config,
        adapter: async () => ({
          data: [
            { id: "ORD101", customerName: "John Doe", product: "Wireless Earbuds", amount: 25000, status: "scheduled", delivery_type: "in_house", callNumber: "08012345678", whatsappNumber: "08012345678", scheduleDate: new Date().toISOString() },
            { id: "ORD102", customerName: "Alice Wong", product: "Smart Watch", amount: 45000, status: "delivered", delivery_type: "third_party", callNumber: "08122334455", whatsappNumber: "08122334455", delivery_fee: 2500, scheduleDate: new Date(Date.now() - 86400000).toISOString() },
            { id: "ORD103", customerName: "Buba Gana", product: "Power Bank", amount: 15000, status: "cash_remitted", delivery_type: "in_house", callNumber: "09033445566", whatsappNumber: "09033445566", delivery_fee: 1500, scheduleDate: new Date(Date.now() - 172800000).toISOString() },
            { id: "ORD104", customerName: "Future Guy", product: "Smart Watch", amount: 45000, status: "scheduled", delivery_type: "in_house", callNumber: "09099999999", whatsappNumber: "09099999999", scheduleDate: new Date(Date.now() + 86400000).toISOString() },
          ],
          status: 200,
          statusText: "OK",
          headers: {},
          config,
        }),
      };
    }

    if (url?.match(/\/orders\/[A-Z0-9]+/i) && method === "get") {
       const id = url.split("/").pop();
       return {
        ...config,
        adapter: async () => ({
          data: { 
            id, 
            customerName: "John Doe", 
            product: "Wireless Earbuds", 
            amount: 25000, 
            status: "scheduled", 
            delivery_type: "in_house", 
            callNumber: "08012345678",
            whatsappNumber: "08012345678",
            address: "123 Ecom Street, Lagos",
            quantity: 1,
            notes: "Please call before delivery"
          },
          status: 200,
          statusText: "OK",
          headers: {},
          config,
        }),
      };
    }

    if (url === "/orders" && method === "post") {
      return { ...config, adapter: async () => ({ data: { id: "NEW-ORD" }, status: 201, statusText: "Created", headers: {}, config }) };
    }

    // --- Logistics ---
    if (url === "/logistics/deliveries" && method === "get") {
      return {
        ...config,
        adapter: async () => ({
          data: [
            { id: "DEL-1", orderId: "ORD101", status: "PENDING", deliveryAgentEmail: "agent@ecom.test" },
            { id: "DEL-2", orderId: "ORD102", status: "COMPLETED", deliveryAgentEmail: "agent@ecom.test" },
          ],
          status: 200,
          statusText: "OK",
          headers: {},
          config,
        }),
      };
    }

    // --- Inventory ---
    if (url === "/inventory/products" && method === "get") {
      return {
        ...config,
        adapter: async () => ({
          data: [
            { id: "P1", name: "Wireless Earbuds", sku: "EB-001", stock: 45, cost: 12000, price: 25000 },
            { id: "P2", name: "Smart Watch", sku: "SW-002", stock: 12, cost: 28000, price: 45000 },
            { id: "P3", name: "Power Bank", sku: "PB-003", stock: 89, cost: 7000, price: 15000 },
          ],
          status: 200,
          statusText: "OK",
          headers: {},
          config,
        }),
      };
    }

    // --- Finance ---
    if (url === "/finance/profit" && method === "get") {
      return {
        ...config,
        adapter: async () => ({
          data: { revenue: 1250000, profit: 450000 },
          status: 200,
          statusText: "OK",
          headers: {},
          config,
        }),
      };
    }

    // --- Commission Rules ---
    if (url === "/commission-rules" && method === "get") {
      return {
        ...config,
        adapter: async () => ({
          data: [
            { id: "CR1", name: "Standard CS", role: "customer_service", rate: 5, type: "percentage" },
            { id: "CR2", name: "Media Buyer Performance", role: "sales_agent", rate: 2, type: "percentage" },
          ],
          status: 200,
          statusText: "OK",
          headers: {},
          config,
        }),
      };
    }
    // --- Users ---
    if (url === "/users" && method === "get") {
      return {
        ...config,
        adapter: async () => ({
          data: [
            { _id: "U1", fullName: "Jane Doe", email: "jane@example.com", role: "customer_service", team: "Team Alpha", isActive: true, isOnline: true, commissionRate: 5, salary: 150000, currentCommission: 12500, allTimeCommission: 85000, totalSalaryEarned: 450000 },
            { _id: "U2", fullName: "Mike Smith", email: "mike@example.com", role: "media_buyer", team: "Team Alpha", isActive: true, isOnline: false, commissionRate: 10, salary: 200000, currentCommission: 45000, allTimeCommission: 320000, totalSalaryEarned: 980000 },
            { _id: "U3", fullName: "Alice Accountant", email: "alice@example.com", role: "accountant", team: "Team Beta", isActive: true, isOnline: true, commissionRate: 0, salary: 250000, currentCommission: 0, allTimeCommission: 0, totalSalaryEarned: 600000 },
            { _id: "U4", fullName: "Logistics Specialist", email: "logistics@example.com", role: "logistics", team: "Team Gamma", isActive: false, isOnline: false, commissionRate: 2, salary: 120000, currentCommission: 3000, allTimeCommission: 12000, totalSalaryEarned: 180000 },
          ],
          status: 200,
          statusText: "OK",
          headers: {},
          config,
        }),
      };
    }

    if (url === "/users" && method === "post") {
      return {
        ...config,
        adapter: async () => ({
          data: { _id: "U" + Math.random().toString(36).substr(2, 4), isActive: true, isOnline: false },
          status: 201,
          statusText: "Created",
          headers: {},
          config,
        }),
      };
    }

    if (url?.match(/\/users\/[A-Z0-9]+\/toggle-status/i) && method === "patch") {
      return {
        ...config,
        adapter: async () => ({
          data: { _id: url.split("/")[2], isActive: false, isOnline: false },
          status: 200,
          statusText: "OK",
          headers: {},
          config,
        }),
      };
    }

    // --- Products ---
    if (url === "/products" && method === "get") {
      return {
        ...config,
        adapter: async () => ({
          data: [
            { _id: "P1", name: "Luxury Smart Watch", sku: "LUX-WATCH-001", baseCost: 3500, sellingPrice: 7500, stock: 150 },
            { _id: "P2", name: "Wireless Bluetooth Earbuds", sku: "EAR-BUD-002", baseCost: 1200, sellingPrice: 3500, stock: 420 },
          ],
          status: 200,
          statusText: "OK",
          headers: {},
          config,
        }),
      };
    }

    if (url === "/products" && method === "post") {
      return {
        ...config,
        adapter: async () => ({
          data: { _id: "P" + Math.random().toString(36).substr(2, 4), success: true },
          status: 201,
          statusText: "Created",
          headers: {},
          config,
        }),
      };
    }

    // --- Lead Forms ---
    if (url === "/lead-forms" && method === "get") {
      return {
        ...config,
        adapter: async () => ({
          data: [
            {
              _id: "F1",
              title: "Luxury Watch Promo",
              description: "Get 10% off today",
              productId: { _id: "P1", name: "Luxury Smart Watch" },
              productName: "Luxury Smart Watch",
              sourceMediaBuyerId: { _id: "U2", fullName: "Mike Smith", email: "mike@example.com" },
              mediaBuyerName: "Mike Smith",
              defaultSource: "FACEBOOK",
              primaryColor: "#4F46E5",
              submitButtonText: "Order Now",
              successMessage: "Order received!",
              earnings: 35000,
            },
            {
              _id: "F2",
              title: "Earbuds Special Offer",
              description: "Free shipping nationwide",
              productId: { _id: "P2", name: "Wireless Bluetooth Earbuds" },
              productName: "Wireless Bluetooth Earbuds",
              sourceMediaBuyerId: { _id: "U2", fullName: "Mike Smith", email: "mike@example.com" },
              mediaBuyerName: "Mike Smith",
              defaultSource: "TIKTOK",
              primaryColor: "#10B981",
              submitButtonText: "Buy Now",
              successMessage: "Thank you!",
              earnings: 70000,
            }
          ],
          status: 200,
          statusText: "OK",
          headers: {},
          config,
        }),
      };
    }

    // --- Finance Wallet & Profit ---
    if (url?.includes("/finance/wallet/") && method === "get") {
      return {
        ...config,
        adapter: async () => ({
          data: 15750,
          status: 200,
          statusText: "OK",
          headers: {},
          config,
        }),
      };
    }

    // --- Lead Forms Iframe Code ---
    if (url?.includes("/iframe-code") && method === "get") {
      const id = url.split("/")[2];
      return {
        ...config,
        adapter: async () => ({
          data: {
            iframeCode: `<iframe src="http://localhost:3000/lead-forms/${id}/embed" width="100%" height="600" style="border:none;"></iframe>`
          },
          status: 200,
          statusText: "OK",
          headers: {},
          config,
        }),
      };
    }

    // --- Analytics Dashboards ---
    if (url === "/analytics/cs-dashboard" && method === "get") {
      return {
        ...config,
        adapter: async () => ({
          data: {
            todayDeliveries: 4,
            todayFollowUpOrders: 2,
            earnings: 450,
            rating: 80.00,
            metrics: {
              weeklyDelivery: 8,
              weeklyProcessed: 10
            }
          },
          status: 200,
          statusText: "OK",
          headers: {},
          config,
        }),
      };
    }

    if (url === "/analytics/me" && method === "get") {
      return {
        ...config,
        adapter: async () => ({
          data: {
            role: "admin",
            revenue: 150000,
            adSpend: 32000,
            deliveryCost: 12000,
            commission: 15000,
            productCost: 40000,
            profit: 51000,
            metrics: {
              deliveryRate: 82.35,
              cpa: 45.5,
              totalOrders: 120,
              deliveredOrders: 90
            },
            performance: {
              todayDeliveries: 4,
              todayFollowUpOrders: 2,
              earnings: 450,
              rating: 80.00,
              metrics: {
                weeklyDelivery: 8,
                weeklyProcessed: 10
              },
              totalSpent: 1200,
              totalReceived: 1500,
              balance: 300,
              leadsGenerated: 85,
              scheduledOrders: 60,
              deliveredOrders: 45,
              deliveryRate: 75.00,
              cpa: 26.67,
              todayAssigned: 5,
              todayCompleted: 3,
              weeklyCompleted: 18,
              weeklyFailed: 2
            },
            onlineUsers: [
              {
                userId: "60c72b2f9b1d8a2c2c8b4567",
                fullName: "Jane Doe",
                email: "jane@example.com",
                role: "customer_service",
                locationName: "Lagos Distribution Hub",
                team: "Team Alpha"
              },
              {
                userId: "U4",
                fullName: "Logistics Specialist",
                email: "logistics@example.com",
                role: "logistics",
                locationName: "Abuja Dispatch Station",
                team: "Team Logistics-A"
              }
            ],
            team: [
              {
                userId: "U1",
                fullName: "Jane Doe",
                email: "jane@example.com",
                role: "customer_service",
                team: "Team Alpha",
                isOnline: true,
                isActive: true,
                orderCount: 42,
                deliveryRate: 85.5
              },
              {
                userId: "U2",
                fullName: "Mike Smith",
                email: "mike@example.com",
                role: "media_buyer",
                team: "Team Alpha",
                isOnline: false,
                isActive: true,
                orderCount: 86,
                deliveryRate: 60.4
              },
              {
                userId: "U4",
                fullName: "Logistics Specialist",
                email: "logistics@example.com",
                role: "logistics",
                team: "Team Alpha",
                isOnline: true,
                isActive: true,
                orderCount: 18,
                deliveryRate: 90.0
              }
            ]
          },
          status: 200,
          statusText: "OK",
          headers: {},
          config,
        }),
      };
    }

    if (url === "/media-buyers/dashboard" && method === "get") {
      return {
        ...config,
        adapter: async () => ({
          data: [
            {
              team: "Team Alpha",
              spent: 1250,
              orderCounts: 45,
              deliveryRate: 82.50,
              earnings: 4500,
              commissions: 450
            }
          ],
          status: 200,
          statusText: "OK",
          headers: {},
          config,
        }),
      };
    }

    if (url?.match(/\/analytics\/users\/[A-Za-z0-9]+/i) && method === "get") {
      const id = url.split("/").pop();
      return {
        ...config,
        adapter: async () => ({
          data: {
            userId: id,
            rating: 88,
            metrics: {
              leadsGenerated: 145,
              ordersScheduled: 95,
              deliveredOrders: 70,
              conversionRate: 73.6,
              adSpend: 54000,
              cpa: 771,
            },
            financials: {
              salary: 150000,
              commission: 35000,
            }
          },
          status: 200,
          statusText: "OK",
          headers: {},
          config,
        }),
      };
    }

    // --- Audit Trail ---
    if (url === "/audit-trail" && method === "get") {
      return {
        ...config,
        adapter: async () => ({
          data: [
            {
              _id: "A1",
              userId: {
                _id: "U1",
                fullName: "Jane Doe",
                email: "jane@example.com",
                role: "customer_service"
              },
              userEmail: "jane@example.com",
              action: "PATCH /orders/60d2c.../follow-up",
              details: {
                body: {
                  followUpDate: "2026-07-31T09:00:00.000Z",
                  notes: "Callback requested to discuss delivery timing."
                },
                status: "SUCCESS"
              },
              ip: "::1",
              createdAt: "2026-07-30T21:15:00.000Z"
            },
            {
              _id: "A2",
              userId: {
                _id: "U2",
                fullName: "Mike Smith",
                email: "mike@example.com",
                role: "media_buyer"
              },
              userEmail: "mike@example.com",
              action: "POST /media-buyers/spend-log",
              details: {
                body: {
                  amountSpent: 500,
                  amountReceived: 1200,
                  productName: "Luxury Watch"
                },
                status: "SUCCESS"
              },
              ip: "127.0.0.1",
              createdAt: "2026-07-31T10:30:00.000Z"
            }
          ],
          status: 200,
          statusText: "OK",
          headers: {},
          config,
        }),
      };
    }

    // --- Access Control ---
    if (url === "/departments" && method === "get") {
      return {
        ...config,
        adapter: async () => ({
          data: [
            { _id: "D1", name: "Finance", defaultPermissions: ["accounting:read"] },
            { _id: "D2", name: "Customer Success", defaultPermissions: ["leads:read", "orders:read"] }
          ],
          status: 200, statusText: "OK", headers: {}, config
        })
      };
    }
    if (url === "/roles" && method === "get") {
      return {
        ...config,
        adapter: async () => ({
          data: [
            { _id: "R1", name: "Senior Accountant", department: "D1", permissions: ["accounting:journal:post", "accounting:period:close"] },
            { _id: "R2", name: "CS Agent", department: "D2", permissions: ["leads:update", "orders:follow-up"] }
          ],
          status: 200, statusText: "OK", headers: {}, config
        })
      };
    }
    if (url?.match(/\/users\/[A-Za-z0-9]+\/access$/i) && method === "get") {
      return {
        ...config,
        adapter: async () => ({
          data: {
            department: { _id: "D2", name: "Customer Success", defaultPermissions: ["leads:read", "orders:read"] },
            role: { _id: "R2", name: "CS Agent", permissions: ["leads:update", "orders:follow-up"] },
            overrides: [
              { permissionKey: "accounting:chart:manage", granted: false, reason: "Probationary period restriction" },
              { permissionKey: "leads:delete", granted: true, reason: "Special admin request" }
            ],
            resolvedPermissions: ["leads:read", "orders:read", "leads:update", "orders:follow-up", "leads:delete"]
          },
          status: 200, statusText: "OK", headers: {}, config
        })
      };
    }

    // Default to success for patches/posts/deletes if not caught above
    if (method === "post" || method === "patch" || method === "put" || method === "delete") {
      return {
        ...config,
        adapter: async () => ({
          data: { success: true },
          status: 200,
          statusText: "OK",
          headers: {},
          config,
        }),
      };
    }

    return config;
  });
}
