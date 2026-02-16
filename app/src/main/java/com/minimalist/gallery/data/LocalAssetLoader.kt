package com.minimalist.gallery.data

import android.content.Context
import android.graphics.Bitmap
import android.net.Uri
import android.webkit.WebResourceResponse
import androidx.webkit.WebViewAssetLoader
import com.bumptech.glide.Glide
import java.io.ByteArrayInputStream
import java.io.ByteArrayOutputStream
import java.io.File
import java.io.FileInputStream

class LocalAssetLoader(context: Context) {

	private val loader = WebViewAssetLoader.Builder()
		.addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(context))
		.addPathHandler("/thumbnail/", GlideThumbnailPathHandler(context))
		.addPathHandler("/file/", LocalFilePathHandler())
		.addPathHandler("/", LocalFilePathHandler())
		.build()

	fun shouldInterceptRequest(uri: Uri): WebResourceResponse? {
		return loader.shouldInterceptRequest(uri)
	}

	// THUMBNAILS
	private class GlideThumbnailPathHandler(private val context: Context) : WebViewAssetLoader.PathHandler {
		override fun handle(path: String): WebResourceResponse? {
			val file = File("/$path")
			if (!file.exists()) return null

			return try {
				val bitmap = Glide.with(context)
					.asBitmap()
					.load(file)
					.submit(256, 256)
					.get()

				val stream = ByteArrayOutputStream()
				bitmap.compress(Bitmap.CompressFormat.JPEG, 80, stream)
				WebResourceResponse("image/jpeg", "UTF-8", ByteArrayInputStream(stream.toByteArray()))

			}
			catch (e: Exception) {
				e.printStackTrace()
				null
			}
		}
	}

	// IMAGES
	private class LocalFilePathHandler() : WebViewAssetLoader.PathHandler {
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
