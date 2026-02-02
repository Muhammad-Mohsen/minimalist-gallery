JSON.copy = function (obj) {
	return JSON.parse(JSON.stringify(obj));
}
JSON.tryParse = function (str, defualt) {
	try { return JSON.parse(str); }
	catch { return defualt; }
}

Math.clamp = function (from, num, to) {
	if (from > to) throw 'YouDumbException!';
	return Math.min(Math.max(from, num), to);
}

NodeList.prototype.toArray = function () { return [...this]; }
HTMLCollection.prototype.toArray = function () { return [...this]; }

HTMLButtonElement.prototype.state = function (state) {
	if (state != undefined) return this.setAttribute('state', state);
	else return this.getAttribute('state');
}

HTMLElement.prototype.appendHTML = function (html, options) {
	if (options.replaceSelector) {
		this.querySelector(options.replaceSelector).remove();
		return this.insertAdjacentHTML('beforeend', html);
	}

	if (options.ifNotExistsSelector && !this.querySelector(options.ifNotExistsSelector)) {
		return this.insertAdjacentHTML('beforeend', html);
	}
}

HTMLElement.prototype.dispatchCustomEvent = function (name, data) {
	new Function(`
		const event = new CustomEvent('${name}', {
			bubbles: false,
			cancelable: true,
			detail: ${JSON.stringify(data)}
		});

		this.dispatchEvent(event);

		${this.getAttribute(`on${name}`)};
	`)();
}

String.prototype.minify = function () {
	return this.replace(/[\t\n]/g, '').replace(/\s+/g, ' ');
}

window.navigator.isIPC = window.IPC;