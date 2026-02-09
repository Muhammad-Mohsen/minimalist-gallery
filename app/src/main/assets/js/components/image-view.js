
class ImageView extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
		this.rotation = 0;
		this.scale = 1;
		this.lastAngle = 0;
		this.isDragging = false;

		// Bind gesture handlers
		this.handleTouchStart = this.handleTouchStart.bind(this);
		this.handleTouchMove = this.handleTouchMove.bind(this);
		this.handleTouchEnd = this.handleTouchEnd.bind(this);
	}

	connectedCallback() {
		this.render();
		const container = this.shadowRoot.querySelector('.container');
		container.addEventListener('touchstart', this.handleTouchStart);
		container.addEventListener('touchmove', this.handleTouchMove);
		container.addEventListener('touchend', this.handleTouchEnd);
	}

	set image(data) {
		this.path = data.path;
		this.name = data.name;
		this.rotation = 0;
		this.scale = 1;
		this.render();
	}

	render() {
		const url = this.path ? `https://appassets.androidplatform.net/file/${this.path}` : '';
		const style = `
			:host {
				display: block;
				width: 100%;
				height: 100%;
				background: black;
				overflow: hidden;
			}
			.container {
				width: 100%;
				height: 100%;
				display: flex;
				align-items: center;
				justify-content: center;
				touch-action: none; /* Important for custom gestures */
			}
			img {
				max-width: 100%;
				max-height: 100%;
				transition: transform 0.1s linear;
				transform-origin: center;
			}
			.info-panel {
				position: absolute;
				bottom: 0;
				left: 0;
				width: 100%;
				background: rgba(0,0,0,0.8);
				color: white;
				padding: 20px;
				transform: translateY(100%);
				transition: transform 0.3s ease;
				box-sizing: border-box;
			}
			.info-panel.visible {
				transform: translateY(0);
			}
		`;

		this.shadowRoot.innerHTML = `
			<style>${style}</style>
			<div class="container">
				${url ? `<img src="${url}" style="transform: rotate(${this.rotation}deg) scale(${this.scale})">` : ''}
			</div>
			<div class="info-panel">
				<h3>${this.name || 'Image'}</h3>
				<p>Path: ${this.path || 'Unknown'}</p>
				<p>Swipe down to hide</p>
			</div>
		`;

		this._img = this.shadowRoot.querySelector('img');
		this._info = this.shadowRoot.querySelector('.info-panel');
	}

	getDistance(p1, p2) {
		const dx = p1.clientX - p2.clientX;
		const dy = p1.clientY - p2.clientY;
		return Math.hypot(dx, dy);
	}

	getAngle(p1, p2) {
		return Math.atan2(p2.clientY - p1.clientY, p2.clientX - p1.clientX) * 180 / Math.PI;
	}

	handleTouchStart(e) {
		if (e.touches.length === 2) {
			this.initialDistance = this.getDistance(e.touches[0], e.touches[1]);
			this.initialAngle = this.getAngle(e.touches[0], e.touches[1]);
			this.initialRotation = this.rotation;
		} else if (e.touches.length === 1) {
			this.startY = e.touches[0].clientY;
		}
	}

	handleTouchMove(e) {
		if (e.touches.length === 2 && this._img) {
			e.preventDefault();
			const currentDistance = this.getDistance(e.touches[0], e.touches[1]);
			const currentAngle = this.getAngle(e.touches[0], e.touches[1]);

			// Rotation
			const angleDiff = currentAngle - this.initialAngle;
			this.rotation = this.initialRotation + angleDiff;

			// Update transform
			this._img.style.transform = `rotate(${this.rotation}deg) scale(${this.scale})`;

		} else if (e.touches.length === 1) {
			 // Swipe up logic for info panel
			 const dy = e.touches[0].clientY - this.startY;
			 if (dy < -50) {
				 this._info.classList.add('visible');
			 } else if (dy > 50) {
				 this._info.classList.remove('visible');
			 }
		}
	}

	handleTouchEnd(e) {
		// cleanup
	}
}

customElements.define('image-view', ImageView);
