import * as vscode from "vscode";
import { changeSelection } from "./commands/changeSelection";
import { surroundWithInput } from "./commands/surroundWithInput";
import { replaceBracketsOrQuotes } from "./commands/replaceBracketsOrQuotes";

export function activate(context: vscode.ExtensionContext) {
  const changeSelectionCommand = vscode.commands.registerCommand(
    "extension.changeSelection",
    changeSelection
  );
  const removeBracketsCommand = vscode.commands.registerCommand(
    "extension.surroundWithInput",
    surroundWithInput
  );
  const replaceBracketsCommand = vscode.commands.registerCommand(
    "extension.replaceBracketsOrQuotes",
    replaceBracketsOrQuotes
  );

  context.subscriptions.push(changeSelectionCommand);
  context.subscriptions.push(removeBracketsCommand);
  context.subscriptions.push(replaceBracketsCommand);
}

export function deactivate() {}
