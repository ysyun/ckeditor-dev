/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/* exported CKBUILDER_CONFIG */

var CKBUILDER_CONFIG = {
	skin: 'moono-lisa',
	ignore: [
		'bender.js',
		'bender.ci.js',
		'.bender',
		'bender-err.log',
		'bender-out.log',
		'.travis.yml',
		'dev',
		'docs',
		'.DS_Store',
		'.editorconfig',
		'.gitignore',
		'.gitattributes',
		'gruntfile.js',
		'.idea',
		'.jscsrc',
		'.jshintignore',
		'.jshintrc',
		'less',
		'.mailmap',
		'node_modules',
		'package.json',
		'README.md',
		'tests'
	],
	plugins: {
		lineutils: 1,
		widgetselection: 1,
		clipboard: 1,
		panelbutton: 1,
		basicstyles: 1,
		bidi: 1,
		blockquote: 1,
		clipboard: 1,
		copyformatting: 1,
		contextmenu: 1,
		dialogadvtab: 1,
		div: 1,
		elementspath: 1,
		enterkey: 1,
		entities: 1,
		find: 1,
		floatingspace: 1,
		font: 1,
		horizontalrule: 1,
		indentblock: 1,
		justify: 1,
		list: 1,
		liststyle: 1,
		magicline: 1,
		pagebreak: 1,
		pastetext: 1,
		removeformat: 1,
		resize: 1,
		selectall: 1,
		showborders: 1,
		stylescombo: 1,
		toolbar: 1,
		undo: 1,
		wysiwygarea: 1
	}
};
