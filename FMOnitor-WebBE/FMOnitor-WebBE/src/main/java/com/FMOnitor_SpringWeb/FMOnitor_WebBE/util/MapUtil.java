package com.FMOnitor_SpringWeb.FMOnitor_WebBE.util;

import java.util.LinkedHashMap;
import java.util.Map;

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
