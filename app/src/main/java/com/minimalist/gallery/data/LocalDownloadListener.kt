package com.minimalist.gallery.data

import android.webkit.DownloadListener
import android.util.Base64

class LocalDownloadListener(private val onImageReady: (ByteArray) -> Unit) : DownloadListener {
	override fun onDownloadStart(
		url: String?,
		userAgent: String?,
		contentDisposition: String?,
		mimetype: String?,
		contentLength: Long
	) {
		try {
			val base64Data = url?.substringAfter("base64,") ?: return
			val imageBytes = Base64.decode(base64Data, Base64.DEFAULT)
			onImageReady(imageBytes)

		} catch (e: Exception) {
			e.printStackTrace()
		}
	}
}
