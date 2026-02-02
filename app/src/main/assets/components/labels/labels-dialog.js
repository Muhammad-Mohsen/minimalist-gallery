class LabelsDialog extends HTMLElement {
	connectedCallback() {
		this.setAttribute('inert', 'true');
	}

	open() {
		this.labels = Repository.Labels.selectAll();
		this.render();

		this.setAttribute('open', '');
		this.removeAttribute('inert');
	}
	isOpen() {
		return this.hasAttribute('open');
	}
	saveAndClose() {
		// make sure to add whatever we got in the new entry row!
		this.add();

		// get the labels from the UI!
		const labels = this.querySelectorAll('.label-entry:not(.new)')
			.toArray()
			.map(l => ({
				id: l.getAttribute('data-id'),
				color: l.querySelector('[type="color"]').value,
				text: l.querySelector('[type="text"]').value
			}));

		// save em
		Repository.Labels.upsert(labels);

		// close the thing
		this.setAttribute('inert', 'true');
		this.removeAttribute('open');

		this.dispatchCustomEvent('close', this.todo);
	}

	add() {
		const color = this.querySelector('.label-entry.new [type="color"]');
		const text = this.querySelector('.label-entry.new [type="text"]');

		if (!text.value.trim()) return;

		const container = this.querySelector('section');
		container.insertAdjacentHTML('beforeend', this.#renderLabel({ id: this.#id(), color: color.value, text: text.value }, 'hidden'));
		setTimeout(() => container.querySelector('.label-entry:last-child').classList.remove('hidden'), 100);

		color.value = this.#randomColor();
		text.value = '';
	}
	confirmDelete(target) {
		this.deleteDialog.querySelector('button[confirm]').onclick = () => this.delete(target);
		this.deleteDialog.show();
	}
	delete(target) {
		target = target.parentElement;
		target.classList.add('hidden');
		setTimeout(() => target.remove(), 250);

		document.querySelector('todo-list').render();
		document.querySelector('label-list').render();
	}

	showColorPicker(event, target) {
		event.preventDefault();
		event.stopPropagation();

		this.colorPickerDialog.querySelector('color-picker').value = target.value;

		this.colorPickerDialog.show();
		this.colorPickerDialog.querySelector('button[confirm]').onclick = () => {
			target.value = this.colorPickerDialog.querySelector('color-picker').value;
		}
	}

	render() {
		const id = this.id;

		this.innerHTML = `
			<h1>LABELS</h1>
			<section>
				${this.labels.map(l => this.#renderLabel(l)).join('')}
			</section>

			<div class="label-entry new">
				<input type="color" value="${this.#randomColor()}" onclick="${id}.showColorPicker(event, this);">
				<input type="text" placeholder="Add Label">
				<button class="material-symbols-outlined fab mini" onclick="${id}.add();">add</button>
			</div>

			<footer>
				<button class="material-symbols-outlined fab green" onclick="${id}.saveAndClose()">check</button>
			</footer>

			<modal-dialog delete>
				<slot title>Confirm Delete</slot>
				<slot content>Are you sure you want to delete this label?</slot>
				<slot buttons>
					<button cancel>NO</button>
					<button confirm>YES</button>
				</slot>
			</modal-dialog>

			<modal-dialog color-picker>
				<slot title>Label Color</slot>
				<slot content><color-picker></color-picker></slot>
				<slot buttons>
					<button cancel>CANCEL</button>
					<button confirm>OK</button>
				</slot>
			</modal-dialog>
		`.minify();

		this.deleteDialog = this.querySelector('modal-dialog[delete]');
		this.colorPickerDialog = this.querySelector('modal-dialog[color-picker]');
	}

	#renderLabel(label, hidden) {
		return `<div class="label-entry ${hidden || ''}" data-id="${label.id}">
			<input type="color" value="${label.color}" onclick="${this.id}.showColorPicker(event, this);">
			<input type="text" value="${label.text}">
			<button class="material-symbols-outlined fab mini red" onclick="${this.id}.confirmDelete(this);">delete</button>
		</div>`;
	}
	#id() {
		return new Date().getTime();
	}
	#randomColor() {
		return '#' + Math.floor(Math.random() * 16777215).toString(16);
	}
}

customElements.define('labels-dialog', LabelsDialog);