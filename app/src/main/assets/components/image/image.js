class ImageView extends HTMLElementBase {

	get src() {
		return this.getAttribute('src') || '';
	}
	set src(value) {
		this.setAttribute('src', value);
		if (!value) return;

		state.image = this.findImage(value);
		this.transform = { x: 0, y: 0, rotate: 0, scale: 1 };
		this.gesture = {}

		this.render();
	}

	// IMG
	onImageClick() {
		this.header.classList.toggle('hidden');
		this.footer.classList.toggle('hidden');
		this.thumbnailCarousel.classList.toggle('hidden');
	}
	onImageDblClick(img, e) {
		this.transform = { x: 0, y: 0, rotate: 0, scale: 1 };
		// img.style.transition = '.2s ease-in-out';
		img.style.translate = img.style.rotate = img.style.scale = '';
		this.#renderTransforms();
	}
	onImageTransitionEnd() {
		setTimeout(() => {
			this.mainImage.style.transition = '';
			this.mainImage.style.transformOrigin = '0 0';
		});
	}
	onThumbnailClick(img) {
		// update state
		state.image = this.findImage(img.src);

		// update image
		this.mainImage.src = BASE_IMG_PATH + state.image.path;
		this.mainImage.style.translate = this.mainImage.style.rotate = this.mainImage.style.scale = '';
		this.transform = { x: 0, y: 0, rotate: 0, scale: 1 };

		// update thumbnail
		this.querySelector('thumbnail-carousel img.active')?.removeClass('active');
		img.addClass('active').scrollIntoView({ inline: 'center', behavior: 'smooth' });

		// update info
		this.info.innerHTML = this.#renderInfo();

		// update transforms
		this.#renderTransforms();
	}

	onResetRotationClick() {
		if (this.transform.rotate == 0) return;

		const angleChange = -this.transform.rotate * Math.PI / 180;

		const bounds = this.mainImage.getBoundingClientRect();
		const currentCenter = this.center({ clientX: bounds.left, clientY: bounds.top }, { clientX: bounds.right, clientY: bounds.bottom });

		const vector = { x: currentCenter.x - this.transform.x, y: currentCenter.y - this.transform.y }

		const cos = Math.cos(angleChange);
		const sin = Math.sin(angleChange);
		const rotatedVector = { x: vector.x * cos - vector.y * sin, y: vector.x * sin + vector.y * cos }

		this.transform.x = currentCenter.x - rotatedVector.x;
		this.transform.y = currentCenter.y - rotatedVector.y;
		this.transform.rotate = 0;

		this.mainImage.style.transition = 'rotate .2s ease-in-out, translate .2s ease-in-out';
		this.mainImage.style.translate = `${this.transform.x}px ${this.transform.y}px`;
		this.mainImage.style.rotate = this.transform.rotate + 'deg';

		this.#renderTransforms();
	}
	onActualSizeClick() {
		const targetScale = this.mainImage.naturalWidth / document.body.clientWidth;
		const scaleChange = targetScale / this.transform.scale;

		if (scaleChange == 1) return;

		const bounds = this.mainImage.getBoundingClientRect();
		const currentCenter = this.center({ clientX: bounds.left, clientY: bounds.top }, { clientX: bounds.right, clientY: bounds.bottom });

		this.transform.x = currentCenter.x - (currentCenter.x - this.transform.x) * scaleChange;
		this.transform.y = currentCenter.y - (currentCenter.y - this.transform.y) * scaleChange;
		this.transform.scale = targetScale;

		this.mainImage.style.transition = 'scale .2s ease-in-out, translate .2s ease-in-out';
		this.mainImage.style.scale = this.transform.scale;
		this.mainImage.style.translate = `${this.transform.x}px ${this.transform.y}px`;

		this.#renderTransforms();
	}

	onBackClick() {
		document.startViewTransition({
			update: () => this.src = '',
			types: ['back'],
		});
	}

	// TOUCH
	onTouchStart(e, timestamp = Date.now()) {
		this.gesture.initialTransform = JSON.copy(this.transform);
		this.gesture.touches = e.touches.length;
		this.gesture.timestamp = timestamp;

		if (e.touches.length == 2) {
			this.gesture.distance = this.distance(e.touches[0], e.touches[1]);
			this.gesture.angle = this.angle(e.touches[0], e.touches[1]);
			this.gesture.center = this.center(e.touches[0], e.touches[1]);
		}
		else if (e.touches.length == 1) {
			this.gesture.ignore = e.touches[0].clientX < SAFE_AREA_LEFT || e.touches[0].clientX > SAFE_AREA_RIGHT;

			this.gesture.x = e.touches[0].clientX;
			this.gesture.y = e.touches[0].clientY;
		}
	}
	onTouchMove(e) {
		const img = this.imageCarousel.children[0];

		if (e.touches.length != this.gesture.touches) {
			this.onTouchStart(e, this.gesture.timestamp); // maintain the original touchstart timestamp
			return;
		}

		if (this.gesture.ignore) return;

		if (e.touches.length == 2) {
			e.preventDefault();

			const currentDistance = this.distance(e.touches[0], e.touches[1]);
			const currentAngle = this.angle(e.touches[0], e.touches[1]);
			const currentCenter = this.center(e.touches[0], e.touches[1]);

			// Calculate new scale and rotation
			const scaleChange = currentDistance / this.gesture.distance;
			const angleChange = currentAngle - this.gesture.angle;

			this.transform.scale = this.gesture.initialTransform.scale * scaleChange;
			this.transform.rotate = this.gesture.initialTransform.rotate + angleChange;
			//
			// yada, yada, yada...
			//
			// Calculate new translation to keep the "gesture center" fixed
			// Vector from Initial Origin to Initial Center
			const vX = this.gesture.center.x - this.gesture.initialTransform.x;
			const vY = this.gesture.center.y - this.gesture.initialTransform.y;

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
			//
			// ...we get something that works!
			//
			img.style.scale = this.transform.scale;
			img.style.rotate = this.transform.rotate + 'deg';
			img.style.translate = `${this.transform.x}px ${this.transform.y}px`;

			this.#renderTransforms();
		}
		else if (e.touches.length == 1) {
			this.transform.x = this.gesture.initialTransform.x + e.touches[0].clientX - this.gesture.x;
			this.transform.y = this.gesture.initialTransform.y + e.touches[0].clientY - this.gesture.y;

			img.style.translate = `${this.transform.x}px ${this.transform.y}px`;
		}
	}
	onTouchEnd(e) {
		if (Date.now() - this.gesture.timestamp < 150 // quick tap
			&& this.distance(e.changedTouches[0], { clientX: this.gesture.x, clientY: this.gesture.y }) < 10) { // not a flick

			this.onImageClick();
		}
	}

	render() {
		super.render(`
			<header id="header">
				<button id="rotation-value" class="ic-rotate output" data-unit="°" onclick="${this}.onResetRotationClick()">0</button>
				<button id="scale-value" class="ic-scale output" data-unit="%" onclick="${this}.onActualSizeClick()">100</button>
			</header>
			<image-carousel id="image-carousel" ontouchstart="${this}.onTouchStart(event);" ontouchmove="${this}.onTouchMove(event);" ontouchend="${this}.onTouchEnd(event);">
				<img id="main-image" src="${BASE_IMG_PATH}${state.image.path}" loading="lazy" style="transform-origin: 0 0"
					ontransitionend="${this}.onImageTransitionEnd()" ondblclick="${this}.onImageDblClick(this, event)">
			</image-carousel>

			<thumbnail-carousel id="thumbnail-carousel">
				${state.items
					.filter(i => !i.isDirectory)
					.map(i => `<img src="${BASE_THUMB_PATH}${i.path}" loading="lazy" onclick="${this}.onThumbnailClick(this)">`)
					.join('')
				}
			</thumbnail-carousel>

			<footer id="footer">
				<button id="back-button" icon class="ic-arrow-left" onclick="${this}.onBackClick()"></button>
				<info id="info">
					${this.#renderInfo()}
				</info>
			</footer>
		`);

		this.#renderTransforms();

		// Mark active thumbnail & scroll it into center
		this.querySelector(`thumbnail-carousel img[src="${BASE_THUMB_PATH}${state.image.path}"]`)
			.addClass('active')
			.scrollIntoView({ inline: 'center' });
	}

	#renderInfo() {
		return `
			<h1>${state.image.name}</h1>
			<span>${state.image.resolution} <separator></separator> ${state.image.size.toSize()} <separator></separator> ${new Date(state.image.date * 1000).format('dd MMM yyyy HH:mm')}</span>
		`;
	}
	#renderTransforms() {
		const naturalWidth = Number(state.image.resolution.split(/\D+/)[0]);

		this.scaleValue.textContent = Math.round(document.body.clientWidth * this.transform.scale / naturalWidth * 100);
		this.rotationValue.textContent = Math.round(this.transform.rotate) || 0;
	}

	findImage(src, within = state.items) {
		return within.find(i => i.path == src.replace(BASE_THUMB_PATH, ''));
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
