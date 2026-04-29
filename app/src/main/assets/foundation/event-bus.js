class EventBus {

	// the event `type`
	static Type = {
		BACK: 'back',
		REQUEST_PERMISSION: 'requestPermission',
		LIST_FILES: 'listFiles',
		SORT_BY: 'sortBy',
	};

	// the event `target` (read: source)
	static Target = {
		JS: 'js',
		NATIVE: 'native',
	};

	static subscribers = []; // a regular ol' array will do

	static subscribe(sub) { this.subscribers.push(sub); }
	static unsubscribe(sub) { this.subscribers = this.subscribers.filter(s => s != sub); } // never gonna happen

	/**
	 * @param {{ type: EventBus.type, target: EventBus.target, data?: any }} event - The event object.
	 */
	static dispatch(event, native = false) {
		this.subscribers.forEach(callback => callback(event, native));
		if (!native) window.IPC?.dispatch(JSON.stringify(event));
	}
}
