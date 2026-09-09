package com.FMOnitor_SpringWeb.FMOnitor_WebBE.util;

import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.Set;

// Stands in for java.util.Set.of(...), which needs Java 9 - this project
// targets Java 8, so every Set.of(...) call in the codebase became a call to
// this instead. Just builds a plain LinkedHashSet (keeps insertion order)
// with the given values.
public final class SetUtil {

    private SetUtil() {
    }

    @SafeVarargs
    public static <T> Set<T> of(T... values) {
        return new LinkedHashSet<>(Arrays.asList(values));
    }
}
