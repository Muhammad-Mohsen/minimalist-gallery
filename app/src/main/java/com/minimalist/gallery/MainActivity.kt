package com.minimalist.gallery

import android.Manifest
import android.annotation.SuppressLint
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Bundle
import android.provider.Settings
import android.view.PixelCopy
import android.view.View
import android.view.ViewGroup
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.widget.ImageView
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.graphics.createBitmap
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import com.minimalist.gallery.data.FileSystem
import com.minimalist.gallery.data.LocalAssetLoader
import com.minimalist.gallery.data.SortBy
import com.minimalist.gallery.data.State
import com.minimalist.gallery.foundation.DispatchQueue
import com.minimalist.gallery.data.EXTERNAL_STORAGE_PATH
import com.minimalist.gallery.foundation.EventBus
import com.minimalist.gallery.foundation.EventBus.Event
import com.minimalist.gallery.foundation.EventBus.Target
import com.minimalist.gallery.foundation.EventBus.Type

class MainActivity : AppCompatActivity(), EventBus.Subscriber {
	private var webView: WebView? = null
	private lateinit var mask: ImageView

	/* LIFECYCLE */
	override fun onCreate(savedInstanceState: Bundle?) {
		setTheme(R.style.AppTheme) // change from splash screen (android 11-)

		super.onCreate(savedInstanceState)
		WindowCompat.setDecorFitsSystemWindows(window, false) // edge-to-edge (android 14-)
		setContentView(R.layout.main_activity)

		webView = findViewById(R.id.webview)
		mask = findViewById(R.id.mask) // to hide the webview flash when resuming

		handleBackPress()
		EventBus.subscribe(this)
		State.init(applicationContext)
		initWebView()
	}
	override fun onResume() {
		super.onResume()

		if (checkSelfPermission(DISK_PERMISSION) != PackageManager.PERMISSION_GRANTED) {
			State.path = PERMISSION_PATH
			dispatchListFiles()
		}
		else if (State.path == PERMISSION_PATH) {
			State.path = EXTERNAL_STORAGE_PATH
			dispatchListFiles()
		}

		DispatchQueue.MAIN.postDelayed({
			mask.visibility = View.GONE
		}, 200)
	}
	override fun onPause() {
		super.onPause()

		webView?.let { wv ->
			try {
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
			catch (e: Exception) {
				e.printStackTrace()
			}
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

	/* INIT */
	@SuppressLint("SetJavaScriptEnabled")
	private fun initWebView() {
		WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG)

		webView?.apply {
			// resizing to account for IME
			ViewCompat.setOnApplyWindowInsetsListener(this) { v, windowInsets ->
				val insets = windowInsets.getInsets(WindowInsetsCompat.Type.ime() or WindowInsetsCompat.Type.systemBars())
				val params = v.layoutParams as ViewGroup.MarginLayoutParams

				params.topMargin = insets.top
				params.bottomMargin = insets.bottom
				v.layoutParams = params

				WindowInsetsCompat.CONSUMED
			}

			settings.apply {
				javaScriptEnabled = true
				domStorageEnabled = true
				allowFileAccess = true // Needed for some internal things, but we use AssetLoader for main content
			}

			val assetLoader = LocalAssetLoader(this@MainActivity)
			webViewClient = object : android.webkit.WebViewClient() {
				override fun shouldInterceptRequest(view: WebView, request: android.webkit.WebResourceRequest): WebResourceResponse? {
					return assetLoader.shouldInterceptRequest(request.url)
				}
			}

			addJavascriptInterface(EventBus, "IPC")
			EventBus.subscribe(this) // this is the webview

			val path = "path=${if (checkSelfPermission(DISK_PERMISSION) == PackageManager.PERMISSION_GRANTED) State.path else PERMISSION_PATH}"
			val sort = "sort=${State.sort}"

			loadUrl("https://appassets.androidplatform.net/assets/index.html?$path&$sort")
		}
	}

	/* EVENT BUS */
	override fun handle(event: Event) {
		if (event.target == Target.NATIVE) return

		when (event.type) {
			Type.REQUEST_PERMISSION -> requestPermission()
			Type.BACK -> dispatchBack()
			Type.LIST_FILES -> {
				State.path = event.data["path"] as? String ?: EXTERNAL_STORAGE_PATH
				dispatchListFiles(event.data["force"] as? Boolean ?: false)
			}
			Type.SORT_BY -> {
				State.sort = event.data["sort"] as? String ?: SortBy.AZ
				dispatchListFiles(true)
			}
		}
	}

	/* BACK PRESS */
	private fun handleBackPress() {
		onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
			override fun handleOnBackPressed() {
				EventBus.dispatch(Event(Type.BACK, Target.NATIVE))
				// dispatchBack()
			}
		})
	}

	/* PERMISSIONS */
	private val permissionRequest = registerForActivityResult(ActivityResultContracts.RequestPermission()) { isGranted: Boolean ->
		if (!isGranted) return@registerForActivityResult
		dispatchListFiles()
	}
	private fun requestPermission() {
		if (shouldShowRequestPermissionRationale(DISK_PERMISSION)) {
			val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
				data = Uri.fromParts("package", packageName, null)
			}
			startActivity(intent)
		}
		else permissionRequest.launch(DISK_PERMISSION)
	}

	/* UTILS */
	private fun dispatchListFiles(forceRefresh: Boolean = false) {
		DispatchQueue.BG.post {
			val items = FileSystem.listFiles(applicationContext, State.path, State.sort, forceRefresh)
			val data = mapOf(
				"path" to State.path,
				"items" to items.map { it.toMap() },
				"force" to forceRefresh
			)

			EventBus.dispatch(Event(Type.LIST_FILES, Target.NATIVE, data))
		}
	}
	private fun dispatchBack() {
		val parent = State.path.substringBeforeLast('/', "")

		if (parent.isEmpty()) {
			moveTaskToBack(true)
		} else {
			State.path = parent
			dispatchListFiles()
		}
	}

	companion object {
		private val DISK_PERMISSION = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU) Manifest.permission.READ_MEDIA_IMAGES
		else Manifest.permission.READ_EXTERNAL_STORAGE

		private const val PERMISSION_PATH = "<permission>"
	}
}
