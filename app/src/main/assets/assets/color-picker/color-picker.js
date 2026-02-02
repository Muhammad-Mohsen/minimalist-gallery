class ColorPicker extends HTMLElement {

	get value() {
		return this.wheel.hex;
	}
	set value(val) {
		this.wheel.hex = val;
	}

	constructor() {
		super();

		this.wheel = new ReinventedColorWheel({
			appendTo: this,
			hex: this.getAttribute('color'),

			wheelReflectsSaturation: false,

			// handler
			onChange: function (color) {
				color.hex;
			},
		});

		this.style = 'margin-top: 20px; text-align: center;';
	}
}

customElements.define('color-picker', ColorPicker);