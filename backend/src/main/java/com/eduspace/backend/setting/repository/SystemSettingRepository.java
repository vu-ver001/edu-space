// src/main/java/com/eduspace/backend/setting/repository/SystemSettingRepository.java
package com.eduspace.backend.setting.repository;

import com.eduspace.backend.setting.entity.SystemSetting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SystemSettingRepository extends JpaRepository<SystemSetting, String> {
}