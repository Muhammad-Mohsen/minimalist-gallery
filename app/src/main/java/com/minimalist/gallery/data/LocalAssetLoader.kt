package com.minimalist.gallery.data

import android.content.ContentUris
import android.content.Context
import android.graphics.Bitmap
import android.net.Uri
import android.os.Build
import android.provider.MediaStore
import android.util.Size
import android.webkit.WebResourceResponse
import androidx.webkit.WebViewAssetLoader
import java.io.ByteArrayInputStream
import java.io.ByteArrayOutputStream
import java.io.File
import java.io.FileInputStream

class LocalAssetLoader(context: Context) {

	private val loader = WebViewAssetLoader.Builder()
		.addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(context))
		.addPathHandler("/thumbnail/", MediaStoreThumbnailPathHandler(context))
		.addPathHandler("/file/", LocalFilePathHandler())
		.addPathHandler("/", LocalFilePathHandler())
		.build()

	fun shouldInterceptRequest(uri: Uri): WebResourceResponse? {
		return loader.shouldInterceptRequest(uri)
	}

	// THUMBNAILS
	private class MediaStoreThumbnailPathHandler(private val context: Context) : WebViewAssetLoader.PathHandler {
		override fun handle(path: String): WebResourceResponse? {
			val file = File("/$path")
			if (!file.exists()) return null

			val bitmap = getThumbnail(file) ?: return null

			return try {
				val stream = ByteArrayOutputStream()
				bitmap.compress(Bitmap.CompressFormat.JPEG, 80, stream)
				WebResourceResponse("image/jpeg", "UTF-8", ByteArrayInputStream(stream.toByteArray()))
			} catch (e: Exception) {
				e.printStackTrace()
				null
			}
		}

		private fun getThumbnail(file: File): Bitmap? {
			val cursor = context.contentResolver.query(
				MediaStore.Images.Media.EXTERNAL_CONTENT_URI,
				arrayOf(MediaStore.Images.Media._ID),
				"${MediaStore.Images.Media.DATA} = ?",
				arrayOf(file.absolutePath),
				null
			)

			cursor?.use {
				if (it.moveToFirst()) {
					val id = it.getLong(0)
					val uri = ContentUris.withAppendedId(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, id)
					return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
						try { context.contentResolver.loadThumbnail(uri, Size(256, 256), null) }
						catch (e: Exception) { null }
					} else {
						@Suppress("DEPRECATION")
						MediaStore.Images.Thumbnails.getThumbnail(
							context.contentResolver, id, MediaStore.Images.Thumbnails.MINI_KIND, null
						)
					}
				}
			}
			return null
		}
	}

	// IMAGES
	private class LocalFilePathHandler : WebViewAssetLoader.PathHandler {
		override fun handle(path: String): WebResourceResponse? {
			val file = File("/$path")
			if (!file.exists()) return null
			return try {
				WebResourceResponse("image/*", "UTF-8", FileInputStream(file))
			} catch (e: Exception) {
				e.printStackTrace()
				null
			}
		}
	}
}
