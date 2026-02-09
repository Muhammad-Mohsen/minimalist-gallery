package com.minimalist.gallery.foundation

import android.webkit.JavascriptInterface
import android.webkit.WebView
import org.json.JSONObject
import java.lang.ref.WeakReference

/**
 * Created by muhammad.mohsen on 2/10/2019.
 * Inspired by the EventBus library, this is designed to send messages to the app components (service/UI/notification)
 * that need to be updated when various events occur
 */
object EventBus {

	private val subscribers = ArrayList<WeakReference<Subscriber>>()
	private var ipc: WeakReference<WebView>? = null

	fun subscribe(subscriber: Subscriber) {
		val ref = WeakReference(subscriber)
		subscribers.add(ref)
	}
	fun subscribe(subscriber: WebView) {
		ipc = WeakReference(subscriber)
	}
	fun release() {
		subscribers.clear()
		ipc = null
	}

	fun dispatch(event: Event) {
		subscribers.forEach { sub -> sub.get()?.handle(event) }

		val eventJSON = JSONObject(mapOf(
			"type" to event.type,
			"target" to event.target,
			"data" to event.data
		)).toString()

		// hopefully this avoids buffer reallocations
		val script = StringBuilder(eventJSON.length + 152)
			.append("window.evt = ")
			.append(eventJSON)
			.append("; try { EventBus.dispatch(evt, 'fromNative') } catch (e) { console.log(e.stack, JSON.stringify(evt)); }")
			.toString()

		DispatchQueue.MAIN.post {
			ipc?.get()?.evaluateJavascript(script, null)
		}
	}

	@JavascriptInterface
	fun dispatch(serializedEvent: String) {
		val jsonEvent = JSONObject(serializedEvent)
		val type = jsonEvent.get("type").toString()
		val target = jsonEvent.get("target").toString()
		val data = if (jsonEvent.has("data")) jsonEvent.get("data") as JSONObject else null

		subscribers.forEach { sub -> sub.get()?.handle(Event(type, target, data?.toMap() ?: emptyMap())) }
	}

	interface Subscriber {
		fun handle(event: Event)
	}

	class Event(val type: String, val target: String, val data: Map<String, Any> = emptyMap())

	object Type {
		const val BACK = "back"
		const val REQUEST_PERMISSION = "requestPermission"
		const val MODE_CHANGE = "modeChange"
		const val LIST_DIR = "listDir"
	}

	object Target {
		const val ACTIVITY = "activity"
	}
}
