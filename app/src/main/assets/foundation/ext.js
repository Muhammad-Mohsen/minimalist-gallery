window.navigator.isIPC = window.IPC;

String.prototype.htmlEncode = function () {
	return this.replace(/[&<>'"]/g,
		tag => ({
			'&': '&amp;',
			'<': '&lt;',
			'>': '&gt;',
			"'": '&#39;',
			'"': '&quot;'
		}[tag]));
}
String.prototype.htmlDecode = function () {
	return this.replace(/[&<>'"]/g,
		tag => ({
			'&amp;': '&',
			'&lt;': '<',
			'&gt;': '>',
			'&#39;': "'",
			'&quot;': '"'
		}[tag]));
}
String.prototype.toElement = function () {
	// when doing table rows, using a div will remove the <tr> and instead only have what's inside the first <td>!!
	const container = this.startsWith('<tr') ? document.createElement('tbody') : document.createElement('div');
	container.innerHTML = this;
	return container.firstElementChild;
}
String.prototype.minify = function () {
	return this.replace(/\t|\n/g, '').replace(/\s{2,}/g, ' ').replace(/<script/gi, '&lt;script');
}

Array.prototype.unique = function () {
	return [...new Set(this)];
}

Number.isNumber = function (val) {
	return !isNaN(parseFloat(val)) && isFinite(val);
}

Date.prototype.format = function (format, isLocal) {
	var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
	var monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

	var daysShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

	var yyyy = isLocal ? this.getFullYear() : this.getUTCFullYear();
	var MM = isLocal ? this.getMonth() : this.getUTCMonth();
	var MMM = monthsShort[MM];

	var dd = isLocal ? this.getDate() : this.getUTCDate();

	var hh = (isLocal ? this.getHours() : this.getUTCHours()).toString().padStart(2, '0');
	var HH = (hh % 12 || 12).toString().padStart(2, '0');
	var mm = (isLocal ? this.getMinutes() : this.getUTCMinutes()).toString().padStart(2, '0');
	var ss = (isLocal ? this.getSeconds() : this.getUTCSeconds()).toString().padStart(2, '0');
	var sss = isLocal ? this.getMilliseconds() : this.getUTCMilliseconds().toString().padStart(3, '0');

	var tt = hh / 12 ? 'pm' : 'am';
	var TT = tt.toUpperCase();

	return format
		.replace('yyyy', yyyy)
		.replace('MMM', MMM)
		.replace('MM', MM)
		.replace('dd', dd.toString().padStart(2, '0'))
		.replace('d', dd)
		.replace('hh', hh)
		.replace('HH', HH)
		.replace('mm', mm)
		.replace('sss', sss)
		.replace('ss', ss)
		.replace('tt', tt)
		.replace('TT', TT)
}

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
DOMTokenList.prototype.includes = DOMTokenList.prototype.contains;

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
HTMLElement.prototype.disable = function () {
	this.setAttribute('disabled', '');
	this.setAttribute('inert', '');
}
HTMLElement.prototype.enable = function () {
	this.removeAttribute('disabled');
	this.removeAttribute('inert');
}
HTMLElement.prototype.toggle = function (force) {
	force ? this.enable() : this.disable();
}

HTMLElement.prototype.dispatchChange = function () {
	this.dispatchEvent(new Event('change', { bubbles: true }));
}
HTMLElement.prototype.dispatchInput = function () {
	this.dispatchEvent(new Event('input', { bubbles: true }));
}
HTMLElement.prototype.addClass = function (classList) {
	this.classList.add(...classList.split(' '));
	return this;
}
HTMLElement.prototype.removeClass = function (classList) {
	this.classList.remove(...classList.split(' '));
	return this;
}
HTMLElement.prototype.toggleClass = function (classList, force) {
	this.classList.toggle(...classList.split(' '), force);
	return this;
}

// WHEN expression
class WhenExpression {
	#done;
	#result;

	constructor(param) {
		this.param = param;
	}

	is = (val, callback) => {
		if (this.#result != undefined || this.#done) return this;

		if (this.param == val // simple value
			|| (Array.isArray(val) && val.includes(this.param)) // array
			|| val === true // expression
		) {
			this.#result = callback();
			this.#done = true;
		}
		return this;
	}
	otherwise = (callback) => {
		if (this.#result != undefined || this.#done) return this;
		else this.#result = callback();
		return this;
	}

	val = () => this.#result;
}

function when(param) {
	return new WhenExpression(param);
}