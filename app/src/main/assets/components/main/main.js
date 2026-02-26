class MainView extends HTMLElementBase {
	constructor() {
		super();

		window.state = new URLSearchParams(location.search).toMap();
		EventBus.subscribe(this.handler.bind(this));

		window.BASE_IMG_PATH = state.debug ? '' : 'https://appassets.androidplatform.net/file/';
		window.BASE_THUMB_PATH = state.debug ? '' : 'https://appassets.androidplatform.net/thumbnail/';

		if (state.path == '<permission>') {
			document.startViewTransition(() => this.innerHTML = '<permission-view></permission-view>');
		}
		else {
			EventBus.dispatch({ type: EventBus.Type.LIST_FILES, target: EventBus.Target.JS, data: { path: state.path } });
		}
	}

	handler(event) {
		if (event.target != EventBus.Target.NATIVE) return;

		when(event.type)
			.is(EventBus.Type.LIST_FILES, () => {
				const direction = event.data.path.length > (state.path?.length || 0) ? 'forward' : 'back';

				state.path = event.data.path;
				state.items = event.data.items;

				if (state.path == '<permission>') {
					return document.startViewTransition(() => this.innerHTML = '<permission-view></permission-view>');
				}

				document.startViewTransition({
					update: () => {
						this.innerHTML = `
							<explorer-view></explorer-view>
							<image-view src=""></image-view>
						`.minify();

						this.explorerView = this.querySelector('explorer-view');
						this.explorerView.render(state.path, state.items);

						this.imageView = this.querySelector('image-view');
						// this.imageView.render(state.items); // go ahead and set everything up!!
					},
					types: [direction],
				});
			})
			.is(EventBus.Type.BACK, () => {
				// if image, go back to explorer, otherwise, send it back
				if (this.imageView.src) document.startViewTransition({
					update: () => this.imageView.src = '',
					types: ['back'],
				});
				else EventBus.dispatch({ type: EventBus.Type.BACK, target: EventBus.Target.JS });
			})
			.otherwise(() => {
				console.log('Unknown event', event);
			});
	}
}

customElements.define('main-view', MainView);
