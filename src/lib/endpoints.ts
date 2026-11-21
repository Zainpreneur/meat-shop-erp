import { api } from "./api-client";
import type {
  Category,
  Customer,
  DashboardSummary,
  Expense,
  Product,
  Purchase,
  Sale,
  Supplier,
  User,
} from "./types";

export const authApi = {
  login: async (email: string, password: string) =>
    (await api.post<{ token: string; user: User }>("/auth/login", { email, password })).data,
  me: async () => (await api.get<User>("/auth/me")).data,
  logout: async () => {
    await api.post("/auth/logout");
  },
};

export const usersApi = {
  list: async () => (await api.get<User[]>("/users")).data,
  create: async (data: { name: string; email: string; password: string; role: string }) =>
    (await api.post<User>("/users", data)).data,
  update: async (id: string, data: Partial<{ name: string; role: string; active: boolean; password: string }>) =>
    (await api.put<User>(`/users/${id}`, data)).data,
  remove: async (id: string) => {
    await api.delete(`/users/${id}`);
  },
};

export const categoriesApi = {
  list: async () => (await api.get<Category[]>("/categories")).data,
  create: async (name: string) => (await api.post<Category>("/categories", { name })).data,
  update: async (id: string, name: string) => (await api.put<Category>(`/categories/${id}`, { name })).data,
  remove: async (id: string) => {
    await api.delete(`/categories/${id}`);
  },
};

export const productsApi = {
  list: async (params?: { search?: string; categoryId?: string; lowStock?: boolean; active?: boolean }) =>
    (await api.get<Product[]>("/products", { params })).data,
  get: async (id: string) => (await api.get<Product>(`/products/${id}`)).data,
  create: async (data: Partial<Product>) => (await api.post<Product>("/products", data)).data,
  update: async (id: string, data: Partial<Product>) => (await api.put<Product>(`/products/${id}`, data)).data,
  adjustStock: async (id: string, quantity: number, reason: string) =>
    (await api.post<Product>(`/products/${id}/adjust-stock`, { quantity, reason })).data,
  remove: async (id: string) => {
    await api.delete(`/products/${id}`);
  },
};

export const suppliersApi = {
  list: async (search?: string) =>
    (await api.get<Supplier[]>("/suppliers", { params: { search } })).data,
  get: async (id: string) => (await api.get<Supplier & { purchases: Purchase[] }>(`/suppliers/${id}`)).data,
  create: async (data: Partial<Supplier>) => (await api.post<Supplier>("/suppliers", data)).data,
  update: async (id: string, data: Partial<Supplier>) => (await api.put<Supplier>(`/suppliers/${id}`, data)).data,
  remove: async (id: string) => {
    await api.delete(`/suppliers/${id}`);
  },
};

export const purchasesApi = {
  list: async (params?: { status?: string; supplierId?: string }) =>
    (await api.get<Purchase[]>("/purchases", { params })).data,
  get: async (id: string) => (await api.get<Purchase>(`/purchases/${id}`)).data,
  create: async (data: {
    supplierId: string;
    notes?: string;
    items: { productId: string; quantity: number; unitCost: number }[];
  }) => (await api.post<Purchase>("/purchases", data)).data,
  receive: async (id: string) => (await api.post<Purchase>(`/purchases/${id}/receive`)).data,
  cancel: async (id: string) => (await api.post<Purchase>(`/purchases/${id}/cancel`)).data,
};

export const customersApi = {
  list: async (search?: string) => (await api.get<Customer[]>("/customers", { params: { search } })).data,
  get: async (id: string) => (await api.get<Customer & { sales: Sale[] }>(`/customers/${id}`)).data,
  create: async (data: Partial<Customer>) => (await api.post<Customer>("/customers", data)).data,
  update: async (id: string, data: Partial<Customer>) => (await api.put<Customer>(`/customers/${id}`, data)).data,
  remove: async (id: string) => {
    await api.delete(`/customers/${id}`);
  },
};

export const salesApi = {
  list: async (params?: { from?: string; to?: string; customerId?: string; status?: string }) =>
    (await api.get<Sale[]>("/sales", { params })).data,
  get: async (id: string) => (await api.get<Sale>(`/sales/${id}`)).data,
  create: async (data: {
    customerId?: string | null;
    discount?: number;
    tax?: number;
    paymentMethod: string;
    notes?: string;
    items: { productId: string; quantity: number; unitPrice: number }[];
  }) => (await api.post<Sale>("/sales", data)).data,
  refund: async (id: string) => (await api.post<Sale>(`/sales/${id}/refund`)).data,
};

export const expensesApi = {
  list: async (params?: { from?: string; to?: string; category?: string }) =>
    (await api.get<Expense[]>("/expenses", { params })).data,
  create: async (data: { category: string; description: string; amount: number; expenseDate?: string }) =>
    (await api.post<Expense>("/expenses", data)).data,
  update: async (
    id: string,
    data: Partial<{ category: string; description: string; amount: number; expenseDate: string }>
  ) => (await api.put<Expense>(`/expenses/${id}`, data)).data,
  remove: async (id: string) => {
    await api.delete(`/expenses/${id}`);
  },
};

export const dashboardApi = {
  summary: async () => (await api.get<DashboardSummary>("/dashboard/summary")).data,
};
