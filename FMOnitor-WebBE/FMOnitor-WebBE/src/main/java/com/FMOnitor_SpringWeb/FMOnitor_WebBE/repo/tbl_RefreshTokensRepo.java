package com.FMOnitor_SpringWeb.FMOnitor_WebBE.repo;

import com.FMOnitor_SpringWeb.FMOnitor_WebBE.model.tbl_RefreshTokens;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface tbl_RefreshTokensRepo extends JpaRepository<tbl_RefreshTokens, Long> {
    Optional<tbl_RefreshTokens> findByTokenHash(String tokenHash);
    void deleteByUserId(Long userId);
}
