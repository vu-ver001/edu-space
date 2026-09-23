// src/main/java/com/eduspace/backend/setting/controller/SystemSettingController.java
package com.eduspace.backend.setting.controller;

import com.eduspace.backend.setting.dto.SettingDto;
import com.eduspace.backend.setting.entity.SystemSetting;
import com.eduspace.backend.setting.repository.SystemSettingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
public class SystemSettingController {

    private final SystemSettingRepository settingRepository;

    // 1. API GET: Lấy toàn bộ cấu hình (Ai đăng nhập cũng được gọi để vẽ giao diện)
    @GetMapping
    public ResponseEntity<Map<String, String>> getAllSettings() {
        List<SystemSetting> settings = settingRepository.findAll();

        // Chuyển List thành định dạng JSON Object { "key": "value" } cho Frontend dễ xử lý
        Map<String, String> settingsMap = settings.stream()
                .collect(Collectors.toMap(SystemSetting::getKey, SystemSetting::getValue));

        return ResponseEntity.ok(settingsMap);
    }

    // 2. API PUT: Cập nhật hàng loạt (CHỈ ADMIN MỚI CÓ QUYỀN GỌI)
    @PutMapping("/bulk")
    @PreAuthorize("hasRole('ADMIN')") // Bảo vệ endpoint, chỉ Admin được lưu cấu hình
    public ResponseEntity<Void> updateSettingsBulk(@RequestBody List<SettingDto> payloads) {
        for (SettingDto dto : payloads) {
            SystemSetting setting = settingRepository.findById(dto.getKey())
                    .orElse(new SystemSetting(dto.getKey(), "")); // Nếu key chưa có thì tạo mới

            setting.setValue(dto.getValue());
            settingRepository.save(setting);
        }
        return ResponseEntity.ok().build();
    }
}