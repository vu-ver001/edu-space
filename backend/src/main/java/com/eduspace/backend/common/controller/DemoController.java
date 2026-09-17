package com.eduspace.backend.common.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/demo/spaces")
public class DemoController {

    @GetMapping
    public ResponseEntity<?> getAllSpaces() {
        return ResponseEntity.ok("Thành công! Ai cũng có thể xem danh sách phòng.");
    }

    @PostMapping("/book")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> bookSpace() {
        return ResponseEntity.ok("Thành công! Sinh viên đã đặt được phòng.");
    }

    @PostMapping("/create")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<?> createSpace() {
        return ResponseEntity.ok("Thành công! Staff/Admin đã tạo phòng mới.");
    }
}
