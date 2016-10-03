
      /*#######.
     ########",#:
   #########',##".
  ##'##'## .##',##.
   ## ## ## # ##",#.
    ## ## ## ## ##'
     ## ## ## :##
      ## ## ##*/

'use strict'
import * as path from 'path'
import * as vscode from 'vscode'
import * as moment from 'moment'

import {
  ExtensionContext, TextEdit, TextEditorEdit, TextDocument, Position, Range
} from 'vscode'

import {
  extractHeader, getHeaderInfo, updateHeaderInfo, renderHeader,
  supportsLanguage, IHeaderInfo
} from './header'

/**
 * `insertHeader` Command Handler
 */
function insertHeaderHandler() {
  let activeTextEditor = vscode.window.activeTextEditor
  let document = activeTextEditor.document
  let languageId = document.languageId

  if (supportsLanguage(languageId)) {
    activeTextEditor.edit(editor => {
      let currentHeader = extractHeader(document.getText())

      if (currentHeader) {
        let headerInfo = getHeaderInfo(currentHeader)
        let updatedHeaderInfo = updateHeaderInfo(headerInfo)
        let header = renderHeader(languageId, updatedHeaderInfo)

        editor.replace(new Range(0, 0, 12, 0), header)
      }
      else {
        let user = process.env['USER']
        let headerInfo = {
          filename: path.basename(document.fileName),
          author: `${user} <${user}@student.42.fr>`,
          createdBy: user,
          createdAt: moment(),
          updatedBy: user,
          updatedAt: moment()
        }
        let header = renderHeader(languageId, headerInfo)
        editor.insert(new Position(0, 0), header)
      }
    })
  }
  else
    vscode.window.showInformationMessage(
      `No header support for language ${languageId}`)
}

/**
 * Start watcher for document save to update current header
 */
function startHeaderUpdateOnSaveWatcher(subscriptions: vscode.Disposable[]) {
  const ignoreNextSave = new WeakSet()

  // Here we use the trick from Luke Hoban Go Extension,
  // But this will cause an infinite loop if another extension that
  // uses the same technique is active.
  // And it's really ugly.
  vscode.workspace.onDidSaveTextDocument(document => {
    let textEditor = vscode.window.activeTextEditor

    if (textEditor.document === document
      && !ignoreNextSave.has(document)) {
      let activeTextEditor = vscode.window.activeTextEditor
      let languageId = document.languageId
      let currentHeader = extractHeader(document.getText())

      // If current language is supported
      // and a header is present at top of document
      if (supportsLanguage(languageId) && currentHeader) {
        textEditor.edit(editor => {
          let headerInfo = getHeaderInfo(currentHeader)
          let updatedHeaderInfo = updateHeaderInfo(headerInfo)
          let header = renderHeader(languageId, updatedHeaderInfo)

          editor.replace(new Range(0, 0, 12, 0), header)
        })
          .then(applied => {
            ignoreNextSave.add(document)
            return document.save()
          })
          .then(() => {
            ignoreNextSave.delete(document)
          }, err => { })
      }
    }
  }, null, subscriptions)
}

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands
    .registerTextEditorCommand('42header.insertHeader', insertHeaderHandler)

  context.subscriptions.push(disposable)
  startHeaderUpdateOnSaveWatcher(context.subscriptions)
}

export function deactivate() {
}
