class TodoDialog extends HTMLElement {

	constructor() { super(); }

	connectedCallback() {
		this.setAttribute('inert', 'true');
	}

	async open(id) {
		this.labels = Repository.Labels.selectAll();
		this.todo = id
			? await Repository.Todos.select(id)
			: { id: this.#id(), text: '', labels: [] };

		this.innerHTML = this.render();

		this.setAttribute('open', '');
		this.removeAttribute('inert');
	}
	isOpen() {
		return this.hasAttribute('open');
	}
	back(notify) {
		// close the thing
		this.setAttribute('inert', 'true');
		this.removeAttribute('open');

		// dispatch close event
		if (notify) this.dispatchCustomEvent('close', this.todo);
	}
	saveAndClose() {
		// text
		this.todo.text = this.querySelector('#todoTextField').value.trim();

		if (!this.todo.text) return this.querySelector('#todoTextField').focus();

		// get the active labels
		this.todo.labels = this.querySelectorAll('.label[state="active"]')
			.toArray()
			.map(l => l.getAttribute('data-id'));


		// save it
		Repository.Todos.upsert(this.todo);

		this.back('notify');
	}

	toggleLabel(elem) {
		const newState = elem.state() ? '' : 'active';
		elem.state(newState);

		const color = elem.dataset.color;
		elem.style = `background: ${newState ? color : 'transparent'}; color: ${newState ? 'var(--bg)' : color}; border-color: ${color}`;
	}

	render() {
		const id = this.id;

		return `
			<h1>${this.todo.text ? 'EDIT TODO' : 'NEW TODO'}</h1>

			<section>
				<textarea id="todoTextField" placeholder="TODO: add a todo..." aria-required="true">${this.todo.text}</textarea>

				<div class="label-list">${this.labels.map(l => this.#labelHTML(l)).join('')}</div>
			</section>

			<footer>
				<button class="material-symbols-outlined undo fab secondary" onclick="${id}.back()">west</button>
				<button class="material-symbols-outlined fab green" onclick="${id}.saveAndClose()">check</button>
			</footer>
		`; // .minify(); // should not call minify as it removes the new lines in the actual todo item!!
	}

	#id() {
		return new Date().getTime();
	}
	#labelHTML(label) {
		const style = this.todo.labels.includes(label.id) // isActive
			? `style="color: var(--bg); background: ${label.color}; border-color: ${label.color}" state="active"`
			: `style="color: ${label.color}; background: transparent; border-color: ${label.color}" state=""`;

		return `<button class="label" ${style} data-color="${label.color}" data-id="${label.id}" onclick="${this.id}.toggleLabel(this)">${label.text}</button>`
	}
}

customElements.define('todo-dialog', TodoDialog);