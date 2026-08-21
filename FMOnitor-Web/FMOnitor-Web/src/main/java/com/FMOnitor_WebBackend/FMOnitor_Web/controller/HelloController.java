package com.FMOnitor_WebBackend.FMOnitor_Web.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HelloController {
    @GetMapping("/Hello")
    public String greet(){
        return "Hello Controller";
    }
}
