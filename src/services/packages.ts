import api from "./api";

export interface Package {
  id: number;
  name: string;
  description: string;
  price: number;
  duration: number; // in days
  features: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserPackage {
  id: string;
  packageId: string;
  package: Package;
  userId: string;
  startDate: string;
  endDate: string;
  status: "active" | "expired" | "cancelled";
  createdAt: string;
  updatedAt: string;
}

interface PurchasePackageResponse {
  status: number;
  message: string;
  userPackageId?: string; // ID của user package sau khi mua thành công
}

export const packagesService = {
  async getAllPackages(): Promise<Package[]> {
    const response = await api.get("/packages");
    return response.data;
  },

  async getPackageById(id: string): Promise<Package> {
    const response = await api.get(`/packages/${id}`);
    return response.data;
  },

  async getUserPackages(): Promise<UserPackage[]> {
    const response = await api.get("/packages/user");
    return response.data;
  },

  async purchasePackage(packageId: number): Promise<PurchasePackageResponse> {
    const response = await api.post("/packages/purchase", { packageId });
    return response.data;
  },

  async cancelPackage(userPackageId: string): Promise<{ success: boolean }> {
    const response = await api.post(`/packages/cancel/${userPackageId}`);
    return response.data;
  },
};
