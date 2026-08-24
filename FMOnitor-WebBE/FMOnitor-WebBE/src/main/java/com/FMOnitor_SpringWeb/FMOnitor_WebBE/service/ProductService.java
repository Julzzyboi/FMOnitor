package com.FMOnitor_SpringWeb.FMOnitor_WebBE.service;

import com.FMOnitor_SpringWeb.FMOnitor_WebBE.model.Product;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.repo.ProductRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProductService {

    @Autowired
    private ProductRepo productRepo;

    public List<Product> getAllProducts() {
        return productRepo.findAll();
    }
}
