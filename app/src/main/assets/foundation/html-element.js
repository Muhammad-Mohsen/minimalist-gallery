class HTMLElementBase extends HTMLElement {
	static lang = new URLSearchParams(location.search).get('lang');
	static ident = 0;
	handle;

	constructor() {
		super();

		this.handle = `${this.constructor.name}_${HTMLElementBase.ident++}`;
		window[this.handle] = this;
	}

	render(template) {
		this.innerHTML = template.minify();

		// direct access to ID'd elements
		this.querySelectorAll('[id]').forEach(elem => {
			const camel = elem.id.replace(/-./g, x => x[1].toUpperCase()); // kebab-case to camelCase
			this[camel] = elem;
		});
	}

	toString() {
		return this.handle;
	}

	// translations
	translation(keyOrComponent) {
		if (typeof keyOrComponent == 'string') return this.#translateString(keyOrComponent);
		else return this.#translateComponent(keyOrComponent);
	}
	#translateString(key) {
		return translations[key][HTMLElementBase.lang] || key;
	}
	#translateComponent(component) {
		if (!HTMLElementBase.lang) return; // use default

		component.querySelectorAll('[l10n]').forEach(elem => {
			try {
				const key = elem.innerHTML;
				elem.innerHTML = translations[key][HTMLElementBase.lang] || key;

			} catch {
				console.log(elem.innerHTML || elem);
			}
		});

		component.querySelectorAll('[aria-label]').forEach(elem => {
			try {
				const key = elem.getAttribute('aria-label');
				elem.setAttribute('aria-label', translations[key][HTMLElementBase.lang] || key);

			} catch {
				console.log(elem.getAttribute('aria-label') || elem);
			}
		});
	}
}
