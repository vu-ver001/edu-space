package com.eduspace.backend.auth.repository;

import com.eduspace.backend.auth.entity.Role;
import com.eduspace.backend.auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    Optional<User> findByEmailOrUsername(String email, String username);

    List<User> findByRole(Role role);
}
