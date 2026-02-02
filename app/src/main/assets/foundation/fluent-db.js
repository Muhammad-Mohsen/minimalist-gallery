/**
 * constructor function for an IndexedDB database.
 * @type {FluentDB}
 * @param {string} name The name of the database.
 * @param {number} version The version of the database.
 */
function FluentDB(name, version) {

	/**
	 * The current count of the store indexes.
	 * this is used to match the object store with its index declarations.
	 */
	let storeIndex = 0;

	/**
	 * @type {FluentStore[]}
	 * An array of store objects.
	 */
	const stores = [];

	/**
	 * Creates a new object store.
	 *
	 * @param {string} name The name of the object store.
	 * @param {IDBObjectStoreParameters} options The options for the object store.
	 * @returns {FluentDB} This instance of FluentDB.
	 */
	function objectStore(name, options) {
		stores.push({ name, options });
		storeIndex++;

		return this;
	}

	/**
	 * Creates a new index in the current object store.
	 *
	 * @param {string} indexName The name of the index.
	 * @param {string} propName The name of the property to index.
	 * @param {IDBIndexParameters} options The options for the index.
	 * @returns {FluentDB} This instance of FluentDB.
	 */
	function withIndex(indexName, propName, options) {
		stores[storeIndex].indices
			? stores[storeIndex].indices.push({ indexName, propName, options })
			: stores[storeIndex].indices = [{ indexName, propName, options }];

		return this;
	}

	/**
	 * Creates/Opens the database.
	 *
	 * @returns {Promise<IDBDatabase>} A promise that resolves to the database object.
	 */
	function open() {
		return new Promise((resolve, reject) => {
			const dbRequest = indexedDB.open(name, version);
			dbRequest.onerror = (event) => reject(event);
			dbRequest.onsuccess = () => {
				if (dbRequest.readyState == 'done') return resolve(dbRequest.result);
			};

			dbRequest.onupgradeneeded = event => {
				const db = event.target.result;

				stores.forEach(s => {
					const store = db.createObjectStore(s.name, s.options);

					if (!s.indices?.length) return;
					s.indices.forEach(i => store.createIndex(i.name, i.prop, i.options));
				});
			};
		});
	}

	return {
		objectStore,
		withIndex,
		open
	}

};

IDBDatabase.prototype.select = function (store, key) {
	return new Promise((resolve, reject) => {
		const transaction = this.transaction([store]);
		const objectStore = transaction.objectStore(store);

		const request = objectStore.get(key);
		transaction.oncomplete = (event) => resolve(request.result, event);
		transaction.onerror = (event) => reject(event);
	});
}

IDBDatabase.prototype.selectAll = function (store) {
	return new Promise((resolve, reject) => {
		const objectStore = this.transaction(store).objectStore(store);
		objectStore.getAll().onsuccess = (event) => {
			resolve(event.target.result);
		};
	});
}

IDBDatabase.prototype.upsert = function (store, objects) {
	return new Promise((resolve, reject) => {
		const transaction = this.transaction([store], 'readwrite');
		const objectStore = transaction.objectStore(store);

		if (!Array.isArray(objects)) objects = [objects];
		objects.forEach(o => objectStore.put(o));
		transaction.oncomplete = (event) => resolve(event);
		transaction.onerror = (event) => reject(event);
	});
}

IDBDatabase.prototype.delete = function (store, keys) {
	return new Promise((resolve, reject) => {
		const transaction = this.transaction([store], 'readwrite');
		const objectStore = transaction.objectStore(store);

		if (!Array.isArray(keys)) keys = [keys];
		keys.forEach(k => objectStore.delete(k));
		transaction.oncomplete = (event) => resolve(event);
		transaction.onerror = (event) => reject(event);
	});
}
