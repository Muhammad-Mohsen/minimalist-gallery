class LabelList extends HTMLElement {
	connectedCallback() {
		this.labels = Repository.Labels.selectAll();
		this.innerHTML = this.render();
	}

	// filtering functions
	toggle(label, notify) {
		const newState = label.state() ? '' : 'active';
		label.state(newState);

		const color = label.dataset.color;
		label.style = `background: ${newState ? color : 'transparent'}; color: ${newState ? 'var(--bg)' : color}; border-color: ${color}`;

		if (notify) this.dispatchCustomEvent('filter', {
			done: this.querySelector('.done-done').state(),
			filters: this.querySelectorAll('.label[state="active"]').toArray().map(l => l.dataset.id)
		});
	}
	toggleDoneDone(doneDone) {
		const states = { // cycles the state
			all: 'done',
			done: 'notdone',
			notdone: 'all'
		};

		doneDone.state(states[doneDone.state()]);
		this.dispatchCustomEvent('filter', {
			done: doneDone.state(),
			filters: this.querySelectorAll('.label[state="active"]').toArray().map(l => l.dataset.id)
		});
	}
	clear() {
		const doneDone = this.querySelector('.done-done');
		doneDone.state('all');

		this.querySelectorAll('.label[state="active"]').toArray().forEach(l => this.toggle(l, false));
		this.dispatchCustomEvent('filter', {
			done: 'all',
			filters: []
		});
	}

	edit() {
		labelsDialog.open();
	}

	backupRestore() {
		backupRestoreDialog.open();
	}

	async backup() {
		const labels = Repository.Labels.selectAll();
		const todos = await Repository.Todos.selectAll();
		const backupData = JSON.stringify({ labels, todos });

		if (navigator.isIPC) {
			EventBus.dispatch({ type: EventBus.Type.BACKUP, target: EventBus.Target.MAIN, data: { backupData } });
		}
		else {
			const blob = new Blob([backupData], { type: 'application/json' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = 'Minimalist TODO backup.json';
			a.click();
			URL.revokeObjectURL(url);
		}
	}
	startRestore() {
		if (navigator.isIPC) EventBus.dispatch({ type: EventBus.Type.RESTORE, target: EventBus.Target.MAIN });
		else this.querySelector('input').click();
	}
	async restore(input) {
		if (input instanceof HTMLElement) {
			const file = input.files[0];
			const data = await file.text();
			input = JSON.parse(data);
		}
		else {
			input = JSON.parse(input);
		}

		const { labels, todos } = input;

		const backedUpLabelIDs = labels.map(l => l.id);
		const existingLabels = Repository.Labels.selectAll()
			.filter(l => !backedUpLabelIDs.includes(l.id));

		// TODO add a modified timestamp and keep items that were modified after the backup
		Repository.Labels.upsert(labels.concat(existingLabels));
		await Repository.Todos.upsert(todos);

		// re-render
		this.connectedCallback();
		todoList.connectedCallback();
	}

	render() {
		const id = this.id;
		return `
			<h3>LABELS</h3>
			${this.labels.map(l => {
				return `<button class="label" style="color: ${l.color}" data-id="${l.id}" data-color="${l.color}" onclick="${id}.toggle(this, true)">${l.text}</button>`;
			}).join('')}
			<button class="filter done-done" state="all" onclick="${id}.toggleDoneDone(this)">&nbsp;DONE & DONE!&nbsp;</button>
			<button class="filter red fill" onclick="${id}.clear()"><span class="material-symbols-outlined">clear</span>CLEAR FILTERS</button>
			<button class="filter white fill" onclick="${id}.edit()"><span class="material-symbols-outlined">edit</span>EDIT LABELS</button>
			<!--
				<span>•</span>
				<button class="filter white fill" onclick="${id}.backupRestore()">BACKUP & RESTORE</button>
			-->

			<h3>BACKUP & RESTORE</h3>
			<input type="file" accept=".json" style="display: none;" oninput="${id}.restore(this)">
			<button class="filter backup green fill" onclick="${id}.backup()"><span class="material-symbols-outlined">arrow_upward</span>BACKUP</button>
			<button class="filter restore blue fill" onclick="${id}.startRestore()"><span class="material-symbols-outlined">arrow_downward</span>RESTORE</button>
		`;
	}
}

customElements.define('label-list', LabelList);
