CKEDITOR.editorConfig = function (config) {
	config.toolbarGroups = [
		{ name: 'basicstyles', groups: ['basicstyles', 'cleanup'] },
		{ name: 'styles', groups: ['styles'] },
		'/',
		{ name: 'colors', groups: ['colors'] },
		// { name: 'forms', groups: ['forms'] },
		{ name: 'insert', groups: ['insert'] },
		{ name: 'paragraph', groups: ['list', 'indent', 'blocks', 'align', 'bidi', 'paragraph'] },
		{ name: 'links', groups: ['links'] },
		// { name: 'editing', groups: ['find', 'selection', 'spellchecker', 'editing'] },
		{ name: 'editing', groups: ['find', 'selection', 'editing'] },
		{ name: 'clipboard', groups: ['clipboard', 'undo'] },
		{ name: 'document', groups: ['mode', 'document', 'doctools'] },
		// '/',
		// { name: 'tools', groups: ['tools'] },
		// { name: 'others', groups: ['others'] },
		// { name: 'about', groups: ['about'] }
	];

	config.resize_enabled = true;
	config.resize_dir = 'both';

	config.removeButtons = 'Source,Preview,NewPage,Templates,Cut,Copy,Paste,PasteText,SelectAll,Replace,Find,Format,Styles,RemoveFormat,Blockquote,CreateDiv,BidiLtr,BidiRtl,Language,Unlink,Anchor,Image,Table,Smiley,SpecialChar,PageBreak';

	// for Link plugin
	config.linkShowAdvancedTab = false;
	config.linkShowTargetTab = false;
	// ESP-3828: Browser dialog window should not appear, image upload window should be closed with discarded changes
	config.dialog_noConfirmCancel = true
	// ESP-3905
	config.extraPlugins = 'dragresize';
};