package com.FMOnitor_SpringWeb.FMOnitor_WebBE.util;

import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.Set;

public final class SetUtil {

    private SetUtil() {
    }

    @SafeVarargs
    public static <T> Set<T> of(T... values) {
        return new LinkedHashSet<>(Arrays.asList(values));
    }
}
