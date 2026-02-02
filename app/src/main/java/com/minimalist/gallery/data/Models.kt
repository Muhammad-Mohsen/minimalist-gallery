package com.minimalist.music.data.files

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.os.Build
import android.os.Environment
import android.os.storage.StorageManager
import android.util.Base64
import androidx.annotation.RequiresApi
import com.minimalist.gallery.data.Const
import com.minimalist.gallery.data.state.State
import com.minimalist.gallery.foundation.ext.EMPTY
import org.json.JSONObject
import wseemann.media.FFmpegMediaMetadataRetriever
import java.io.File
import java.util.Arrays
import java.util.regex.Pattern


/**
 * Created by muhammad.mohsen on 4/15/2017.
 */

/**
 * file helpers
 */
val ROOT: String = Environment.getExternalStorageDirectory().path // root directory (actually the internal storage directory!)

val EXTENSIONS = listOf("jpg", "jpeg", "jpe", "jfif", "png", "gif", "bmp", "webp", "heic", "heif", "tiff", "tif", "svg", "svgz", "ico")

fun File?.isRoot(): Boolean {
	return (this?.absolutePath?.filter { it == '/' }?.length ?: 1) <= 1
}
fun File.isTrack(): Boolean {
	return this.exists() && EXTENSIONS.contains(this.extension.lowercase())
}
fun File.listFiles(sortBy: String): ArrayList<File> {
	val fileModels = ArrayList<File>()

	var files = listFiles { file ->
		file.isDirectory || EXTENSIONS.contains(file.extension)
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
	val context = State.applicationContext

	val storageManager = context.getSystemService(Context.STORAGE_SERVICE) as StorageManager
	return ArrayList(storageManager.storageVolumes.mapNotNull {
		// leaving this as is, causes a minor navigation problem...we end up with the breadcrumbs looking like storage/0/0 when navigating
		if (it.directory?.absolutePath == "/storage/emulated/0") File("/storage/emulated")
		else it.directory

	}).toTypedArray()
}

class SerializableBitmap(val data: ByteArray?) {
	val decoded: Bitmap? = try { BitmapFactory.decodeByteArray(data, 0, data?.size ?: 0) }
	catch (_: Exception) { null }
	val encoded: String? = try { Base64.encodeToString(data, Base64.DEFAULT) } // from the field: threw an OutOfMemory exception
	catch (_: Exception) { null }
}

object Theme {
	const val DARK = "dark"
	const val LIGHT = "light"
}

object SortBy {
	const val AZ = "az"
	const val ZA = "za"
	const val NEWEST = "newest"
	const val OLDEST = "oldest"
}

// not sure if I need this right now!
// defines the explorer recycler view adapter view types
// also used to determine the interaction (click, long click) source
object ItemType {
	const val DIRECTORY = 0
	const val TRACK = 1
	const val CRUMB = 2
}