package com.FMOnitor_SpringWeb.FMOnitor_WebBE.repo;

import com.FMOnitor_SpringWeb.FMOnitor_WebBE.model.tbl_LoginLogs;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface tbl_LoginLogsRepo extends JpaRepository<tbl_LoginLogs, Long> {
    List<tbl_LoginLogs> findAllByOrderByActionAtDesc();
}
