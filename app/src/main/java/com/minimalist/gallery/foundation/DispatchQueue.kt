package com.minimalist.gallery.foundation

import android.os.Handler
import android.os.HandlerThread
import android.os.Looper

object DispatchQueue {
	private val bgHandlerThread = HandlerThread("bg").apply {
		start()
	}
	val BG = Handler(bgHandlerThread.looper)

	val MAIN = Handler(Looper.getMainLooper())
}
