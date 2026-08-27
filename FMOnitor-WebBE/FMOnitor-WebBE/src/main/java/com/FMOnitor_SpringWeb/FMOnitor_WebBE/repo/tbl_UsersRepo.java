package com.FMOnitor_SpringWeb.FMOnitor_WebBE.repo;

import com.FMOnitor_SpringWeb.FMOnitor_WebBE.model.tbl_Users;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface tbl_UsersRepo extends JpaRepository<tbl_Users, Long> {
    Optional<tbl_Users> findByGoogleSub(String googleSub);
}
