class TodoList extends HTMLElement {

	async connectedCallback() {
		this.labels = Repository.Labels.selectAll();
		this.todos = await Repository.Todos.selectAll();

		this.classList.toggle('empty', !this.todos.length);
		this.render();
	}

	async toggleItem(event, id) {
		const todo = this.todos.find(td => td.id == id);
		todo.isDone = !todo.isDone;

		event.currentTarget.dataset.isdone = todo.isDone;
		event.currentTarget.querySelector('.content').classList.toggle('done'); // currentTarget will be null after the await

		await Repository.Todos.upsert(todo);
	}
	confirmDelete(event, id) {
		event.stopPropagation();

		this.dialog.querySelector('button[confirm]').onclick = () => this.deleteItem(event, id);
		this.dialog.show();
	}
	async deleteItem(event, id) {
		await Repository.Todos.delete([id]);
		this.todos = this.todos.filter(td => td.id != id);

		const element = event.target.closest('.item');
		element.classList.add('hidden');
		setTimeout(() => {
			element.remove();
			this.classList.toggle('empty', !this.todos.length);
		}, 250);
	}
	editItem(event, id) {
		event.stopPropagation();

		todoDialog.open(id);
		const element = event.target.closest('.item');
		element.scroll(0, 0);
	}

	isMoving() {
		return !!this.moveItemSource;
	}
	moveItemStart(event, id) {
		event.stopPropagation();
		const element = event.target.closest('.item');
		element.scroll(0, 0);

		const type = event.target.innerHTML == 'unfold_more' ? 'move' : 'cancel';

		// CANCEL
		if (type == 'cancel') return this.moveItemCancel();

		// START
		const template = `<div class="move-target" onclick="${this.id}.moveItemComplete(event, '${id}')"><i class="material-symbols-outlined">arrow_circle_right</i>Move here</div>`;
		this.querySelectorAll('.item').forEach(item => item.insertAdjacentHTML('beforebegin', template));
		this.insertAdjacentHTML('beforeend', template);

		// remove the ones before and after the move source
		element.nextElementSibling.remove();
		element.previousElementSibling.remove();

		// show the move targets
		this.querySelectorAll('.move-target').forEach(target => setTimeout(() => target.classList.add('show')));

		// cancel move option
		event.target.innerHTML = 'close';

		// mark the element as the move-source
		element.classList.add('move-source');
		this.moveItemSource = { id, element };
	}
	moveItemComplete(event, id) {
		const source = this.moveItemSource;

		event.target.insertAdjacentElement('beforebegin', source.element); // rearrange the elements
		this.moveItemCancel(); // remove the move targets
		this.updateItemOrder(); // update the DB
	}
	moveItemCancel() {
		this.querySelector('.move-source .material-symbols-outlined.move').innerHTML = 'unfold_more';
		this.querySelector('.move-source').classList.remove('move-source');
		this.moveItemSource = null;

		this.querySelectorAll('.move-target').forEach(target => {
			setTimeout(() => target.classList.remove('show'));
			setTimeout(() => target.remove(), 250);
		});
	}

	updateItemOrder() {
		const orders = this.querySelectorAll('.item').toArray().reduce((orders, elem, i) => {
			orders[elem.dataset.id] = i;
			return orders;
		}, {});

		this.todos = this.todos.map(td => {
			td.order = orders[td.id];
			return td;
		});
		Repository.Todos.upsert(this.todos);
	}

	onFiltersChanged(event) {
		const data = event.detail;
		this.querySelectorAll('.item').toArray().forEach(td => {
			const doneGood = data.done == 'all'
				|| data.done == 'done' && td.dataset.isdone == 'true'
				|| data.done == 'notdone' && td.dataset.isdone != 'true';

			const labelGood = !data.filters.length || data.filters.reduce((a, b) => a ||= td.dataset.labels.includes(b), false);

			td.classList.toggle('hidden', !(doneGood && labelGood));
		});
	}

	render() {
		const id = this.id;

		this.innerHTML = `
			${this.todos.sort((a, b) => a.order - b.order).map(td => `
				<div class="item" onclick="${id}.toggleItem(event, ${td.id})" data-id="${td.id}" data-isDone="${td.isDone}" data-labels="${td.labels}">
					<div class="content ${td.isDone ? 'done' : ''}">
						<i class="material-symbols-outlined undone-marker">circle</i>
						<i class="material-symbols-outlined done-marker done">task_alt</i>
						<span>${td.text.replace(/\n/g, '<br>')}</span>
						<div class="labels">
							${td.labels.map(id => {
								const l = this.#labelById(id);
								if (!l) return '';
								return `<div class="pill" style="background: ${l.color}"></div>`;
							}).join('')}
						</div>
					</div>
					<div class="actions">
						<button class="material-symbols-outlined action fab move" onclick="${id}.moveItemStart(event, ${td.id});">unfold_more</button>
						<button class="material-symbols-outlined action fab" onclick="${id}.editItem(event, ${td.id});">edit</button>
						<button class="material-symbols-outlined action fab red" onclick="${id}.confirmDelete(event, ${td.id});">delete</button>
					</div>
				</div>
			`).join('')}

			<modal-dialog>
				<slot title>Confirm Delete</slot>
				<slot content>Are you sure you want to delete this todo?</slot>
				<slot buttons>
					<button cancel>NO</button>
					<button confirm>YES</button>
				</slot>
			</modal-dialog>
		`.minify();

		this.dialog = this.querySelector('modal-dialog');
	}

	#labelById(id) {
		return this.labels.find(l => l.id == id);
	}
}

customElements.define('todo-list', TodoList);