setTimeout(() => document.body.classList.add('show'), 10);

EventBus.subscribe((event) => {
	if (event.target == EventBus.Target.MAIN) return;

    switch (event.type) {
        case EventBus.Type.RESTORE:
            return labelList.restore(event.data.backupData);

        case EventBus.Type.BACK:
            if (todoDialog.isOpen()) return todoDialog.back();
            else if (labelsDialog.isOpen()) return labelsDialog.saveAndClose();
            else if (todoList.isMoving()) return todoList.moveItemCancel();

            return EventBus.dispatch({ type: EventBus.Type.BACK, target: EventBus.Target.MAIN });
    }

    if (event.type == EventBus.Type.RESTORE) {
        labelList.restore(event.data.backupData);
    }
});
