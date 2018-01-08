/* bender-tags: editor,4.8.1,forms,586 */
/* bender-ckeditor-plugins: dialog,button,forms,htmlwriter,toolbar */
( function() {
	'use strict';

	function assertFormRequired( obj, formElement, required ) {
		var bot = obj.editorBot;

		function getHtmlContent( formEl ) {
			switch ( formEl ){
				case 'checkbox':
					return ( '[<input ' + required + ' type="checkbox"/>]' );
				case 'radio':
					return ( '[<input ' + required + ' type="radio"/>]' );
				case 'textfield':
					return ( '[<input ' + required + ' type="text"/>]' );
				case 'textarea':
					return ( '[<textarea ' + required + '></textarea>]' );
				case 'select':
					return ( '[<select ' + required + '></select>]' );
			}
		}

		bot.setHtmlWithSelection( getHtmlContent( formElement ) );
		bot.dialog( formElement, function( dialog ) {
			assert.areSame( true, dialog.getValueOf( 'info', 'required' ) );
			dialog.getButton( 'ok' ).click();
		} );
	}

	bender.editor = {};

	bender.test( {
		'input checkbox initial required': function() {
			assertFormRequired( this , 'checkbox' , 'required' );
		},
		'input checkbox initial required=""': function() {
			assertFormRequired( this , 'checkbox' , 'required=""' );
		},
		'input checkbox initial required="required"': function() {
			assertFormRequired( this , 'checkbox' , 'required="required"' );
		},
		'input radio initial required': function() {
			assertFormRequired( this , 'radio' , 'required' );
		},
		'input text initial required': function() {
			assertFormRequired( this , 'textfield' , 'required' );
		},
		'textarea initial required': function() {
			assertFormRequired( this , 'textarea' , 'required' );
		},
		'select initial required': function() {
			assertFormRequired( this , 'select' , 'required' );
		}
	} );

} )();
