package com.minimalist.gallery.foundation

import android.content.SharedPreferences
import androidx.core.content.edit
import org.json.JSONArray
import org.json.JSONObject

// PREFS
fun SharedPreferences.put(key: String, value: Any) {
	this.edit {
		when (value) {
			is String -> putString(key, value)
			is Int -> putInt(key, value)
			is Long -> putLong(key, value)
			is Float -> putFloat(key, value)
			is Boolean -> putBoolean(key, value)
			is List<*> -> putString(key, value.joinToString(";"))
		}
	}
}

// JSON
fun JSONObject.toMap(): Map<String, Any> {
	val map = mutableMapOf<String, Any>()
	val keysItr = this.keys()
	while (keysItr.hasNext()) {
		val key = keysItr.next()
		var value = this[key] ?: ""

		// Handle nested objects and arrays
		when (value) {
			is JSONObject -> value = value.toMap()
			is JSONArray -> value = value.toList()
		}
		map[key] = value
	}
	return map
}
fun JSONArray.toList(): List<Any> {
	val list = mutableListOf<Any>()
	for (i in 0 until this.length()) {
		var value = this[i]
		when (value) {
			is JSONObject -> value = value.toMap()
			is JSONArray -> value = value.toList()
		}
		list.add(value)
	}
	return list
}
