import api from '../../../services/api';
import type { SpaceImage } from '../types/space';

export const spaceImageApi = {
  // Lấy danh sách ảnh của không gian
  getImagesBySpace: async (spaceId: number): Promise<SpaceImage[]> => {
    const res = await api.get<SpaceImage[]>(`/api/spaces/${spaceId}/images`);
    return res.data;
  },

  // Admin thêm ảnh bằng URL
  addImageUrl: async (spaceId: number, data: { imageUrl: string; isPrimary?: boolean; sortOrder?: number }): Promise<SpaceImage> => {
    const res = await api.post<SpaceImage>(`/api/admin/spaces/${spaceId}/images`, data);
    return res.data;
  },

  // Admin upload file ảnh
  uploadImage: async (spaceId: number, formData: FormData): Promise<SpaceImage> => {
    const res = await api.post<SpaceImage>(`/api/admin/spaces/${spaceId}/images/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },

  // Admin đặt ảnh chính (Primary)
  setPrimaryImage: async (imageId: number): Promise<SpaceImage> => {
    const res = await api.put<SpaceImage>(`/api/admin/space-images/${imageId}/primary`);
    return res.data;
  },

  // Admin xóa ảnh
  deleteImage: async (imageId: number): Promise<void> => {
    await api.delete(`/api/admin/space-images/${imageId}`);
  },

  // Admin sắp xếp lại thứ tự ảnh
  reorderImages: async (spaceId: number, items: Array<{ imageId: number; sortOrder: number }>): Promise<SpaceImage[]> => {
    const res = await api.put<SpaceImage[]>(`/api/admin/spaces/${spaceId}/images/order`, { items });
    return res.data;
  }
};
