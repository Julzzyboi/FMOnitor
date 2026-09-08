package com.FMOnitor_SpringWeb.FMOnitor_WebBE.service;

import com.FMOnitor_SpringWeb.FMOnitor_WebBE.repo.tbl_RefreshTokensRepo;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.repo.tbl_UsersRepo;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

// Shared by the manual "Delete Permanently" endpoint and the scheduled
// 3-month auto-purge, so both ways an account can be permanently erased go
// through exactly one place. Real, unrecoverable removal: unlike the
// Delete/Disable/Restore status change, there's no row left to restore
// afterward - the point is that the email becomes reusable for a brand new
// invite, which only works if the old row is actually gone (tbl_users.email
// has a unique constraint).
@Service
public class AccountService {

    private final tbl_UsersRepo usersRepo;
    private final tbl_RefreshTokensRepo refreshTokensRepo;

    public AccountService(tbl_UsersRepo usersRepo, tbl_RefreshTokensRepo refreshTokensRepo) {
        this.usersRepo = usersRepo;
        this.refreshTokensRepo = refreshTokensRepo;
    }

    // @Transactional is required, not optional, here - deleteByUserId is a
    // custom derived delete query (needs an active transaction to call
    // EntityManager.remove() under the hood), and this method's two deletes
    // need to succeed or fail together anyway. Login logs are deliberately
    // NOT touched - those are an audit trail of what happened, not "this
    // account's data", and keeping them doesn't block re-inviting the email
    // (tbl_login_logs has no unique constraint on it).
    @Transactional
    public void permanentlyDelete(Long userId) {
        refreshTokensRepo.deleteByUserId(userId);
        usersRepo.deleteById(userId);
    }
}
