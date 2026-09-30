import { spaceImageApi } from '../api/spaceImageApi';
import type { SpaceFormImage, SpaceImage } from '../types/space';

/**
 * Đồng bộ danh sách ảnh trong form với bảng space_images thông qua REST API.
 * File ảnh được backend lưu trên ổ đĩa; CSDL lưu đường dẫn và thông tin ảnh.
 */
export const syncSpaceImages = async (
  spaceId: number,
  formImages: SpaceFormImage[],
  originalImages: SpaceImage[] = [],
): Promise<void> => {
  const retainedImageIds = new Set(
    formImages
      .filter((image) => image.type === 'existing' && image.spaceImageId)
      .map((image) => image.spaceImageId as number),
  );

  const removedImages = originalImages.filter(
    (image) => !retainedImageIds.has(image.id),
  );

  for (const image of removedImages) {
    await spaceImageApi.deleteImage(image.id);
  }

  const savedIdsByFormId = new Map<string, number>();

  for (let index = 0; index < formImages.length; index++) {
    const image = formImages[index];

    if (image.type === 'existing' && image.spaceImageId) {
      savedIdsByFormId.set(image.id, image.spaceImageId);
      continue;
    }

    if (image.type === 'file' && image.file) {
      const formData = new FormData();
      formData.append('file', image.file);
      formData.append('isPrimary', String(image.isPrimary));
      formData.append('sortOrder', String(index));

      const response = await spaceImageApi.uploadImage(spaceId, formData);
      savedIdsByFormId.set(image.id, response.data.id);
      continue;
    }

    if (image.type === 'url' && image.url?.trim()) {
      const response = await spaceImageApi.addImageUrl(spaceId, {
        imageUrl: image.url.trim(),
        isPrimary: image.isPrimary,
        sortOrder: index,
      });
      savedIdsByFormId.set(image.id, response.data.id);
    }
  }

  const primaryImage = formImages.find((image) => image.isPrimary);
  const primaryImageId = primaryImage
    ? savedIdsByFormId.get(primaryImage.id)
    : undefined;

  if (primaryImageId) {
    await spaceImageApi.setPrimaryImage(primaryImageId);
  }

  const orderItems = formImages
    .map((image, sortOrder) => {
      const imageId = savedIdsByFormId.get(image.id);
      return imageId ? { imageId, sortOrder } : null;
    })
    .filter((item): item is { imageId: number; sortOrder: number } => item !== null);

  if (orderItems.length > 0) {
    await spaceImageApi.reorderImages(spaceId, orderItems);
  }
};
