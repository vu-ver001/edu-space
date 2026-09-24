-- Ảnh tải từ máy được lưu trực tiếp trong MySQL.
-- image_url của ảnh upload sẽ trỏ tới API đọc nội dung ảnh theo id.
-- Các bản ghi ảnh URL cũ vẫn tiếp tục sử dụng image_url như trước.

ALTER TABLE space_images
    ADD COLUMN image_data LONGBLOB NULL AFTER image_url,
    ADD COLUMN content_type VARCHAR(100) NULL AFTER image_data,
    ADD COLUMN original_file_name VARCHAR(255) NULL AFTER content_type;
