package com.minimalist.gallery.foundation

import android.content.SharedPreferences
import android.os.Build
import android.os.Environment
import androidx.annotation.RequiresApi
import androidx.core.content.edit
import com.minimalist.gallery.data.SortBy
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.util.Arrays

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

// FILE
val ROOT = "/"
val EXTERNAL_STORAGE_PATH: String = Environment.getExternalStorageDirectory().path

fun File?.isRoot(): Boolean {
	return (this?.absolutePath?.filter { it == '/' }?.length ?: 1) <= 1
}
fun File.isImage(): Boolean {
	return this.exists()
			&& listOf("jpg", "jpeg", "jpe", "jfif", "png", "gif", "bmp", "webp", "heic", "heif", "svg", "svgz", "ico")
		.contains(this.extension.lowercase())
}
fun File.listFiles(sortBy: String): ArrayList<File> {
	val fileModels = ArrayList<File>()

	var files = listFiles { file ->
		!file.isHidden && (file.isDirectory || file.isImage())
	}

	// just to make sure that we aren't trapped in the basement
	if (files == null) {
		when (absolutePath) {
			"/" -> files = arrayOf(File("/storage"))
			"/storage" -> files = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) listVolumes() else arrayOf(File("/storage/emulated"))
			"/storage/emulated" -> files = arrayOf(File("/storage/emulated/0"))
		}
	}

	if (files == null) return ArrayList()

	when (sortBy) {
		SortBy.AZ, SortBy.ZA -> {
			Arrays.sort(files) { o1, o2 ->
				if (o1.isDirectory && !o2.isDirectory) -1
				else if (o2.isDirectory && !o1.isDirectory) 1
				else if (sortBy == SortBy.AZ) o1.name.compareTo(o2.name, ignoreCase = true) // both are the same thing, AZ
				else o2.name.compareTo(o1.name, ignoreCase = true) // both are the same, ZA
			}
		}
		SortBy.OLDEST, SortBy.NEWEST -> {
			Arrays.sort(files) { o1, o2 ->
				if (o1.isDirectory && !o2.isDirectory) -1
				else if (o2.isDirectory && !o1.isDirectory) 1
				else if (sortBy == SortBy.OLDEST) o1.lastModified().compareTo(o2.lastModified())
				else o2.lastModified().compareTo(o1.lastModified())
			}
		}
	}

	for (f in files) fileModels.add(f)
	return fileModels
}

// After the scoped storage changes, we can't access the SD card from "/storage".listFiles() anymore :)
// this little guy returns them nonetheless
@RequiresApi(Build.VERSION_CODES.R)
private fun listVolumes(): Array<File> {
//	val context = State.applicationContext
//
//	val storageManager = context.getSystemService(Context.STORAGE_SERVICE) as StorageManager
//	return ArrayList(storageManager.storageVolumes.mapNotNull {
//		// leaving this as is, causes a minor navigation problem...we end up with the breadcrumbs looking like storage/0/0 when navigating
//		if (it.directory?.absolutePath == "/storage/emulated/0") File("/storage/emulated")
//		else it.directory
//
//	}).toTypedArray()

	return Array(1) {
		File("dummy_path")
	}
}