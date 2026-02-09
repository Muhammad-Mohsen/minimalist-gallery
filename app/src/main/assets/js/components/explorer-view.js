
class ExplorerView extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
	}

	connectedCallback() {
		this.render([]);
	}

	set items(items) {
		this.render(items || []);
	}

	render(items) {
		const style = `
			:host {
				display: block;
				height: 100%;
				overflow-y: auto;
				padding: 10px;
				box-sizing: border-box;
			}
			.grid {
				display: grid;
				grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
				gap: 10px;
			}
			.item {
				aspect-ratio: 1;
				background: #222;
				border-radius: 8px;
				overflow: hidden;
				position: relative;
				cursor: pointer;
			}
			.item img {
				width: 100%;
				height: 100%;
				object-fit: cover;
				display: block;
				opacity: 0;
				transition: opacity 0.3s;
			}
			.item img.loaded {
				opacity: 1;
			}
			.item.dir {
				background: #333;
				display: flex;
				align-items: center;
				justify-content: center;
				flex-direction: column;
				color: #aaa;
			}
			.label {
				position: absolute;
				bottom: 0;
				left: 0;
				width: 100%;
				background: rgba(0,0,0,0.7);
				font-size: 10px;
				padding: 4px;
				box-sizing: border-box;
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;
				text-align: center;
			}
			.icon {
				font-size: 32px;
				margin-bottom: 4px;
			}
		`;

		const html = items.map(item => {
			if (item.isDirectory) {
				return `
					<div class="item dir" onclick="this.getRootNode().host.emitNavigate('${item.path}')">
						<div class="icon">📁</div>
						<div class="label">${item.name}</div>
					</div>
				`;
			} else {
				// Check if image
				const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(item.name);
				if (!isImage) return '';

				// Thumbnail URL
				const thumbUrl = `https://appassets.androidplatform.net/thumbnail/${item.path}`;
				return `
					<div class="item file" onclick="this.getRootNode().host.emitOpen('${item.path}', '${item.name}')">
						<img src="${thumbUrl}" loading="lazy" onload="this.classList.add('loaded')">
						<div class="label">${item.name}</div>
					</div>
				`;
			}
		}).join('');

		this.shadowRoot.innerHTML = `<style>${style}</style><div class="grid">${html}</div>`;
	}

	emitNavigate(path) {
		this.dispatchEvent(new CustomEvent('navigate', { detail: { path } }));
	}

	emitOpen(path, name) {
		this.dispatchEvent(new CustomEvent('open', { detail: { path, name } }));
	}
}

customElements.define('explorer-view', ExplorerView);
