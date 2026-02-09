class ExplorerView extends HTMLElementBase {
	TARGET = EventBus.Target.EXPLORER_VIEW;

	constructor() {
		super();
		this.render();
		EventBus.subscribe((event) => this.handler(event))

		this.renderCrumbs('/storage/emulated/0/DCIM/Camera');
	}

	handler(event) {
		if (event.target != this.TARGET) return;

		when(event.type)
			.is(EventBus.Type.LIST_DIR, () => {
				this.renderCrumbs(event.data.path);
				this.renderItems(event.data.items);
			});
	}

	// TODO search + sort + selection

	onItemClick(event) {
		event.preventDefault();

		const type = event.target.tagName == 'IMG' ? EventBus.Type.VIEW_IMG : EventBus.Type.LIST_DIR;
		const path = event.target.src || event.target.href;

		EventBus.dispatch({ type, target: this.TARGET, data: { path } });
	}

	onCrumbClick(event) {
		event.preventDefault();
		const path = event.target.href;
		EventBus.dispatch({ type: EventBus.Type.LIST_DIR, target: this.TARGET, data: { path } });
	}

	onBackClick(event) {
		event.preventDefault();
		EventBus.dispatch({ type: EventBus.Type.BACK, target: this.TARGET });
	}

	render() {
		super.render(`
			<header>
				<h1 id="primary-title">Explorer</h1>
				<actions>
					<h2 id="secondary-title" aria-hidden="true">Explorer</h2>
					<button icon class="ic-search" id="search-button"></button>
					<button icon class="ic-sort" id="sort-button"></button>
				</actions>
			</header>

			<grid id="items">
				${Array.from({ length: 28 }).map(() => '<placeholder></placeholder>').join('')}
			</grid>

			<breadcrumb-bar>
				<button icon class="ic-arrow-left" id="back-button" onclick="${this}.onBackClick(event)"></button>
				<crumb-list id="crumbs"></crumb-list>
			</breadcrumb-bar>
		`);
	}

	renderItems(items) {
		this.items.innerHTML = items.map(item => {
			return item.type == 'dir'
				? `
					<button href="${item.path}" onclick="${this}.onItemClick(event)">
						<i class="ic-folder"></i>
						<span>${item.name}</span>
					</button>
				`
				: `<img src="${item.path}" loading="lazy" onclick="${this}.onItemClick(event)">`;
		}).join('');
	}

	renderCrumbs(path) {
		const parts = path.split('/');
		this.crumbs.innerHTML = parts.map((part, index) => {
			return `<button href="${parts.slice(0, index + 1).join('/')}" onclick="${this}.onCrumbClick(event)">${part}</button>`;
		}).join('');

		this.crumbs.scrollTo({ left: this.crumbs.scrollWidth });
	}
}

customElements.define('explorer-view', ExplorerView);
