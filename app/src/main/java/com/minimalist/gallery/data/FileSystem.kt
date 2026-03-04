package com.minimalist.gallery.data

import android.content.Context
import android.os.Build
import android.os.Environment
import android.os.storage.StorageManager
import android.provider.MediaStore
import androidx.annotation.RequiresApi
import java.io.File

val EXTERNAL_STORAGE_PATH: String = Environment.getExternalStorageDirectory().path
private val IMAGE_EXTENSIONS = setOf("jpg", "jpeg", "jpe", "jfif", "png", "gif", "bmp", "webp", "heic", "heif", "svg", "svgz", "ico")

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
		// --- Virtual roots (not indexed by MediaStore) ---
		val virtualFiles = resolveVirtualRoot(context, path)
		if (virtualFiles != null) {
			return virtualFiles.mapTo(ArrayList()) { FileItem(it.name, it.absolutePath, it.isDirectory) }
		}

		// --- MediaStore query ---
		// We query all images whose DATA path starts with "$path/", then derive
		// immediate children (subdirectories and direct image files).
		val prefix = if (path.endsWith("/")) path else "$path/"

		// Only project what we actually use
		val projection = arrayOf(
			MediaStore.Images.Media._ID,
			MediaStore.Images.Media.DATA,
			MediaStore.Images.Media.SIZE,
			MediaStore.Images.Media.DATE_MODIFIED,
			MediaStore.Images.Media.RESOLUTION
		)
		val selection = "${MediaStore.Images.Media.DATA} LIKE ?"
		val selectionArgs = arrayOf("$prefix%")

		// Push sorting into SQLite so the cursor arrives pre-ordered.
		// DATA ordering also groups all files inside the same subdirectory consecutively,
		// which lets us skip entire subtrees once a directory is recorded (see below).
		val sqlOrder = when (sortBy) {
			SortBy.ZA      -> "${MediaStore.Images.Media.DATA} DESC"
			SortBy.NEWEST  -> "${MediaStore.Images.Media.DATE_MODIFIED} DESC"
			SortBy.OLDEST  -> "${MediaStore.Images.Media.DATE_MODIFIED} ASC"
			else           -> "${MediaStore.Images.Media.DATA} ASC" // AZ default
		}

		val dirMap = LinkedHashMap<String, FileItem>()
		val imageMap = LinkedHashMap<String, FileItem>()

		// When sorted by DATA, every file in a subdirectory is adjacent.
		// Once we've recorded a dir, store its path prefix so we can skip the rest.
		var lastDirPrefix: String? = null

		context.contentResolver.query(
			MediaStore.Images.Media.EXTERNAL_CONTENT_URI,
			projection,
			selection,
			selectionArgs,
			sqlOrder
		)?.use { cursor ->
			val idCol = cursor.getColumnIndexOrThrow(MediaStore.Images.Media._ID)
			val dataCol = cursor.getColumnIndexOrThrow(MediaStore.Images.Media.DATA)
			val sizeCol  = cursor.getColumnIndexOrThrow(MediaStore.Images.Media.SIZE)
			val dateCol  = cursor.getColumnIndexOrThrow(MediaStore.Images.Media.DATE_MODIFIED)
			val resolutionCol  = cursor.getColumnIndexOrThrow(MediaStore.Images.Media.RESOLUTION)

			while (cursor.moveToNext()) {
				val data = cursor.getString(dataCol) ?: continue

				// Fast-skip: all files under a known subdirectory are grouped together
				// when the cursor is sorted by DATA, so one prefix check eliminates them all.
				if (lastDirPrefix != null && data.startsWith(lastDirPrefix)) continue

				val relative = data.removePrefix(prefix)
				val slashIdx = relative.indexOf('/')

				// Direct image child of this directory
				if (slashIdx == -1) {
					if (relative.isNotEmpty() && IMAGE_EXTENSIONS.contains(relative.substringAfterLast('.').lowercase())) {
						val id = cursor.getLong(idCol)
						val size = cursor.getLong(sizeCol)
						val date = cursor.getLong(dateCol)
						val resolution = cursor.getString(resolutionCol)

						try {
							imageMap.putIfAbsent(relative, FileItem(relative, id.toString(), false, size, resolution, date))
						}
						catch (e: Exception) {
							e.printStackTrace()
						}
					}
				}
				else {
					// First file seen inside a new subdirectory
					val dirName = relative.take(slashIdx)
					val dirPath = "$prefix$dirName"
					if (dirMap.putIfAbsent(dirName, FileItem(dirName, dirPath, isDirectory = true)) == null) {
						lastDirPrefix = "$dirPath/"
					}
				}
			}
		}

		// Combine: directories first, then images
		val result = ArrayList<FileItem>(dirMap.size + imageMap.size)
		result.addAll(dirMap.values)
		result.addAll(imageMap.values)

		// Name-based sorts (AZ / ZA) need no further work — insertion order already
		// matches the SQL ORDER BY DATA. Date-based sorts only need a dirs-first pass
		// since DATE_MODIFIED ordering doesn't separate dirs from images.
		when (sortBy) {
			SortBy.NEWEST -> result.sortWith(compareBy<FileItem> { !it.isDirectory }.thenByDescending { it.date })
			SortBy.OLDEST -> result.sortWith(compareBy<FileItem> { !it.isDirectory }.thenBy { it.date })
		}

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
