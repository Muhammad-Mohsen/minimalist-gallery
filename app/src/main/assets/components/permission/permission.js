class PermissionView extends HTMLElementBase {
	constructor() {
		super();
		this.render();
	}

	request() {
		EventBus.dispatch({ type: EventBus.Type.REQUEST_STORAGE_PERMISSION, target: EventBus.Target.PERMISSION_VIEW });
	}

	render() {
		super.render(`
			<p>Allow <strong>Storage</strong> access</p>
			<button icon class="ic-unlock" onclick="${this}.request()" aria-label="grant storage permission"></button>
		`);
	}
}

customElements.define('permission-view', PermissionView);
