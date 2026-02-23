class ExplorerView extends HTMLElementBase {
	#sorts = [
		{ name: 'Name (A - Z)', value: 'az' },
		{ name: 'Name (Z - A)', value: 'za' },
		{ name: 'Date (Newest First)', value: 'newest' },
		{ name: 'Date (Oldest First)', value: 'oldest' },
	];

	constructor() {
		super();
	}
	onItemClick(event) {
		if (event.currentTarget.nodeName == 'BUTTON') {
			EventBus.dispatch({
				type: EventBus.Type.LIST_FILES,
				target: EventBus.Target.JS,
				data: { path: event.currentTarget.getAttribute('path') }
			});
		}
		else {
			this.imageView ||= document.querySelector('image-view');
			document.startViewTransition({
				update: () => this.imageView.src = event.target.src,
				types: ['forward'],
			});
		}
	}

	onSearchClick() {
		this.searchField.classList.toggle('show');
		this.searchField.focus();
	}
	onSortClick() {
		const radio = this.sortDialog.querySelector(`input[name="sort"][value="${state.sort}"]`);
		if (radio) radio.checked = true;
		this.sortDialog.show();
	}
	onApplySortClick() {
		const sort = this.sortDialog.querySelector('input[name="sort"]:checked').value;
		if (sort == state.sort) return;

		state.sort = sort;
		EventBus.dispatch({ type: EventBus.Type.SORT_BY, target: EventBus.Target.JS, data: { sort } });
	}

	onCrumbClick(event) {
		const path = event.target.getAttribute('path');
		EventBus.dispatch({ type: EventBus.Type.LIST_FILES, target: EventBus.Target.JS, data: { path } });
	}

	onBackClick() {
		if (this.searchField.classList.includes('show')) {
			this.searchField.classList.remove('show');
			this.searchField.value = '';
			this.onSearchInput('');
			return;
		}
		EventBus.dispatch({ type: EventBus.Type.BACK, target: EventBus.Target.JS });
	}

	onThumbnailError(img) {
		img.src = 'assets/error-fallback.png';
	}

	onSearchInput(value) {
		value = value.trim().toLowerCase();
		this.grid.children.toArray().forEach(item => {
			const name = item.getAttribute('name').toLowerCase();
			item.style.display = name.includes(value) ? '' : 'none';
		});
	}

	render(path, items) {
		const assetsPath = state.debug ? '' : 'https://appassets.androidplatform.net/thumbnail/';
		const parts = path.split('/').filter(p => p);

		const imageCount = items.filter(item => !item.isDirectory).length;

		super.render(`
			<header>
				<h1 id="header">${parts[parts.length - 1] || '/'}</h1>
				<sub l10n>${imageCount} ${imageCount == 1 ? 'Image' : 'Images'}</sub>

				<actions>
					<h2 id="selection-count"></h2>
					<button icon class="ic-search" id="search-button" onclick="${this}.onSearchClick()"></button>
					<button icon class="ic-sort" id="sort-button" onclick="${this}.onSortClick()"></button>
				</actions>
			</header>

			<grid id="items">
				${
					items.map(item => {
						return item.isDirectory
							? `
								<button path="${item.path}" name="${item.name}" onclick="${this}.onItemClick(event)">
									<i class="ic-folder"></i>
									<span>${item.name}</span>
								</button>
							`
							: `<img src="${assetsPath}${item.path}" name="${item.name}" loading="lazy" onerror="${this}.onThumbnailError(this)" onclick="${this}.onItemClick(event)">`;
					}).join('')
				}
			</grid>

			<toolbar>
				<button icon class="ic-arrow-left" id="back-button" onclick="${this}.onBackClick()"></button>
				<crumb-list id="crumbs">
					${
						parts.map((part, index) => {
							return `<button path="${parts.slice(0, index + 1).join('/')}" onclick="${this}.onCrumbClick(event)">${part}</button>`;
						}).join('<i class="ic-chevron-right"></i>')
					}
				</crumb-list>
				<input type="text" id="search" placeholder="Search" oninput="${this}.onSearchInput(this.value)">
			</toolbar>

			<modal-dialog id="sort-dialog">
				<slot title>Sort By</slot>
				<slot content>
					${this.#sorts.map(sort => {
						return `
							<label>
								<input type="radio" name="sort" value="${sort.value}">${sort.name}
							</label>
						`;
					}).join('')}
				</slot>
				<slot buttons>
					<button cancel>CANCEL</button>
					<button confirm onclick="${this}.onApplySortClick()">OK</button>
				</slot>
			</modal-dialog>
		`.minify());

		this.grid = this.querySelector('#items');

		this.breadcrumbs = this.querySelector('#crumbs');
		this.breadcrumbs.scrollLeft = this.breadcrumbs.scrollWidth;

		this.searchField = this.querySelector('#search');

		// css scroll snapping felt unnatural
		// this.grid.onscrollend = () => {
		// 	if (this.grid.scrollTop >= 200) return;
		// 	this.grid.scrollTo({ top: this.grid.scrollTop < 50 ? 0 : 200, behavior: 'smooth' });
		// };

	}
}

customElements.define('explorer-view', ExplorerView);
