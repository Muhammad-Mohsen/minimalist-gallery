var EventBus = (() => {

	// the event `type`
	const Type = {
		BACK: 'back',
		BACKUP: 'backup',
		RESTORE: 'restore',
	}

	// the event `target` (read: source)
	const Target = {
		LABEL_LIST: 'labelList',
		MAIN: 'main',
		ACTIVITY: 'activity',
	}

	const subscribers = []; // a regular ol' array will do

	function subscribe(sub) { subscribers.push(sub); }
	function unsubscribe(sub) { subscribers = subscribers.filter(s => s != sub); } // never gonna happen

	/**
	 * @param {{ type: EventBus.type, target: EventBus.target, data?: any }} event - The event object.
	 */
	function dispatch(event, native) {
		subscribers.forEach(callback => callback(event, native));
		if (!native) window.IPC?.dispatch(JSON.stringify(event));
	}

	return {
		Type,
		Target,

		subscribe,
		unsubscribe,

		dispatch,
	}

})();
