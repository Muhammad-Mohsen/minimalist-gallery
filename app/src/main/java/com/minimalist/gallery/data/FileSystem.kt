package com.minimalist.gallery.data

import android.content.Context
import android.os.Build
import android.os.Environment
import android.os.storage.StorageManager
import android.provider.MediaStore
import androidx.annotation.RequiresApi
import java.io.File

val EXTERNAL_STORAGE_PATH: String = Environment.getExternalStorageDirectory().path
private val IMAGE_EXTENSIONS = setOf("jpg", "jpeg", "jpe", "jfif", "png", "gif", "bmp", "webp", "avif", "svg", "svgz", "ico")

/**
 * The file explorer
 * The contentResolver.query API is one of the worst-designed APIs I've ever come across!!
 */
object FileSystem {
	private val cache = HashMap<String, ArrayList<FileItem>>()

	// API
	fun listFiles(context: Context, path: String, sortBy: String = SortBy.AZ, forceRefresh: Boolean = false): ArrayList<FileItem> {
		val key = "$sortBy/$path"

		val cached = cache[key]
		if (cached != null && !forceRefresh) return cached

		val files = listFilesInternal(context, path, sortBy)
		cache[key] = files
		return files
	}

	/**
	 * Lists directories and image files under [path] using MediaStore for real storage paths.
	 * Virtual roots ("/", "/storage", "/storage/emulated") are resolved via File fallbacks.
	 */
	private fun listFilesInternal(context: Context, path: String, sortBy: String): ArrayList<FileItem> {
		val virtualFiles = resolveVirtualRoot(context, path)
		if (virtualFiles != null) {
			return virtualFiles.mapTo(ArrayList()) { FileItem(it.name, it.absolutePath, it.isDirectory) }
		}

		val prefix = if (path.endsWith("/")) path else "$path/"
		val prefixLen = prefix.length

		val projection = arrayOf(
			MediaStore.Images.Media._ID,
			MediaStore.Images.Media.DATA,
			MediaStore.Images.Media.SIZE,
			MediaStore.Images.Media.DATE_MODIFIED,
			MediaStore.Images.Media.RESOLUTION,
		)

		// We query everything in the folder AND subfolders in ONE go.
		// Using DATA LIKE is necessary to capture the subtree efficiently.
		 val selection = "${MediaStore.Images.Media.DATA} LIKE ?"
		 val selectionArgs = arrayOf("$prefix%")

		// We MUST sort by DATA ASC in SQL to make the "Fast-skip" logic work.
		// This allows us to jump over 1000 files in a subfolder as soon as we find the first one.
		val cursor = context.contentResolver.query(
			MediaStore.Images.Media.EXTERNAL_CONTENT_URI,
			projection,
			selection,
			selectionArgs,
			"${MediaStore.Images.Media.DATA} ASC"
		)

		val fileList = ArrayList<FileItem>()
		var lastDirPrefix: String? = null

		cursor?.use { c ->
			val dataCol = c.getColumnIndexOrThrow(MediaStore.Images.Media.DATA)
			val idCol = c.getColumnIndexOrThrow(MediaStore.Images.Media._ID)
			val sizeCol = c.getColumnIndexOrThrow(MediaStore.Images.Media.SIZE)
			val dateCol = c.getColumnIndexOrThrow(MediaStore.Images.Media.DATE_MODIFIED)
			val resCol = c.getColumnIndexOrThrow(MediaStore.Images.Media.RESOLUTION)

			while (c.moveToNext()) {
				val data = c.getString(dataCol) ?: continue

				// Fast-skip subdirectories we've already logged
				if (lastDirPrefix != null && data.startsWith(lastDirPrefix)) continue

				val nextSlash = data.indexOf('/', prefixLen)

				// It's a DIRECT file in the current folder
				if (nextSlash == -1) {

					// discard tiffs as they aren't supported by <img>
					val extension = data.substringAfterLast(".").lowercase()
					if (!IMAGE_EXTENSIONS.contains(extension)) continue

					fileList.add(FileItem(
						name = data.substring(prefixLen),
						path = c.getLong(idCol).toString(),
						isDirectory = false,
						size = c.getLong(sizeCol),
						resolution = c.getString(resCol) ?: "",
						date = c.getLong(dateCol)
					))
				}
				else {
					// It's a file inside a SUBDIRECTORY
					val dirName = data.substring(prefixLen, nextSlash)
					val dirPath = data.take(nextSlash)
					fileList.add(FileItem(dirName, dirPath, true))
					lastDirPrefix = "$dirPath/" // Set the skip prefix
				}
			}
		}

		return sortFiles(fileList, sortBy)
	}

	/**
	 * Returns the children of virtual root paths that MediaStore doesn't index,
	 * or null if [path] is a real storage directory.
	 */
	private fun resolveVirtualRoot(context: Context, path: String): Array<File>? {
		return when (path) {
			"/" -> arrayOf(File("/storage"))
			"/storage" -> if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) listVolumes(context)
			else arrayOf(File("/storage/emulated"))
			"/storage/emulated" -> arrayOf(File("/storage/emulated/0"))
			else -> null
		}
	}

	// After the scoped storage changes, we can't access the SD card from "/storage".listFiles() anymore :)
	// this little guy returns them nonetheless
	@RequiresApi(Build.VERSION_CODES.R)
	private fun listVolumes(context: Context): Array<File> {
		val storageManager = context.getSystemService(Context.STORAGE_SERVICE) as StorageManager
		return ArrayList(storageManager.storageVolumes.mapNotNull {
			// leaving this as is, causes a minor navigation problem...we end up with the breadcrumbs looking like storage/0/0 when navigating
			if (it.directory?.absolutePath == "/storage/emulated/0") File("/storage/emulated")
			else it.directory
		}).toTypedArray()
	}

	private fun sortFiles(list: ArrayList<FileItem>, sortBy: String): ArrayList<FileItem> {
		val comparator = when (sortBy) {
			SortBy.ZA -> compareBy<FileItem> { !it.isDirectory }.thenByDescending { it.name.lowercase() }
			SortBy.NEWEST -> compareBy<FileItem> { !it.isDirectory }.thenByDescending { it.date }
			SortBy.OLDEST -> compareBy<FileItem> { !it.isDirectory }.thenBy { it.date }
			else -> compareBy<FileItem> { !it.isDirectory }.thenBy { it.name.lowercase() } // AZ
		}

		list.sortWith(comparator)
		return list
	}
}

/**
 * Lightweight model representing a file or directory returned by the MediaStore query.
 */
data class FileItem(
	val name: String,
	val path: String,
	val isDirectory: Boolean,
	val size: Long = 0,
	val resolution: String = "",
	val date: Long = 0,
) {
	fun toMap(): Map<String, Any> {
		return mapOf(
			"name" to name,
			"path" to path,
			"isDirectory" to isDirectory,
			"size" to size / 1024.0,
			"resolution" to resolution,
			"date" to date,
		)
	}
}
