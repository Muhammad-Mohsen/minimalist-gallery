package com.minimalist.gallery

import android.annotation.SuppressLint
import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.view.PixelCopy
import android.view.View
import android.view.ViewGroup
import android.webkit.WebView
import android.widget.ImageView
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.graphics.createBitmap
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import com.minimalist.gallery.foundation.EventBus
import com.minimalist.gallery.foundation.EventBus.Event
import com.minimalist.gallery.foundation.EventBus.Target
import com.minimalist.gallery.foundation.EventBus.Type
import com.minimalist.gallery.foundation.Moirai
import java.io.IOException

class MainActivity : AppCompatActivity(), EventBus.Subscriber {

	private val DISK_PERMISSION = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU) Manifest.permission.READ_MEDIA_IMAGES
	else Manifest.permission.READ_EXTERNAL_STORAGE

	private var webView: WebView? = null
	private lateinit var mask: ImageView

	override fun onCreate(savedInstanceState: Bundle?) {
		setTheme(R.style.AppTheme) // change from splash screen (android 11-)

		super.onCreate(savedInstanceState)
		WindowCompat.setDecorFitsSystemWindows(window, false) // edge-to-edge (android 14-)
		setContentView(R.layout.main_activity)

		webView = findViewById<WebView>(R.id.webview)
		mask = findViewById<ImageView>(R.id.mask) // to hide the webview flash when resuming

		handleBackPress()
		EventBus.subscribe(this)
		initWebView()
	}

	override fun onResume() {
		super.onResume()

		EventBus.dispatch(Event(Type.PERMISSION_RESPONSE, Target.ACTIVITY, mapOf("mode" to
				if (checkSelfPermission(DISK_PERMISSION) == PackageManager.PERMISSION_GRANTED) "normal" else "permission")))

		DispatchQueue.MAIN.postDelayed({
			mask.visibility = View.GONE
		}, 200)
	}

	override fun onPause() {
		super.onPause()

		webView?.let { wv ->
			val bitmap = createBitmap(wv.width, wv.height)

			PixelCopy.request(
				window,
				null,
				bitmap,
				{ copyResult ->
					if (copyResult == PixelCopy.SUCCESS) {
						mask.setImageBitmap(bitmap)
						mask.visibility = View.VISIBLE
					}
				},
				DispatchQueue.MAIN
			)
		}
	}

	override fun onDestroy() {
		super.onDestroy()

		EventBus.release()

		webView?.apply {
			val parent = this.parent
			(parent as ViewGroup).removeView(this)
			this.clearCache(true)
			this.destroy()
		}
		webView = null
	}

	@SuppressLint("SetJavaScriptEnabled")
	@Suppress("DEPRECATION")
	private fun initWebView() {
		WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG)

		webView?.apply {
			// resizing to account for IME
			ViewCompat.setOnApplyWindowInsetsListener(this) { v, windowInsets ->
				val insets = windowInsets.getInsets(WindowInsetsCompat.Type.ime() or WindowInsetsCompat.Type.navigationBars())
				val params = v.layoutParams as ViewGroup.MarginLayoutParams

				params.bottomMargin = insets.bottom
				v.layoutParams = params

				WindowInsetsCompat.CONSUMED
			}

			setBackgroundColor(resources.getColor(R.color.background))

			settings.apply {
				javaScriptEnabled = true
				domStorageEnabled = true
				allowFileAccessFromFileURLs = true
			}

			addJavascriptInterface(EventBus, "IPC")
			EventBus.subscribe(this) // this is the webview

			val mode = if (checkSelfPermission(DISK_PERMISSION) == PackageManager.PERMISSION_GRANTED) "normal" else "permission"
			loadUrl("file:///android_asset/index.html?mode=$mode") // here we go!
		}
	}

	private fun handleBackPress() {
		onBackPressedDispatchQueue.addCallback(object : OnBackPressedCallback(true) {
			override fun handleOnBackPressed() {
				EventBus.dispatch(Event(Type.BACK, Target.ACTIVITY))
			}
		})
	}

	// PERMISSIONS
	private val permissionRequest = registerForActivityResult(ActivityResultContracts.RequestPermission()) { isGranted: Boolean ->
		onPermissionResult(isGranted)
	}
	private fun requestPermission() {
		if (shouldShowRequestPermissionRationale(DISK_PERMISSION)) {
			val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
				data = Uri.fromParts("package", packageName, null)
			}
			startActivity(intent)

		} else permissionRequest.launch(DISK_PERMISSION)
	}
	private fun onPermissionResult(isGranted: Boolean) {
		if (isGranted) {
			initNative()
			EventBus.dispatch(Event(Type.MODE_CHANGE, Target.ACTIVITY, mapOf("mode" to "normal")))

		} else {
			EventBus.dispatch(Event(Type.MODE_CHANGE, Target.ACTIVITY, mapOf("mode" to "permission")))
		}
	}

	override fun handle(event: Event) {
		if (event.target == Target.ACTIVITY) return

		when (event.type) {
			Type.PERMISSION_REQUEST -> requestPermission()
			Type.BACK -> moveTaskToBack(true)
		}
	}
}
