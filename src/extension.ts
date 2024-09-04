import Mexp from 'math-expression-evaluator';
import * as vscode from 'vscode';

const config = vscode.workspace.getConfiguration('calculator');
let widget: vscode.StatusBarItem;

function iterateSelections(
    all: boolean,
    callback: (input: string, index: number) => string
): void {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }

    const document = editor.document;
    const selections = editor.selections;

    editor.edit((edit) => {
        selections
            .filter((selection) => !selection.isEmpty || all)
            .forEach((selection, i) => {
                try {
                    const text = document.getText(selection);
                    const result = callback(text, i);
                    if (result === null) {
                        return;
                    }

                    edit.replace(selection, result);
                } catch (ex) {
                    console.error(ex);
                }
            });
    });
}

function evaluateSelections(): void {
    iterateSelections(false, (input) => {
        return `${input} = ${new Mexp().eval(input)}`;
    });
}

function replaceSelections(): void {
    iterateSelections(false, (input) => {
        return new Mexp().eval(input).toString();
    });
}

function countSelections(): void {
    const offset = config.get('count_start', 0);
    iterateSelections(true, (_, i) => {
        return `${i + offset}`;
    });
}

function onSelection(): void {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }

    if (editor.selections.length !== 1 || editor.selection.isEmpty) {
        return;
    }

    try {
        const selectedText = editor.document.getText(editor.selection);
        widget.text = `= ${new Mexp().eval(selectedText)}`;
        widget.show();
    } catch (ex) {}
}

export function activate(context: vscode.ExtensionContext) {
    const command = vscode.commands.registerCommand;
    context.subscriptions.push(
        command('calculator.evaluate', evaluateSelections),
        command('calculator.replace', replaceSelections),
        command('calculator.count', countSelections)
    );

    if (config.get('disable_widget', false)) {
        return;
    }
    2 + 2;
    widget = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
    widget.command = 'calculator._hide_widget';

    context.subscriptions.push(
        // Widget object
        widget,
        // Internal command to hide the widget when clicked
        command('calculator._hide_widget', () => widget.hide()),
        // Subscription to a changing selection to update the widget
        vscode.window.onDidChangeTextEditorSelection(onSelection)
    );
}
