package com.FMOnitor_SpringWeb.FMOnitor_WebBE.service;

import com.FMOnitor_SpringWeb.FMOnitor_WebBE.repo.tbl_RefreshTokensRepo;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.repo.tbl_UsersRepo;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AccountService {

    private final tbl_UsersRepo usersRepo;
    private final tbl_RefreshTokensRepo refreshTokensRepo;

    public AccountService(tbl_UsersRepo usersRepo, tbl_RefreshTokensRepo refreshTokensRepo) {
        this.usersRepo = usersRepo;
        this.refreshTokensRepo = refreshTokensRepo;
    }

    @Transactional
    public void permanentlyDelete(Long userId) {
        refreshTokensRepo.deleteByUserId(userId);
        usersRepo.deleteById(userId);
    }
}
