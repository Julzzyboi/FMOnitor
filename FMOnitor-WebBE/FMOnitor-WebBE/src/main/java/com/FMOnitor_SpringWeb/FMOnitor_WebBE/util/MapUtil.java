package com.FMOnitor_SpringWeb.FMOnitor_WebBE.util;

import java.util.LinkedHashMap;
import java.util.Map;

// Stands in for java.util.Map.of(...), which needs Java 9 - this project
// targets Java 8, so every Map.of(...) call in the codebase became a call to
// this instead. Just builds a plain LinkedHashMap (keeps insertion order,
// same as how these read in code) with the given key/value pairs.
public final class MapUtil {

    private MapUtil() {
    }

    public static <K, V> Map<K, V> of(K k1, V v1) {
        Map<K, V> map = new LinkedHashMap<>();
        map.put(k1, v1);
        return map;
    }

    public static <K, V> Map<K, V> of(K k1, V v1, K k2, V v2) {
        Map<K, V> map = new LinkedHashMap<>();
        map.put(k1, v1);
        map.put(k2, v2);
        return map;
    }
}
