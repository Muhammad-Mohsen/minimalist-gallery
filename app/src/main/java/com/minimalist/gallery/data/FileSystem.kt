package com.minimalist.gallery.data

import android.content.Context
import android.os.Build
import android.os.Environment
import android.os.storage.StorageManager
import android.provider.MediaStore
import androidx.annotation.RequiresApi
import java.io.File

val EXTERNAL_STORAGE_PATH: String = Environment.getExternalStorageDirectory().path
// private val IMAGE_EXTENSIONS = setOf("jpg", "jpeg", "jpe", "jfif", "png", "gif", "bmp", "webp", "heic", "heif", "svg", "svgz", "ico")

/**
 * The file explorer cache
 */
object FileSystem {
	private val cache = HashMap<String, ArrayList<FileItem>>()
	private val lastModifiedCache = HashMap<String, Long>()

	// API
	fun listFiles(context: Context, path: String, sortBy: String = SortBy.AZ): ArrayList<FileItem> {
		val key = "$sortBy/$path"

		// Use MediaStore's max(DATE_MODIFIED) as the staleness signal
		val latestModified = queryLatestModified(context, path)
		val cached = cache[key]

		if (cached == null || latestModified > (lastModifiedCache[key] ?: 0L)) {
			val files = listFiles2(context, path, sortBy)
			cache[key] = files
			lastModifiedCache[key] = latestModified
			return files
		}

		return cached
	}

	private fun queryLatestModified(context: Context, path: String): Long {
		val prefix = if (path.endsWith("/")) path else "$path/"
		return try {
			context.contentResolver.query(
				MediaStore.Images.Media.EXTERNAL_CONTENT_URI,
				arrayOf("MAX(${MediaStore.Images.Media.DATE_MODIFIED})"),
				"${MediaStore.Images.Media.DATA} LIKE ?",
				arrayOf("$prefix%"),
				null
			)?.use { cursor ->
				if (cursor.moveToFirst()) cursor.getLong(0) else 0L
			} ?: 0L
		}
		catch (_: Exception) { 0L }
	}

	/**
	 * Lists directories and image files under [path] using MediaStore for real storage paths.
	 * Virtual roots ("/", "/storage", "/storage/emulated") are resolved via File fallbacks.
	 */
	fun listFiles2(context: Context, path: String, sortBy: String): ArrayList<FileItem> {
		val virtualFiles = resolveVirtualRoot(context, path)
		if (virtualFiles != null) {
			return virtualFiles.mapTo(ArrayList()) { FileItem(it.name, it.absolutePath, it.isDirectory) }
		}

		val prefix = if (path.endsWith("/")) path else "$path/"
		val prefixLen = prefix.length

		// files in the current folder have NO slashes after the prefix.
		val projection = arrayOf(
			MediaStore.Images.Media._ID,
			MediaStore.Images.Media.DATA,
			MediaStore.Images.Media.SIZE,
			MediaStore.Images.Media.DATE_MODIFIED,
			MediaStore.Images.Media.RESOLUTION,
			MediaStore.Images.Media.DISPLAY_NAME
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

		val dirMap = LinkedHashMap<String, FileItem>()
		val fileList = ArrayList<FileItem>()
		var lastDirPrefix: String? = null

		cursor?.use { c ->
			val dataCol = c.getColumnIndexOrThrow(MediaStore.Images.Media.DATA)
			val nameCol = c.getColumnIndexOrThrow(MediaStore.Images.Media.DISPLAY_NAME)
			val idCol = c.getColumnIndexOrThrow(MediaStore.Images.Media._ID)
			val sizeCol = c.getColumnIndexOrThrow(MediaStore.Images.Media.SIZE)
			val dateCol = c.getColumnIndexOrThrow(MediaStore.Images.Media.DATE_MODIFIED)
			val resCol = c.getColumnIndexOrThrow(MediaStore.Images.Media.RESOLUTION)

			while (c.moveToNext()) {
				val data = c.getString(dataCol) ?: continue

				// Fast-skip subdirectories we've already logged
				if (lastDirPrefix != null && data.startsWith(lastDirPrefix)) continue

				val nextSlash = data.indexOf('/', prefixLen)

				if (nextSlash == -1) {
					// It's a DIRECT file in the current folder
					fileList.add(FileItem(
						name = c.getString(nameCol) ?: data.substring(prefixLen),
						path = c.getLong(idCol).toString(),
						isDirectory = false,
						size = c.getLong(sizeCol),
						resolution = c.getString(resCol) ?: "",
						date = c.getLong(dateCol)
					))
				} else {
					// It's a file inside a SUBDIRECTORY
					val dirName = data.substring(prefixLen, nextSlash)
					val dirPath = data.take(nextSlash)

					// Since SQL is sorted by DATA, the first time we see this dirName,
					// it is the entry point for that entire folder.
					dirMap[dirName] = FileItem(dirName, dirPath, true)
					lastDirPrefix = "$dirPath/" // Set the skip prefix
				}
			}
		}

		// FINAL SORTING (Much faster to do in memory on a filtered list than in SQL on the whole DB)
		val result = ArrayList<FileItem>(dirMap.size + fileList.size)

		val sortedDirs = when (sortBy) {
			SortBy.ZA -> dirMap.values.sortedByDescending { it.name }
			else -> dirMap.values.sortedBy { it.name }
		}
		when (sortBy) {
			SortBy.AZ -> fileList.sortBy { it.name }
			SortBy.ZA -> fileList.sortByDescending { it.name }
			SortBy.NEWEST -> fileList.sortByDescending { it.date }
			SortBy.OLDEST -> fileList.sortBy { it.date }
		}

		result.addAll(sortedDirs)
		result.addAll(fileList)
		return result
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
)
