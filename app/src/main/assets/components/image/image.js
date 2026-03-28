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
	onImageLoad() {
		this.mainImage.style.translate = this.mainImage.style.rotate = this.mainImage.style.scale = '';
		this.mainImage.style.transition = '.2s ease-in-out';

		this.transform = { x: 0, y: 0, rotate: 0, scale: 1 };
		this.#renderTransforms();
	}
	onImageClick() {
		this.header.classList.toggle('hidden');
		this.footer.classList.toggle('hidden');
		this.thumbnailCarousel.classList.toggle('hidden');
	}
	onImageDblClick(img, e) {
		this.transform = { x: 0, y: 0, rotate: 0 };
		img.style.transition = '.2s ease-in-out';
		img.style.translate = '0 0';
		img.style.rotate = '0deg';

		if (img.style.scale && img.style.scale != '1') {
			this.transform.scale = 1;
			img.style.scale = '1';
		}
		else {
			const targetScale = this.mainImage.naturalWidth / document.body.clientWidth;
			this.transform.scale = targetScale;
			img.style.scale = targetScale;
		}

		this.#renderTransforms();
	}
	onImageTransitionEnd() {
		setTimeout(() => this.mainImage.style.transition = '');
	}
	onThumbnailClick(img) {
		// update state
		state.image = this.findImage(img.src);

		// update image
		this.mainImage.src = BASE_IMG_PATH + state.image.path;

		// update thumbnail
		this.querySelector('thumbnail-carousel img.active')?.removeClass('active');
		img.addClass('active').scrollIntoView({ inline: 'center', behavior: 'smooth' });

		// update info
		this.info.innerHTML = this.#renderInfo();
	}

	onResetRotationClick() {
		if (this.transform.rotate == 0) return;

		this.transform.rotate = 0;

		this.mainImage.style.transition = 'rotate .2s ease-in-out, translate .2s ease-in-out';
		this.mainImage.style.rotate = '0deg';

		this.#renderTransforms();
	}
	onActualSizeClick() {
		const targetScale = this.mainImage.naturalWidth / document.body.clientWidth;
		if (this.transform.scale == targetScale) return;

		this.transform.scale = targetScale;

		this.mainImage.style.transition = 'scale .2s ease-in-out, translate .2s ease-in-out';
		this.mainImage.style.scale = this.transform.scale;

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
		const img = this.mainImage;

		if (e.touches.length != this.gesture.touches) {
			this.onTouchStart(e, this.gesture.timestamp);
			return;
		}

		if (this.gesture.ignore) return;

		if (e.touches.length == 2) {
			e.preventDefault();

			const currentDistance = this.distance(e.touches[0], e.touches[1]);
			const currentAngle = this.angle(e.touches[0], e.touches[1]);
			const currentCenter = this.center(e.touches[0], e.touches[1]);

			const scaleChange = currentDistance / this.gesture.distance;
			const angleChange = currentAngle - this.gesture.angle;
			const angleRad = angleChange * Math.PI / 180;
			const cos = Math.cos(angleRad);
			const sin = Math.sin(angleRad);

			// 1. Update Scale and Rotation
			this.transform.scale = this.gesture.initialTransform.scale * scaleChange;
			this.transform.rotate = this.gesture.initialTransform.rotate + angleChange;

			// 2. Update Translation so the gesture center stays pinned under the fingers.
			// The image's visual center in screen space is (screenCx + tx, screenCy + ty).
			// The vector from the visual center to the initial gesture center is:
			//   dX = gesture.center.x - (screenCx + initialTx)
			//   dY = gesture.center.y - (screenCy + initialTy)
			// After rotate-by-angleChange and scale-by-scaleChange that vector becomes dX', dY'.
			// We need (screenCx + newTx) + (dX', dY') == currentCenter, so:
			//   newTx = currentCenter.x - screenCx - dX'
			//   newTy = currentCenter.y - screenCy - dY'
			const screenCx = document.body.clientWidth  / 2;
			const screenCy = document.body.clientHeight / 2;
			const dX = this.gesture.center.x - (screenCx + this.gesture.initialTransform.x);
			const dY = this.gesture.center.y - (screenCy + this.gesture.initialTransform.y);
			const dXr = (cos * dX - sin * dY) * scaleChange;
			const dYr = (sin * dX + cos * dY) * scaleChange;
			this.transform.x = currentCenter.x - screenCx - dXr;
			this.transform.y = currentCenter.y - screenCy - dYr;

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
				<img id="main-image" src="${BASE_IMG_PATH}${state.image.path}" loading="lazy" style="transform-origin: 50% 50%"
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
