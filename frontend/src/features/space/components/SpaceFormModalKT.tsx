import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  AlertCircle,
  Building2,
  Check,
  UploadCloud,
  Link as LinkIcon,
  Trash2,
  Star,
  ImagePlus,
} from 'lucide-react';
import type {
  Space,
  Facility,
  SpaceCreateRequest,
  SpaceUpdateRequest,
  SpaceFormImage,
} from '../types/space';
import type { SpaceType } from '../types/spaceType';
import './SpaceTypeFormModalKT.css';
import './SpaceFormModalKT.css';
import { formatImageUrl } from '../../../utils/imageUrl';

interface Props {
  isOpen: boolean;
  mode: 'create' | 'edit';
  space?: Space | null;
  spaceTypes: SpaceType[];
  facilities: Facility[];
  isLoading?: boolean;
  onClose: () => void;
  onSubmit: (
    data: SpaceCreateRequest | SpaceUpdateRequest,
    images?: SpaceFormImage[]
  ) => Promise<void>;
}

export const SpaceFormModalKT: React.FC<Props> = ({
  isOpen,
  mode,
  space,
  spaceTypes,
  facilities,
  isLoading = false,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState('');
  const [spaceCode, setSpaceCode] = useState('');
  const [spaceTypeId, setSpaceTypeId] = useState<number>(0);
  const [building, setBuilding] = useState('');
  const [floor, setFloor] = useState('');
  const [capacity, setCapacity] = useState<number | ''>('');
  const [status, setStatus] = useState<Space['status']>('AVAILABLE');
  const [description, setDescription] = useState('');
  const [selectedFacilityIds, setSelectedFacilityIds] = useState<number[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Image Management States
  const [images, setImages] = useState<SpaceFormImage[]>([]);
  const [imageInputMethod, setImageInputMethod] = useState<'file' | 'url'>('file');
  const [urlInput, setUrlInput] = useState('');
  const [imageError, setImageError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const imagesRef = useRef<SpaceFormImage[]>([]);

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && space) {
        setName(space.name || '');
        setSpaceCode(space.spaceCode || '');
        setSpaceTypeId(space.spaceType?.id || space.spaceTypeId || 0);
        setBuilding(space.building || '');
        setFloor(space.floor || '');
        setCapacity(space.capacity || 10);
        setStatus(space.status || 'AVAILABLE');
        setDescription(space.description || '');
        setSelectedFacilityIds(space.facilities ? space.facilities.map((f) => f.id) : []);

        // Load existing images
        if (space.images && space.images.length > 0) {
          const loaded: SpaceFormImage[] = space.images.map((img, idx) => ({
            id: `existing-${img.id || idx}`,
            type: 'existing',
            spaceImageId: img.id,
            url: img.imageUrl,
            previewUrl: formatImageUrl(img.imageUrl) || img.imageUrl,
            isPrimary: Boolean(img.isPrimary || img.primary),
            sortOrder: img.sortOrder ?? idx,
          }));
          setImages(loaded);
        } else if (space.primaryImageUrl) {
          setImages([
            {
              id: 'existing-primary',
              type: 'existing',
              url: space.primaryImageUrl,
              previewUrl: formatImageUrl(space.primaryImageUrl) || space.primaryImageUrl,
              isPrimary: true,
              sortOrder: 0,
            },
          ]);
        } else {
          setImages([]);
        }
      } else {
        setName('');
        setSpaceCode('');
        setSpaceTypeId(0);
        setBuilding('');
        setFloor('');
        setCapacity('');
        setStatus('AVAILABLE');
        setDescription('');
        setSelectedFacilityIds([]);
        setImages([]);
        setUrlInput('');
      }
      setValidationError(null);
      setFieldErrors({});
      setImageError(null);
      setImageInputMethod('file');
    }
  }, [isOpen, mode, space]);

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  // Thu hồi các URL xem trước của file khi component bị gỡ khỏi trang.
  useEffect(() => {
    return () => {
      imagesRef.current.forEach((item) => {
        if (item.type === 'file' && item.previewUrl) {
          try {
            URL.revokeObjectURL(item.previewUrl);
          } catch {}
        }
      });
    };
  }, []);

  useEffect(() => {
    if (Object.keys(fieldErrors).length === 0) return;

    const errorField = formRef.current?.querySelector<HTMLElement>(
      '.input-error, .dropzone-error'
    );
    if (!errorField) return;

    errorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (typeof errorField.focus === 'function') {
      errorField.focus({ preventScroll: true });
    }
  }, [fieldErrors]);

  if (!isOpen) return null;

  const handleToggleFacility = (id: number) => {
    setSelectedFacilityIds((prev) =>
      prev.includes(id) ? prev.filter((fid) => fid !== id) : [...prev, id]
    );
  };

  // Image Upload Handlers
  const handleFilesAdded = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    setImageError(null);

    if (images.length + files.length > 10) {
      setImageError(`Chỉ được thêm tối đa 10 ảnh cho mỗi không gian (hiện đã có ${images.length} ảnh).`);
      return;
    }

    const newItems: SpaceFormImage[] = [];
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        setImageError(`File "${file.name}" vượt quá dung lượng tối đa 5MB.`);
        return;
      }
      const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowed.includes(file.type.toLowerCase())) {
        setImageError(`File "${file.name}" không đúng định dạng JPG, PNG, WEBP.`);
        return;
      }
      const previewUrl = URL.createObjectURL(file);
      newItems.push({
        id: `file-${Date.now()}-${Math.random()}`,
        type: 'file',
        file,
        previewUrl,
        isPrimary: images.length === 0 && newItems.length === 0,
        sortOrder: images.length + newItems.length,
      });
    }

    setImages((prev) => {
      const combined = [...prev, ...newItems];
      if (!combined.some((item) => item.isPrimary) && combined.length > 0) {
        combined[0].isPrimary = true;
      }
      return combined;
    });
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next.images;
      return next;
    });
  };

  const handleAddUrl = () => {
    setImageError(null);
    const trimmed = urlInput.trim();
    if (!trimmed) {
      setImageError('Vui lòng nhập đường dẫn URL hình ảnh.');
      return;
    }
    if (images.length >= 10) {
      setImageError('Không gian đã đạt giới hạn tối đa 10 ảnh.');
      return;
    }

    const newItem: SpaceFormImage = {
      id: `url-${Date.now()}-${Math.random()}`,
      type: 'url',
      url: trimmed,
      previewUrl: trimmed,
      isPrimary: images.length === 0,
      sortOrder: images.length,
    };

    setImages((prev) => {
      const combined = [...prev, newItem];
      if (!combined.some((item) => item.isPrimary) && combined.length > 0) {
        combined[0].isPrimary = true;
      }
      return combined;
    });
    setUrlInput('');
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next.images;
      return next;
    });
  };

  const handleSetPrimary = (id: string) => {
    setImages((prev) =>
      prev.map((item) => ({
        ...item,
        isPrimary: item.id === id,
      }))
    );
  };

  const handleRemoveImage = (id: string) => {
    setImages((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target && target.type === 'file') {
        try {
          URL.revokeObjectURL(target.previewUrl);
        } catch {}
      }
      const filtered = prev.filter((item) => item.id !== id);
      if (target?.isPrimary && filtered.length > 0) {
        filtered[0].isPrimary = true;
      }
      if (filtered.length === 0) {
        setImageError('Vui lòng thêm ít nhất 1 hình ảnh cho không gian.');
        setFieldErrors((prevErr) => ({ ...prevErr, images: 'Vui lòng thêm ít nhất 1 hình ảnh cho không gian' }));
      }
      return filtered.map((item, idx) => ({ ...item, sortOrder: idx }));
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setFieldErrors({});
    setImageError(null);

    const errors: Record<string, string> = {};
    if (!spaceCode.trim()) errors.spaceCode = 'Mã không gian không được để trống.';
    if (!name.trim()) errors.name = 'Tên không gian không được để trống.';
    if (spaceTypeId <= 0) errors.spaceTypeId = 'Vui lòng chọn loại không gian.';
    if (!building.trim()) errors.building = 'Tòa nhà không được để trống.';
    if (!floor.trim()) errors.floor = 'Tầng không được để trống.';
    if (!capacity || Number(capacity) < 1) errors.capacity = 'Sức chứa phải lớn hơn 0.';
    if (images.length === 0) errors.images = 'Vui lòng thêm ít nhất 1 hình ảnh cho không gian.';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      if (errors.images) setImageError(errors.images);
      return;
    }

    try {
      const payload: SpaceCreateRequest = {
        name: name.trim(),
        spaceCode: spaceCode.trim().toUpperCase(),
        spaceTypeId,
        building: building.trim(),
        floor: floor.trim(),
        capacity: Number(capacity) || 0,
        status,
        description: description.trim() ? description.trim() : undefined,
        facilityIds: selectedFacilityIds,
      };
      await onSubmit(payload, images);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi lưu không gian.';
      const details = err?.response?.data?.details;
      const newFieldErrors: Record<string, string> = {};
      if (Array.isArray(details) && details.length > 0) {
        details.forEach((d: any) => {
          if (typeof d === 'string' && d.includes(': ')) {
            const [field, ...rest] = d.split(': ');
            newFieldErrors[field] = rest.join(': ');
          }
        });
      }

      if (msg.includes('Mã không gian') || msg.includes('SPACE_CODE')) {
        newFieldErrors.spaceCode = newFieldErrors.spaceCode || msg;
      }
      if (msg.includes('Tên không gian') || msg.includes('NAME')) {
        newFieldErrors.name = newFieldErrors.name || msg;
      }
      if (msg.includes('Loại không gian') || msg.includes('loại phòng') || msg.includes('SPACE_TYPE')) {
        newFieldErrors.spaceTypeId = newFieldErrors.spaceTypeId || msg;
      }
      if (msg.includes('Tòa nhà') || msg.includes('BUILDING')) {
        newFieldErrors.building = newFieldErrors.building || msg;
      }
      if (msg.includes('Tầng') || msg.includes('FLOOR')) {
        newFieldErrors.floor = newFieldErrors.floor || msg;
      }
      if (msg.includes('Sức chứa') || msg.includes('CAPACITY')) {
        newFieldErrors.capacity = newFieldErrors.capacity || msg;
      }
      if (msg.includes('ảnh') || msg.includes('IMAGE')) {
        newFieldErrors.images = newFieldErrors.images || msg;
      }

      // Lỗi của từng trường đã hiển thị ngay dưới ô nhập.
      // Chỉ hiện thông báo chung khi backend không chỉ ra trường bị lỗi.
      setValidationError(Object.keys(newFieldErrors).length === 0 ? msg : null);
      setFieldErrors(newFieldErrors);
    }
  };


  return (
    <div className="astp-modal-backdrop" onClick={onClose}>
      <div
        className="astp-modal-card space-modal-card"
        style={{ maxWidth: '680px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="astp-modal-header">
          <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
            <div className="astp-modal-icon">
              <Building2 size={22} color="#2563eb" />
            </div>
            <div className="astp-modal-title-group">
              <h2 className="astp-modal-title">
                {mode === 'create' ? 'Thêm không gian mới' : 'Chỉnh sửa không gian'}
              </h2>
              <p className="astp-modal-subtitle">
                {mode === 'create'
                  ? 'Khai báo thông tin phòng học, sức chứa và tiện ích đi kèm'
                  : `Cập nhật thông tin chi tiết của "${space?.name || ''}"`}
              </p>
            </div>
          </div>
          <button
            className="astp-modal-close-btn"
            onClick={onClose}
            type="button"
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="astp-modal-body">
          {validationError && (
            <div className="astp-alert astp-alert-error" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <AlertCircle size={17} style={{ flexShrink: 0 }} />
              <span>{validationError}</span>
            </div>
          )}

          <form ref={formRef} id="space-form" onSubmit={handleSubmit} className="space-form-grid" noValidate>
            {/* Mã không gian & Tên không gian */}
            <div className="space-form-grid-full" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
              <div className="astp-form-group">
                <label className="astp-form-label">
                  Mã không gian <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className={`astp-form-input ${fieldErrors.spaceCode ? 'input-error' : ''}`}
                  placeholder="VD: G-101, S-201..."
                  value={spaceCode}
                  onChange={(e) => {
                    setSpaceCode(e.target.value.toUpperCase());
                    if (fieldErrors.spaceCode) {
                      setFieldErrors((prev) => ({ ...prev, spaceCode: '' }));
                    }
                    if (validationError) setValidationError(null);
                  }}
                  disabled={isLoading}
                  maxLength={50}
                />
                {fieldErrors.spaceCode && (
                  <span className="astp-field-error-msg">{fieldErrors.spaceCode}</span>
                )}
              </div>

              <div className="astp-form-group">
                <label className="astp-form-label">
                  Tên không gian <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className={`astp-form-input ${fieldErrors.name ? 'input-error' : ''}`}
                  placeholder="VD: Phòng Hội Thảo A1, Khu Tự Học S-201..."
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (fieldErrors.name) {
                      setFieldErrors((prev) => ({ ...prev, name: '' }));
                    }
                    if (validationError) setValidationError(null);
                  }}
                  disabled={isLoading}
                  maxLength={100}
                />
                {fieldErrors.name && (
                  <span className="astp-field-error-msg">{fieldErrors.name}</span>
                )}
              </div>
            </div>

            {/* Loại không gian */}
            <div className="astp-form-group">
              <label className="astp-form-label">
                Loại không gian <span className="text-danger">*</span>
              </label>
              <select
                className={`astp-form-select ${fieldErrors.spaceTypeId ? 'input-error' : ''}`}
                value={spaceTypeId}
                onChange={(e) => {
                  setSpaceTypeId(Number(e.target.value));
                  if (fieldErrors.spaceTypeId) {
                    setFieldErrors((prev) => ({ ...prev, spaceTypeId: '' }));
                  }
                  if (validationError) setValidationError(null);
                }}
                disabled={isLoading}
              >
                <option value={0} disabled>
                  -- Chọn loại phòng --
                </option>
                {spaceTypes.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name} ({st.bookingMode === 'WHOLE_SPACE' ? 'Nguyên phòng' : st.bookingMode === 'PER_SEAT' ? 'Chỗ ngồi' : 'Theo bàn'})
                  </option>
                ))}
              </select>
              {fieldErrors.spaceTypeId && (
                <span className="astp-field-error-msg">{fieldErrors.spaceTypeId}</span>
              )}
            </div>

            {/* Trạng thái */}
            <div className="astp-form-group">
              <label className="astp-form-label">
                Trạng thái <span className="text-danger">*</span>
              </label>
              <select
                className="astp-form-select"
                value={status}
                onChange={(e) => setStatus(e.target.value as Space['status'])}
                disabled={isLoading}
              >
                <option value="AVAILABLE">Đang hoạt động (Sẵn sàng)</option>
                <option value="MAINTENANCE">Đang bảo trì</option>
                <option value="INACTIVE">Tạm ngưng</option>
              </select>
            </div>

            {/* Tòa nhà, Tầng, Sức chứa */}
            <div className="space-form-grid-full" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div className="astp-form-group">
                <label className="astp-form-label">
                  Tòa nhà <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className={`astp-form-input ${fieldErrors.building ? 'input-error' : ''}`}
                  placeholder="VD: Tòa A, Tòa B..."
                  value={building}
                  onChange={(e) => {
                    setBuilding(e.target.value);
                    if (fieldErrors.building) {
                      setFieldErrors((prev) => ({ ...prev, building: '' }));
                    }
                    if (validationError) setValidationError(null);
                  }}
                  disabled={isLoading}
                />
                {fieldErrors.building && (
                  <span className="astp-field-error-msg">{fieldErrors.building}</span>
                )}
              </div>

              <div className="astp-form-group">
                <label className="astp-form-label">
                  Tầng <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className={`astp-form-input ${fieldErrors.floor ? 'input-error' : ''}`}
                  placeholder="VD: 1, 2, G..."
                  value={floor}
                  onChange={(e) => {
                    setFloor(e.target.value);
                    if (fieldErrors.floor) {
                      setFieldErrors((prev) => ({ ...prev, floor: '' }));
                    }
                    if (validationError) setValidationError(null);
                  }}
                  disabled={isLoading}
                />
                {fieldErrors.floor && (
                  <span className="astp-field-error-msg">{fieldErrors.floor}</span>
                )}
              </div>

              <div className="astp-form-group">
                <label className="astp-form-label">
                  Sức chứa (người) <span className="text-danger">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  max={1000}
                  className={`astp-form-input ${fieldErrors.capacity ? 'input-error' : ''}`}
                  placeholder="VD: 20"
                  value={capacity}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCapacity(val === '' ? '' : Number(val));
                    if (fieldErrors.capacity) {
                      setFieldErrors((prev) => ({ ...prev, capacity: '' }));
                    }
                    if (validationError) setValidationError(null);
                  }}
                  disabled={isLoading}
                />
                {fieldErrors.capacity && (
                  <span className="astp-field-error-msg">{fieldErrors.capacity}</span>
                )}
              </div>
            </div>

            {/* Tiện ích đi kèm */}
            <div className="astp-form-group space-form-grid-full">
              <label className="astp-form-label">
                Tiện ích đi kèm ({selectedFacilityIds.length} đã chọn)
              </label>
              {facilities.length === 0 ? (
                <p className="form-input-help">Đang tải danh mục tiện ích...</p>
              ) : (
                <div className="facility-select-grid">
                  {facilities.map((fac) => {
                    const isSelected = selectedFacilityIds.includes(fac.id);
                    return (
                      <button
                        key={fac.id}
                        type="button"
                        className={`facility-chip-toggle ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleToggleFacility(fac.id)}
                        title={fac.description || fac.name}
                      >
                        {isSelected && <Check size={13} className="check-icon" />}
                        <span>{fac.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
              <span className="form-input-help">
                Nhấp vào tiện ích để bật / tắt lựa chọn
              </span>
            </div>

            {/* Quản lý hình ảnh & Chọn ảnh đại diện (Lưu vào bảng space_images) */}
            <div className="astp-form-group space-form-grid-full">
              <div className="image-manager-section">
                <div className="image-manager-header">
                  <div className="image-manager-title">
                    <ImagePlus size={18} color="#2563eb" />
                    <span>
                      Hình ảnh không gian & Chọn ảnh đại diện <span style={{ color: '#ef4444' }}>*</span>
                    </span>
                  </div>
                  <span className={`badge-image-count ${images.length >= 10 ? 'limit-reached' : ''}`}>
                    {images.length}/10 ảnh
                  </span>
                </div>

                {/* Switcher: File upload vs URL input */}
                <div className="image-tab-switcher">
                  <button
                    type="button"
                    className={`image-tab-btn ${imageInputMethod === 'file' ? 'active' : ''}`}
                    onClick={() => {
                      setImageInputMethod('file');
                      setImageError(null);
                    }}
                  >
                    <UploadCloud size={14} />
                    <span>Tải file từ máy</span>
                  </button>
                  <button
                    type="button"
                    className={`image-tab-btn ${imageInputMethod === 'url' ? 'active' : ''}`}
                    onClick={() => {
                      setImageInputMethod('url');
                      setImageError(null);
                    }}
                  >
                    <LinkIcon size={14} />
                    <span>Nhập đường dẫn URL</span>
                  </button>
                </div>

                {/* Tab Content: File Upload */}
                {imageInputMethod === 'file' ? (
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      style={{ display: 'none' }}
                      onChange={(e) => handleFilesAdded(e.target.files)}
                      disabled={isLoading || images.length >= 10}
                    />
                    <div
                      className={`image-dropzone ${isDragOver ? 'dragover' : ''} ${fieldErrors.images ? 'dropzone-error' : ''}`}
                      onClick={() => {
                        if (images.length < 10 && fileInputRef.current) {
                          fileInputRef.current.click();
                        }
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragOver(true);
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        setIsDragOver(false);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDragOver(false);
                        handleFilesAdded(e.dataTransfer.files);
                      }}
                    >
                      <div className="dropzone-icon-circle">
                        <UploadCloud size={20} />
                      </div>
                      <span className="dropzone-text-primary">
                        Nhấp để chọn file hoặc kéo thả ảnh vào đây
                      </span>
                      <span className="dropzone-text-secondary">
                        Định dạng hỗ trợ: JPG, PNG, WEBP (Tối đa 5MB / file, tối đa 10 ảnh)
                      </span>
                    </div>
                  </div>
                ) : (
                  /* Tab Content: URL Input */
                  <div className="image-url-input-group">
                    <input
                      type="url"
                      className={`astp-form-input ${fieldErrors.images ? 'input-error' : ''}`}
                      placeholder="Nhập đường link ảnh (VD: https://images.unsplash.com/...)"
                      value={urlInput}
                      onChange={(e) => {
                        setUrlInput(e.target.value);
                        if (imageError) setImageError(null);
                        if (fieldErrors.images) {
                          setFieldErrors((prev) => {
                            const next = { ...prev };
                            delete next.images;
                            return next;
                          });
                        }
                      }}
                      disabled={isLoading || images.length >= 10}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddUrl();
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="btn-add-url"
                      onClick={handleAddUrl}
                      disabled={isLoading || !urlInput.trim() || images.length >= 10}
                    >
                      <Check size={14} />
                      <span>Thêm ảnh</span>
                    </button>
                  </div>
                )}

                {/* Error Banner */}
                {(imageError || fieldErrors.images) && (
                  <div className="image-error-alert" style={{ marginTop: '8px' }}>
                    ⚠️ {imageError || fieldErrors.images}
                  </div>
                )}

                {/* Thumbnails Preview Grid */}
                {images.length > 0 && (
                  <div>
                    <span className="form-input-help" style={{ marginBottom: '8px', display: 'block' }}>
                      💡 Bấm vào nút <strong>"Đặt đại diện"</strong> trên ảnh bạn muốn làm ảnh đại diện chính của không gian:
                    </span>
                    <div className="image-preview-grid">
                      {images.map((item) => (
                        <div
                          key={item.id}
                          className={`image-preview-card ${item.isPrimary ? 'is-primary' : ''}`}
                        >
                          <img
                            src={item.previewUrl}
                            alt="Ảnh không gian"
                            className="image-preview-thumb"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400';
                            }}
                          />

                          {/* Primary Badge */}
                          {item.isPrimary && (
                            <div className="primary-tag-badge">
                              <Star size={11} fill="#ffffff" />
                              <span>Ảnh đại diện</span>
                            </div>
                          )}

                          {/* Action Overlay */}
                          <div className="card-actions-overlay">
                            {!item.isPrimary && (
                              <button
                                type="button"
                                className="btn-card-primary-action"
                                onClick={() => handleSetPrimary(item.id)}
                                title="Đặt ảnh này làm ảnh đại diện chính"
                              >
                                <Star size={12} />
                                <span>Đặt đại diện</span>
                              </button>
                            )}
                          </div>

                          {/* Delete Button */}
                          <button
                            type="button"
                            className="btn-card-delete-action"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveImage(item.id);
                            }}
                            title="Xóa ảnh này"
                            aria-label="Xóa ảnh"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Mô tả */}
            <div className="astp-form-group space-form-grid-full">
              <label className="astp-form-label">Mô tả chi tiết</label>
              <textarea
                className="astp-form-textarea"
                rows={3}
                placeholder="Mô tả mục đích sử dụng, trang thiết bị đặc thù hoặc lưu ý sử dụng..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="astp-modal-footer">
          <button
            type="button"
            className="astp-btn astp-btn-secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            Hủy
          </button>
          <button
            type="submit"
            form="space-form"
            className="astp-btn astp-btn-primary"
            disabled={isLoading}
          >
            {isLoading ? 'Đang lưu...' : mode === 'create' ? 'Tạo không gian' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>
    </div>
  );
};
