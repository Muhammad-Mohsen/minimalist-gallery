package com.minimalist.gallery.data

import android.annotation.SuppressLint
import android.content.Context
import android.content.SharedPreferences
import com.minimalist.gallery.foundation.put

@SuppressLint("StaticFieldLeak")
object State {
	private lateinit var preferences: SharedPreferences
	lateinit var applicationContext: Context

	fun init(context: Context) {
		applicationContext = context
		preferences = context.getSharedPreferences(context.packageName, Context.MODE_PRIVATE)
	}

	private var _path: String? = null
	var path: String
		get() {
			if (_path == null) _path = preferences.getString(Key.PATH, null) ?: "/"
			return _path!!
		}
		set(value) {
			preferences.put(Key.PATH, value)
			_path = value
		}

	var image: String = ""

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
	const val PATH = "path"
	const val SORT = "sort"
}
