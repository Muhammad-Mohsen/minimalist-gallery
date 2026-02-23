class Modal extends HTMLElement {
	constructor() {
		super();
		this.render();
	}
	show() { this.dialog.showModal(); }
	close() { this.dialog.close(); }

	render() {
		this.innerHTML = `
			<dialog>
				<h1>${this.querySelector('slot[title]').innerHTML}</h1>
				${this.querySelector('slot[content]').outerHTML}
				${this.querySelector('slot[buttons]').outerHTML.replace(/\/button><button/g, '\/button><div class="separator"></div><button')}
			</dialog>
		`;

		this.dialog = this.querySelector('dialog');
		this.dialog.querySelectorAll('button').forEach(button => button.addEventListener('click', () => this.close()));
	}
}

customElements.define('modal-dialog', Modal);
