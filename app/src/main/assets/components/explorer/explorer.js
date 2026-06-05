class ExplorerView extends HTMLElementBase {
	#sorts = [
		{ name: 'Name (A - Z)', value: 'az' },
		{ name: 'Name (Z - A)', value: 'za' },
		{ name: 'Date (Newest First)', value: 'newest' },
		{ name: 'Date (Oldest First)', value: 'oldest' },
	];

	// HEADER
	onMoreClick() {
		this.moreDialog.show();
	}

	onSearchClick() {
		this.searchField.classList.toggle('show');
		this.searchField.focus();
	}
	onSearchInput(value) {
		value = value.trim().toLowerCase();
		this.grid.children.toArray().forEach(item => {
			const name = item.getAttribute('name').toLowerCase();
			item.style.display = name.includes(value) ? '' : 'none';
		});
	}

	onRefreshClick() {
		EventBus.dispatch({ type: EventBus.Type.LIST_FILES, target: EventBus.Target.JS, data: { path: state.path, force: true } });
		this.morePopover.hidePopover();
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

	onCancelSelectModeClick() {
		this.setAttribute('mode', 'normal');
		this.querySelectorAll('img[selected]').forEach(i => i.removeAttribute('selected'));
	}
	onDeleteClick() {
		EventBus.dispatch({ type: EventBus.Type.DELETE_IMAGE, target: EventBus.Target.JS, data: { paths: state.selection } });
		this.onCancelSelectModeClick();
	}

	// GRID
	onImageTouchStart(event) {
		const target = event.target;

		// ignore touches in the near the edges
		const touchX = event.touches[0].clientX;
		if (touchX <= SAFE_AREA_LEFT || touchX >= SAFE_AREA_RIGHT) return;

		// scrolling
		target.setAttribute('touch-start-x', event.touches[0].clientX);
		target.setAttribute('touch-start-y', event.touches[0].clientY);

		if (target.nodeName == 'BUTTON') return; // directory

		// for long press
		const timeout = setTimeout(() => this.onImageLongTouch(target), LONG_PRESS);
		target.setAttribute('touch-start-ts', Date.now());
		target.setAttribute('timeout', timeout);
	}
	// cancel the long-press timeout if the user moves their finger
	onImageTouchMove(event) {
		const target = event.currentTarget;

		if (Math.abs(event.touches[0].clientX - parseFloat(target.getAttribute('touch-start-x'))) > LONG_PRESS_MOVE
			|| Math.abs(event.touches[0].clientY - parseFloat(target.getAttribute('touch-start-y'))) > LONG_PRESS_MOVE) {

			target.setAttribute('moved', ''); // mark the touch event as moved (to cancel it on touchup)
			clearTimeout(target.getAttribute('timeout'));
		}
	}
	onImageTouchEnd(event) {
		const target = event.currentTarget;
		clearTimeout(target.getAttribute('timeout'));

		if (target.hasAttribute('moved')) return target.removeAttribute('moved');

		// IMAGE LONG CLICK (already handled)
		const touchStart = parseInt(target.getAttribute('touch-start-ts')) || Date.now();
		if (Date.now() - touchStart >= LONG_PRESS) return;

		// CLICK (select mode)
		if (this.getAttribute('mode') == 'select') return this.onImageLongTouch(target);

		// CLICK (normal mode)
		this.imageView ||= document.querySelector('image-view');
		document.startViewTransition({
			update: () => this.imageView.src = target.src,
			types: ['forward'],
		});
	}
	onImageLongTouch(target) {
		target.toggleAttribute('selected');
		state.selection = this.querySelectorAll('img[selected]').toArray().map(i => i.src.replace(BASE_THUMB_PATH, ''));
		this.selectionCount.innerHTML = `${state.selection.length} / ${state.items.filter(item => !item.isDirectory).length}`;
		this.setAttribute('mode', state.selection.length ? 'select' : 'normal');
	}
	onImageTouchCancel(event) {
		clearTimeout(event.currentTarget.getAttribute('timeout'));
	}
	onDirectoryClick(event) {
		EventBus.dispatch({
			type: EventBus.Type.LIST_FILES,
			target: EventBus.Target.JS,
			data: { path: event.currentTarget.getAttribute('path') }
		});
	}
	onThumbnailError(img) {
		img.src = 'assets/error-fallback.png';
	}

	// NAVBAR
	onCrumbClick(event) {
		const path = '/' + event.target.getAttribute('path');
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

	render(path, items) {
		const parts = path.split('/').filter(p => p);

		const imageCount = items.filter(item => !item.isDirectory).length;

		super.render(`
			<header>
				<h1 id="header">${parts[parts.length - 1] || '/'}</h1>
				<sub l10n>${imageCount} ${imageCount == 1 ? 'Image' : 'Images'}</sub>

				<actions>
					<button icon class="ic-search" onclick="${this}.onSearchClick()"></button>
					<button icon class="ic-more more-button" popovertarget="more-popover-${this}"></button>
				</actions>
				<selection-actions>
					<button icon class="ic-arrow-left" id="back-button" onclick="${this}.onCancelSelectModeClick()"></button>
					<h2><span id="selection-count"></span> Selected</h2>
					<button icon class="ic-trash" onclick="${this}.onDeleteClick()"></button>
				</selection-actions>

				<popover id="more-popover-${this}" class="more-popover" popover>
					<button icon class="ic-sort" id="sort-button" onclick="${this}.onSortClick()"></button>
					<button icon class="ic-refresh" id="refresh-button" onclick="${this}.onRefreshClick()"></button>
				</popover>
			</header>

			<grid id="items">
				${
					items.map(item => {
						return item.isDirectory
							? `
								<button path="${item.path}" name="${item.name}" onclick="${this}.onDirectoryClick(event)">
									<i class="ic-folder"></i>
									<span>${item.name}</span>
								</button>
							`
							: `<img src="${BASE_THUMB_PATH}${item.path}" name="${item.name}" loading="lazy"
									ontouchstart="${this}.onImageTouchStart(event)" ontouchmove="${this}.onImageTouchMove(event)" ontouchend="${this}.onImageTouchEnd(event);" ontouchcancel="${this}.onImageTouchCancel(event);" onerror="${this}.onThumbnailError(this)">`;
					}).join('')
				}
			</grid>
			<scrollbar-track><scrollbar-thumb></scrollbar-thumb></scrollbar-track>

			<toolbar>
				<button icon class="ic-arrow-left" id="back-button" onclick="${this}.onBackClick()"></button>
				<nav id="crumbs">
					${
						parts.map((part, index) => {
							return `<button path="${parts.slice(0, index + 1).join('/')}" onclick="${this}.onCrumbClick(event)">${part}</button>`;
						}).join('<i class="ic-chevron-right"></i>')
					}
				</nav>
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

		this.#renderScrollbar(this.grid, this.querySelector('scrollbar-thumb'));
	}

	#renderScrollbar(element, thumb) {
		const HIDE_DELAY = 2000;
		let hideTimeout;

		let ticking = false;

		let dragging = false;
		let startTouch = 0;
		let startScroll = 0;

		const track = thumb.parentElement;

		// don't bother creating a scrollbar for shortish content
		if (element.scrollHeight < document.body.clientHeight * 2) return;

		// the full-header height is added to the clientHeight (minus the actions height) as the header collapses on scroll
		const scrollableHeight = element.scrollHeight - (element.clientHeight + document.body.clientHeight * .4 - 64);
		const trackHeight = track.clientHeight - 80; // 80 is the thumb height

		const updateThumbPosition = () => {
			const scrollTop = element.scrollTop;

			// Calculate the thumb's vertical position
			const thumbPosition = scrollTop / scrollableHeight * trackHeight;
			thumb.style.transform = `translateY(${thumbPosition}px)`;
		}

		// touch handlers
		thumb.ontouchstart = (event) => {
			startTouch = event.touches[0].clientY;
			startScroll = element.scrollTop;
			dragging = true;
			thumb.className = 'dragging';
		}
		thumb.ontouchmove = (event) => {
			if (!dragging) return;

			const delta = event.touches[0].clientY - startTouch;
			element.scrollTop = startScroll + delta / trackHeight * scrollableHeight;
		}
		thumb.ontouchend = () => {
			dragging = false;
			thumb.className = '';
		}

		// scroll handlers
		element.onscroll = () => {
			if (ticking) return;

			ticking = true;
			requestAnimationFrame(() => {
				track.classList.add('show');
				updateThumbPosition();
				ticking = false;
			});
		}
		element.onscrollend = () => {
			clearTimeout(hideTimeout);
			hideTimeout = setTimeout(() => track.classList.remove('show'), HIDE_DELAY)
		};
	}
}

customElements.define('explorer-view', ExplorerView);
