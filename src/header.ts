
      /*#######.
     ########",#:
   #########',##".
  ##'##'## .##',##.
   ## ## ## # ##",#.
    ## ## ## ## ##'
     ## ## ## :##
      ## ## ##*/

import * as moment from 'moment'
import { languageDemiliters } from './delimiters'

export interface IHeaderInfo {
  filename: string,
  author: string,
  createdBy: string,
  createdAt: moment.Moment,
  updatedBy: string,
  updatedAt: moment.Moment
}

/**
 * Template where each field name is prefixed by $ and is padded with _
 */
/*
const genericTemplate = `
********************************************************************************
*                                                                              *
*                                                         :::      ::::::::    *
*    $FILENAME__________________________________        :+:      :+:    :+:    *
*                                                     +:+ +:+         +:+      *
*    By: $AUTHOR________________________________    +#+  +:+       +#+         *
*                                                 +#+#+#+#+#+   +#+            *
*    Created: $CREATEDAT_________ by $CREATEDBY_       #+#    #+#              *
*    Updated: $UPDATEDAT_________ by $UPDATEDBY_      ###   ########.fr        *
*                                                                              *
********************************************************************************

`.substring(1)
*/

const genericTemplate = `
********************************************************************************
*                                                                              *
*                                                   _____  ______    ____  ___ *
*    $FILENAME__________________________________   /  _  \ |    |    \   \/  / *
*                                                 /  /_\  \|    |     \     /  *
*    By: $AUTHOR________________________________ /    |    \    |___  /     \  *
*                                                \____|__  /_______ \/___/\  \ *
*    Created: $CREATEDAT_________ by $CREATEDBY_         \/        \/      \_/ *
*    Updated: $UPDATEDAT_________ by $UPDATEDBY_                               *
*                                                                              *
********************************************************************************

`.substring(1)

/**
 * Get header template from languageId
 * Obtenir un modèle d'en-tête à partir de languageId
 */
const getTemplate = (languageId: string) => {
  let [left, right] = languageDemiliters[languageId]
  let width = left.length

  // Replace all delimiters with ones for current language
  // Remplacer tous les délimiteurs par ceux de la langue actuelle.
  return genericTemplate
    .replace(new RegExp(`^(.{${width}})(.*)(.{${width}})$`, 'gm'),
    left + '$2' + right)
}

/**
 * Fit value to correct field width, padded with spaces
 * Adapter la valeur à la largeur correcte du champ, avec des espaces.
 */
const pad = (value: string, width: number) =>
  value.concat(' '.repeat(width)).substr(0, width)

/**
 * Stringify Date to correct format for header
 * Stringify Date au format correct pour l'en-tête
 */
const formatDate = (date: moment.Moment) =>
  date.format('YYYY/MM/DD HH:mm:ss')

/**
 * Get Date object from date string formatted for header
 * Obtenez l'objet Date à partir de la chaîne de date formatée pour l'en-tête.
 */
const parseDate = (date: string) =>
  moment(date, 'YYYY/MM/DD HH:mm:ss')

/**
 * Check if language is supported
 * Vérifiez si la langue est prise en charge
 */
export const supportsLanguage = (languageId: string) =>
  !!languageDemiliters[languageId]

/**
 * Returns current header as string if present at top of document
 * Retourne l'en-tête actuel sous forme de chaîne de caractères s'il est présent en haut du document.
 */
export const extractHeader = (text: string): string | null => {
  let headerRegex = `^(.{80}\n){10}`
  let match = text.match(headerRegex)

  return match ? match[0] : null
}

/**
 * Regex to match field in template
 * Returns [ global match, offset, field ]
 * Regex pour faire correspondre le champ dans le modèle
 * Retourne [ correspondance globale, décalage, champ ].
 */
const fieldRegex = (name: string) =>
  new RegExp(`^((?:.*\\\n)*.*)(\\\$${name}_*)`, '')

/**
 * Get value by field name in header string
 * Obtenir la valeur du nom du champ dans la chaîne d'en-tête
 */
const getFieldValue = (header: string, name: string) => {
  let [_, offset, field] = genericTemplate.match(fieldRegex(name))

  return header.substr(offset.length, field.length)
}

/**
 * Set field value in header string
 * Définir la valeur du champ dans la chaîne d'en-tête
 */
const setFieldValue = (header: string, name: string, value: string) => {
  let [_, offset, field] = genericTemplate.match(fieldRegex(name))

  return header.substr(0, offset.length)
    .concat(pad(value, field.length))
    .concat(header.substr(offset.length + field.length))
}

/**
 * Extract header info from header string
 * Extrait les informations d'en-tête de la chaîne d'en-tête
 */
export const getHeaderInfo = (header: string): IHeaderInfo => ({
  filename: getFieldValue(header, 'FILENAME'),
  author: getFieldValue(header, 'AUTHOR'),
  createdBy: getFieldValue(header, 'CREATEDBY'),
  createdAt: parseDate(getFieldValue(header, 'CREATEDAT')),
  updatedBy: getFieldValue(header, 'UPDATEDBY'),
  updatedAt: parseDate(getFieldValue(header, 'UPDATEDAT'))
})

/**
 * Update header info with current time and last author
 * Mise à jour des informations d'en-tête avec l'heure actuelle et le dernier auteur
 */
export const updateHeaderInfo = (info: IHeaderInfo): IHeaderInfo => ({
  filename: info.filename,
  author: `unknown <unknown@student.42.fr>`,
  createdBy: info.createdBy,
  createdAt: info.createdAt,
  updatedBy: `unknown`,
  updatedAt: moment()
})

/**
 * Renders a language template with header info
 * Rend un modèle de langue avec des informations d'en-tête
 */
export const renderHeader = (languageId: string, info: IHeaderInfo) => [
  {
    name: 'FILENAME',
    value: info.filename
  },
  {
    name: 'AUTHOR',
    value: `unknown <unknown@student.42.fr>`
  },
  {
    name: 'CREATEDAT',
    value: formatDate(info.createdAt)
  },
  {
    name: 'CREATEDBY',
    value: `unknown`
  },
  {
    name: 'UPDATEDAT',
    value: formatDate(info.updatedAt)
  },
  {
    name: 'UPDATEDBY',
    value: `unknown`
  }
].reduce((header, field) =>
  setFieldValue(header, field.name, field.value),
  getTemplate(languageId))
