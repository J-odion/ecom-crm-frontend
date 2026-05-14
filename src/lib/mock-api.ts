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
            { id: "L1", customerName: "John Doe", product: "Wireless Earbuds", phone: "08012345678", status: "new", source: "Facebook Ads" },
            { id: "L2", customerName: "Jane Smith", product: "Smart Watch", phone: "08087654321", status: "contacted", source: "Google Search" },
            { id: "L3", customerName: "Michael Obi", product: "Wireless Earbuds", phone: "07011223344", status: "new", source: "Instagram" },
            { id: "L4", customerName: "Sarah Ahmed", product: "Power Bank", phone: "09055667788", status: "failed", source: "Facebook Ads" },
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
          data: { id: "L1", customerName: "John Doe", product: "Wireless Earbuds", phone: "08012345678", status: "new", source: "Facebook Ads", email: "john@example.com" },
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
            { id: "ORD101", customerName: "John Doe", product: "Wireless Earbuds", amount: 25000, status: "scheduled", delivery_type: "in_house", phone: "08012345678" },
            { id: "ORD102", customerName: "Alice Wong", product: "Smart Watch", amount: 45000, status: "delivered", delivery_type: "third_party", phone: "08122334455", delivery_fee: 2500 },
            { id: "ORD103", customerName: "Buba Gana", product: "Power Bank", amount: 15000, status: "cash_remitted", delivery_type: "in_house", phone: "09033445566", delivery_fee: 1500 },
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
            phone: "08012345678",
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

    // Default to success for patches/posts if not caught above
    if (method === "post" || method === "patch" || method === "put") {
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
