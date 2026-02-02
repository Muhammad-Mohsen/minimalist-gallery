// object structure
// Todo: { id: number, text: string, isDone: bool, labels: number[], order: number }
// Label: { id: number, text: string, color: string }

const Repository = (() => {

	let _db;
	async function db() {
		_db ||= await FluentDB('todoDB', 1)
			// .objectStore('labels', { keyPath: 'id' })
			.objectStore('todos', { keyPath: 'id' })
			.open();

		return _db;
	}

	function Store(name) {
		return {
			select: async (id) => (await db()).select(name, id),
			selectAll: async () => (await db()).selectAll(name),
			upsert: async (items) => (await db()).upsert(name, items),
			delete : async (ids) => (await db()).delete(name, ids),
		}
	}

	const Todos = Store('todos');
	const Labels = (() => {
		const key = 'labels';

		function upsert(labels) {
			localStorage.setItem(key, JSON.stringify(labels));
		}
		function selectAll() {
			return JSON.tryParse(localStorage.getItem(key)) || [];
		}

		return {
			upsert,
			selectAll
		}

	})();

	return {
		Todos,
		Labels
	}

})();
