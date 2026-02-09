class ImageView extends HTMLElementBase {
	constructor() {
		super();
		this.render();
	}

	render() {
		super.render(`
			<img>
		`);
	}
}

customElements.define('image-view', ImageView);
