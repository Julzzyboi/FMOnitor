package com.FMOnitor_SpringWeb.FMOnitor_WebBE.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HelloController {
    @GetMapping("/hello")
    public String getGreet(){
        return "Hello Controller";
    }
}
