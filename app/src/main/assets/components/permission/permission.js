class PermissionView extends HTMLElementBase {
	constructor() {
		super();
		this.render();
	}

	request() {
		EventBus.dispatch({ type: EventBus.Type.REQUEST_PERMISSION, target: EventBus.Target.JS });
	}

	render() {
		super.render(`
			<p l10n>Allow <strong>Photos and videos</strong> access</p>
			<button icon class="ic-unlock" onclick="${this}.request()" aria-label="grant storage permission"></button>
		`);
	}
}

customElements.define('permission-view', PermissionView);
