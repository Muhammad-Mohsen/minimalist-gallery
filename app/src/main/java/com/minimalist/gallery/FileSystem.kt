package com.minimalist.gallery

import java.io.File
import android.os.Environment

object FileSystem {

	data class FileItem(val name: String, val path: String, val isDirectory: Boolean)

	fun list(path: String?): List<FileItem> {
		val targetPath = path ?: Environment.getExternalStorageDirectory().absolutePath
		val root = File(targetPath)
		if (!root.exists() || !root.isDirectory) return emptyList()

		return root.listFiles()?.map {
			FileItem(it.name, it.absolutePath, it.isDirectory)
		}?.sortedWith(compareBy({ !it.isDirectory }, { it.name.lowercase() })) ?: emptyList()
	}
}
