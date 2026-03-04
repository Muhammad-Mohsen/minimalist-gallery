package com.minimalist.gallery.data

import android.content.ContentUris
import android.content.Context
import android.graphics.Bitmap
import android.net.Uri
import android.provider.MediaStore
import android.webkit.WebResourceResponse
import androidx.webkit.WebViewAssetLoader
import java.io.ByteArrayInputStream
import java.io.ByteArrayOutputStream


class LocalAssetLoader(context: Context) {

	private val loader = WebViewAssetLoader.Builder()
		.addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(context))
		.addPathHandler("/thumbnail/", MediaStoreThumbnailPathHandler(context))
		.addPathHandler("/image/", LocalImagePathHandler(context))
		.build()

	fun shouldInterceptRequest(uri: Uri): WebResourceResponse? {
		return loader.shouldInterceptRequest(uri)
	}

	// THUMBNAILS
	private class MediaStoreThumbnailPathHandler(private val context: Context) : WebViewAssetLoader.PathHandler {
		override fun handle(path: String): WebResourceResponse {
			try {
				@Suppress("DEPRECATION")
				val thumbnail = MediaStore.Images.Thumbnails.getThumbnail(
					context.contentResolver, path.toLong(), MediaStore.Images.Thumbnails.MINI_KIND, null
				)
				val stream = ByteArrayOutputStream()
				thumbnail.compress(Bitmap.CompressFormat.JPEG, 80, stream)
				return WebResourceResponse("image/jpeg", "UTF-8", ByteArrayInputStream(stream.toByteArray()))
			}
			catch (e: Exception) {
				e.printStackTrace()
				return WebResourceResponse("text/plain", "UTF-8", null)
			}
		}
	}

	// IMAGES
	private class LocalImagePathHandler(private val context: Context) : WebViewAssetLoader.PathHandler {
		override fun handle(path: String): WebResourceResponse {
			return try {
				val contentUri = ContentUris.withAppendedId(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, path.toLong())

				WebResourceResponse(
					context.contentResolver.getType(contentUri),
					"UTF-8",
					context.contentResolver.openInputStream(contentUri)
				)
			}
			catch (e: Exception) {
				e.printStackTrace()
				WebResourceResponse("text/plain", "UTF-8", null)
			}
		}
	}
}
