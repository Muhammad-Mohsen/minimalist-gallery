class ImageView extends HTMLElementBase {

	get src() {
		return this.getAttribute('src') || '';
	}
	set src(value) {
		this.setAttribute('src', value);
		if (!value) return;

		this.render();

		this.transform = {
			x: 0,
			y: 0,
			rotate: 0,
			scale: 1,
		}
		this.gesture = {
			initial: {},
			distance: 0,
			angle: 0,

			x: 0,
			y: 0,

			touches: 0,
		}
	}

	// CLICK/DBL_CLICK
	onImageClick() {

	}
	onImageDblClick(img) {
		this.transform = {
			x: 0,
			y: 0,
			rotate: 0,
			scale: 1
		}
		img.style.translate = img.style.rotate = img.style.scale = '';
	}

	onBackClick() {
		document.startViewTransition({
			update: () => this.src = '',
			types: ['back'],
		});
	}

	// TOUCH
	onTouchStart(e) {
		this.gesture.initial = JSON.copy(this.transform);
		this.gesture.touches = e.touches.length;
		this.gesture.timestamp = Date.now();

		if (e.touches.length == 2) {
			this.gesture.distance = this.distance(e.touches[0], e.touches[1]);
			this.gesture.angle = this.angle(e.touches[0], e.touches[1]);
			this.gesture.center = this.center(e.touches[0], e.touches[1]);
		}
		else if (e.touches.length == 1) {
			this.gesture.x = e.touches[0].clientX;
			this.gesture.y = e.touches[0].clientY;
		}
	}

	onTouchMove(e) {
		const img = this.imageCarousel.children[0];

		if (e.touches.length != this.gesture.touches) {
			this.onTouchStart(e);
			return;
		}

		if (e.touches.length == 2) {
			e.preventDefault();

			const currentDistance = this.distance(e.touches[0], e.touches[1]);
			const currentAngle = this.angle(e.touches[0], e.touches[1]);
			const currentCenter = this.center(e.touches[0], e.touches[1]);

			// Calculate new scale and rotation
			const scaleChange = currentDistance / this.gesture.distance;
			const angleChange = currentAngle - this.gesture.angle;

			this.transform.scale = this.gesture.initial.scale * scaleChange;
			this.transform.rotate = this.gesture.initial.rotate + angleChange;

			// Calculate new translation to keep the "gesture center" fixed
			// Vector from Initial Origin to Initial Center
			const vX = this.gesture.center.x - this.gesture.initial.x;
			const vY = this.gesture.center.y - this.gesture.initial.y;

			// Rotate vector
			const rad = angleChange * Math.PI / 180;
			const cos = Math.cos(rad);
			const sin = Math.sin(rad);
			const rX = vX * cos - vY * sin;
			const rY = vX * sin + vY * cos;

			// Scale vector
			const sX = rX * scaleChange;
			const sY = rY * scaleChange;

			// New Origin = CurrentCenter - NewVector
			this.transform.x = currentCenter.x - sX;
			this.transform.y = currentCenter.y - sY;

			img.style.scale = this.transform.scale;
			img.style.rotate = this.transform.rotate + 'deg';
			img.style.translate = `${this.transform.x}px ${this.transform.y}px`;
		}
		else if (e.touches.length == 1) {
			this.transform.x = this.gesture.initial.x + e.touches[0].clientX - this.gesture.x;
			this.transform.y = this.gesture.initial.y + e.touches[0].clientY - this.gesture.y;

			img.style.translate = `${this.transform.x}px ${this.transform.y}px`;
		}
	}

	onTouchEnd(e) {
		const time = Date.now() - this.gesture.timestamp;
		if (time < 300) return;

		if (this.gesture.touches == 1) {
			this.onImageClick();
		}
	}

	render() {
		// const item = state.items.find(i => i.path.split('/').pop() == this.src.split('/').pop());

		// <info-bar id="infoBar">
		// 		<h1>${item.name}</h1>
		// 		<span>${item.path}</span>
		// 		<span>${item.width}x${item.height}</span><span>${item.size}</span>
		// 		<time>date</time>
		// 	</info-bar>
		super.render(`
			<image-carousel id="imageCarousel" ontouchstart="${this}.onTouchStart(event);" ontouchmove="${this}.onTouchMove(event);" ontouchend="${this}.onTouchEnd(event);">
				<img src="${this.src.replace('/thumbnail', '/file')}" style="transform-origin: 0 0" loading="lazy" ondblclick="${this}.onImageDblClick(this)">
			</image-carousel>

			<thumbnail-carousel id="thumbnail-carousel"></thumbnail-carousel>

			<toolbar>
				<button icon class="ic-arrow-left" onclick="${this}.onBackClick()"></button>
				<button icon class="ic-share"></button>
				<button icon class="ic-pencil"></button>
			</toolbar>
		`);
	}

	renderImages(items) {
		const basePath = state.debug ? '' : 'https://appassets.androidplatform.net/file/';
		// this.imageCarousel.innerHTML = items
		// 	.filter(i => !i.isDirectory)
		// 	.map(i => `<img src="${basePath}${i.path}" loading="lazy" ondblclick="${this}.onImageDblClick(this)">`)
		// 	.join('');

		// const currentPath = this.src.split('/').pop();
		// this.imageCarousel.querySelector(`[src="${basePath}${currentPath}"]`).scrollIntoView();

		this.imageCarousel.innerHTML = `<img src="${this.src.replace('/thumbnail', '/file')}" style="transform-origin: 0 0" loading="lazy" ondblclick="${this}.onImageDblClick(this)">`
	}

	renderInfo(item) {

	}

	distance(p1, p2) {
		const dx = p1.clientX - p2.clientX;
		const dy = p1.clientY - p2.clientY;
		return Math.hypot(dx, dy);
	}
	angle(p1, p2) {
		return Math.atan2(p2.clientY - p1.clientY, p2.clientX - p1.clientX) * 180 / Math.PI;
	}
	center(p1, p2) {
		return {
			x: (p1.clientX + p2.clientX) / 2,
			y: (p1.clientY + p2.clientY) / 2
		};
	}
}

customElements.define('image-view', ImageView);
