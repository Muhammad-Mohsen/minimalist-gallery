package com.minimalist.gallery.data

import android.annotation.SuppressLint
import android.content.Context
import android.content.SharedPreferences
import com.minimalist.gallery.foundation.put
import java.io.File

@SuppressLint("StaticFieldLeak")
object State {
	private lateinit var preferences: SharedPreferences
	lateinit var applicationContext: Context

	fun init(context: Context) {
		applicationContext = context
		preferences = context.getSharedPreferences(context.packageName, Context.MODE_PRIVATE)
	}

	private var _currentDir: File? = null
	var currentDir: File
		get() {
			if (_currentDir == null) {
				val savedPath = preferences.getString(Key.DIRECTORY, null) ?: "/"
				val savedFile = File(savedPath)
				// double check the file (it could've been removed, or that the SD card is unmounted!)
				_currentDir = if (savedFile.exists()) savedFile else File("/")
			}

			return _currentDir!!
		}
		set(value) {
			_currentDir = value
			preferences.put(Key.DIRECTORY, value.absolutePath)
		}

	private var _sort: String? = null
	var sort: String
		get() {
			if (_sort == null) _sort = preferences.getString(Key.SORT, SortBy.AZ)
			return _sort!!
		}
		set(value) {
			_sort = value
			preferences.put(Key.SORT, value)
		}
}

object SortBy {
	const val AZ = "az"
	const val ZA = "za"
	const val NEWEST = "newest"
	const val OLDEST = "oldest"
}

object Key {
	const val DIRECTORY = "directory"
	const val SORT = "sort"
}