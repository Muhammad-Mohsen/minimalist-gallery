package com.minimalist.gallery.data

import android.content.Context
import com.minimalist.gallery.foundation.listFiles
import java.io.File

/**
 * The file explorer cache
 */
object FileCache {
	private val cache = HashMap<String, ArrayList<File>>()
	private val lastModifiedCache = HashMap<String, Long>()

	// API
	fun listFiles(context: Context, path: String, sortBy: String = SortBy.AZ): ArrayList<File> {
		val dir = File(path)
		val path = dir.absolutePath
		var files = cache["$sortBy/$path"]

		// if not cached, or directory was modified more recently than the cache
		if (files == null || dir.lastModified() > (lastModifiedCache["$sortBy/$path"] ?: 0L)) {
			files = dir.listFiles(context, sortBy)
			cache["$sortBy/$path"] = files

			lastModifiedCache["$sortBy/$path"] = dir.lastModified()
		}

		return files
	}
}
