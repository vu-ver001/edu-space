package com.eduspace.backend.space;

import com.eduspace.backend.space.dto.request.FacilityCreateRequestKT;
import com.eduspace.backend.space.dto.request.FacilityUpdateRequestKT;
import com.eduspace.backend.space.dto.response.FacilityResponseKT;
import com.eduspace.backend.space.entity.Facility;
import com.eduspace.backend.common.exception.AppException;
import com.eduspace.backend.space.repository.FacilityRepository;
import com.eduspace.backend.space.service.FacilityService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FacilityServiceTest {

    @Mock
    private FacilityRepository facilityRepository;

    @InjectMocks
    private FacilityService facilityService;

    @Test
    @DisplayName("FAC-01: Tạo Facility thành công")
    void testCreateFacility_Success() {
        FacilityCreateRequestKT request = FacilityCreateRequestKT.builder()
                .name("Máy chiếu")
                .description("Máy chiếu phục vụ học nhóm")
                .build();

        when(facilityRepository.existsByNameIgnoreCase("Máy chiếu")).thenReturn(false);
        when(facilityRepository.save(any(Facility.class))).thenAnswer(invocation -> {
            Facility f = invocation.getArgument(0);
            f.setId(1L);
            return f;
        });

        FacilityResponseKT response = facilityService.createFacility(request);

        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertEquals("Máy chiếu", response.getName());
    }

    @Test
    @DisplayName("FAC-02: Duplicate Facility name ném 409 FACILITY_NAME_EXISTS")
    void testCreateFacility_DuplicateName_Throws409() {
        FacilityCreateRequestKT request = FacilityCreateRequestKT.builder()
                .name("Máy chiếu")
                .description("Trùng")
                .build();

        when(facilityRepository.existsByNameIgnoreCase("Máy chiếu")).thenReturn(true);

        AppException ex = assertThrows(AppException.class, () -> facilityService.createFacility(request));
        assertEquals(HttpStatus.CONFLICT, ex.getStatus());
        assertEquals("FACILITY_NAME_EXISTS", ex.getCode());
    }

    @Test
    @DisplayName("SOFT-05: Soft delete Facility")
    void testDeleteFacility_SoftDelete_Success() {
        Facility facility = Facility.builder()
                .id(1L)
                .name("Máy chiếu")
                .build();

        when(facilityRepository.findByIdAndDeletedAtIsNull(1L)).thenReturn(Optional.of(facility));
        when(facilityRepository.save(any(Facility.class))).thenReturn(facility);

        facilityService.deleteFacility(1L);

        assertNotNull(facility.getDeletedAt());
        verify(facilityRepository, times(1)).save(facility);
    }
}
