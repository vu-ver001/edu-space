package com.eduspace.backend.checkin.policy.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;




@Entity
@Table(name = "booking_policies")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingPolicy {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "policy_key", nullable = false, unique = true, length = 50)
    private String policyKey;

    @Column(name = "policy_value", nullable = false, length = 100)
    private String policyValue;

    @Column(length = 255)
    private String description;

    @Column(name = "updated_by")
    private String updatedBy;

    @Column(name = "updated_at")
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();
}
