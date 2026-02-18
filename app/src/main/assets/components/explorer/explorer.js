class ExplorerView extends HTMLElementBase {
	constructor() {
		super();
	}
	// TODO search + sort

	onItemClick(event) {
		if (event.currentTarget.nodeName == 'BUTTON') {
			EventBus.dispatch({
				type: EventBus.Type.LIST_FILES,
				target: EventBus.Target.JS,
				data: { path: event.currentTarget.getAttribute('path') }
			});
		}
		else {
			// TODO set transition-name on target (thumbnail)
			this.imageView ||= document.querySelector('image-view');
			document.startViewTransition(() => this.imageView.src = event.target.src);
		}
	}

	onCrumbClick(event) {
		const path = event.target.getAttribute('path');
		EventBus.dispatch({ type: EventBus.Type.LIST_FILES, target: EventBus.Target.JS, data: { path } });
	}

	onBackClick() {
		EventBus.dispatch({ type: EventBus.Type.BACK, target: EventBus.Target.JS });
	}

	render(path, items) {
		const basePath = state.debug ? '' : 'https://appassets.androidplatform.net/thumbnail/';
		const parts = path.split('/').filter(p => p);

		const imageCount = items.filter(item => !item.isDirectory).length;

		super.render(`
			<header>
				<h1 id="header">${parts[parts.length - 1] || '/'}</h1>
				<sub l10n>${imageCount} ${imageCount == 1 ? 'Image' : 'Images'}</sub>
				<actions>
					<h2 id="selection-count"></h2>
					<button icon class="ic-search" id="search-button"></button>
					<button icon class="ic-sort" id="sort-button"></button>
				</actions>
			</header>

			<grid id="items">
				${
					items.map(item => {
						return item.isDirectory
							? `
								<button path="${item.path}" onclick="${this}.onItemClick(event)">
									<i class="ic-folder"></i>
									<span>${item.name}</span>
								</button>
							`
							: `<img src="${basePath}${item.path}" loading="lazy" onclick="${this}.onItemClick(event)">`;
					}).join('')
				}
			</grid>

			<breadcrumb-bar>
				<button icon class="ic-arrow-left" id="back-button" onclick="${this}.onBackClick()"></button>
				<crumb-list id="crumbs">
					${
						parts.map((part, index) => {
							return `<button path="${parts.slice(0, index + 1).join('/')}" onclick="${this}.onCrumbClick(event)">${part}</button>`;
						}).join('<i class="ic-chevron-right"></i>')
					}
				</crumb-list>
			</breadcrumb-bar>
		`);
	}
}

customElements.define('explorer-view', ExplorerView);
