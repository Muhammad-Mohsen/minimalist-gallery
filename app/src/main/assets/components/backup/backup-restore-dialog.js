class BackupRestoreDialog extends HTMLElement {
	connectedCallback() {
		this.setAttribute('inert', 'true');
	}

	open() {
		this.innerHTML = this.render();

		this.setAttribute('open', '');
		this.removeAttribute('inert');
	}
	close() {
		this.setAttribute('inert', 'true');
		this.removeAttribute('open');
	}

	async backup() {
		const labels = Repository.Labels.selectAll();
		const todos = await Repository.Todos.selectAll();

		// download the data
		const data = JSON.stringify({ labels, todos });
		const blob = new Blob([data], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'Minimalist TODO backup.json';
		a.click();
		URL.revokeObjectURL(url);
	}
	selectFile() {
		this.querySelector('input').click();
	}

	async restore(input) {
		const file = input.files[0];
		const data = await file.text();
		const { labels, todos } = JSON.parse(data);

		const backedUpLabelIDs = labels.map(l => l.id);
		const existingLabels = Repository.Labels.selectAll()
			.filter(l => !backedUpLabelIDs.includes(l.id));

		// TODO add a modified timestamp and keep items that were modified after the backup
		Repository.Labels.upsert(labels.concat(existingLabels));
		await Repository.Todos.upsert(todos);

		this.dispatchCustomEvent('close');
		this.close();
	}

	render() {
		const id = this.id;

		return `
			<h1>BACKUP & RESTORE</h1>
			<main>
				<input type="file" accept=".json" style="display: none;" oninput="${id}.restore(this)">

				<div class="row">
					<button class="green" onclick="${id}.backup()"><span class="material-symbols-outlined">upload</span>BACKUP</button>
					<button class="blue" onclick="${id}.selectFile()"><span class="material-symbols-outlined">download</span>RESTORE</button>
				</div>
				<p>Backups are stored locally in plain-text.</p>
			</main>

			<footer>
				<button class="material-symbols-outlined fab" onclick="${id}.close()">west</button>
			</footer>
		`;
	}
}

customElements.define('backup-restore-dialog', BackupRestoreDialog);