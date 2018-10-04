/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @fileOverview Image plugin based on Widgets API
 */

'use strict';

CKEDITOR.dialog.add('image3', function (editor) {

	// RegExp: 123, 123px, empty string ""
	var regexGetSizeOrEmpty = /(^\s*(\d+)(px)?\s*$)|^$/i,

		lockButtonId = CKEDITOR.tools.getNextId(),
		resetButtonId = CKEDITOR.tools.getNextId(),

		lang = editor.lang.image3,
		commonLang = editor.lang.common,

		lockResetStyle = 'margin-top:18px;width:40px;height:20px;',
		lockResetHtml = new CKEDITOR.template(
			'<div>' +
			'<a href="javascript:void(0)" tabindex="-1" title="' + lang.lockRatio + '" class="cke_btn_locked" id="{lockButtonId}" role="checkbox">' +
			'<span class="cke_icon"></span>' +
			'<span class="cke_label">' + lang.lockRatio + '</span>' +
			'</a>' +

			'<a href="javascript:void(0)" tabindex="-1" title="' + lang.resetSize + '" class="cke_btn_reset" id="{resetButtonId}" role="button">' +
			'<span class="cke_label">' + lang.resetSize + '</span>' +
			'</a>' +
			'</div>').output({
			lockButtonId: lockButtonId,
			resetButtonId: resetButtonId
		}),

		helpers = CKEDITOR.plugins.image3,

		// Editor instance configuration.
		config = editor.config,

		hasFileBrowser = !!(config.filebrowserImageBrowseUrl || config.filebrowserBrowseUrl),

		// Content restrictions defined by the widget which
		// impact on dialog structure and presence of fields.
		features = editor.widgets.registered.image.features,

		// Functions inherited from image3 plugin.
		getNatural = helpers.getNatural,

		// Global variables referring to the dialog's context.
		doc, widget, image,

		// Global variable referring to this dialog's image pre-loader.
		preLoader,

		// Global variables holding the original size of the image.
		domWidth, domHeight,

		// Global variables related to image pre-loading.
		preLoadedWidth, preLoadedHeight, srcChanged,

		// Global variables related to size locking.
		lockRatio, userDefinedLock,

		// Global variables referring to dialog fields and elements.
		lockButton, resetButton, widthField, heightField,

		natural;

	// Validates dimension. Allowed values are:
	// "123px", "123", "" (empty string)
	function validateDimension() {
		var match = this.getValue().match(regexGetSizeOrEmpty),
			isValid = !!(match && parseInt(match[1], 10) !== 0);

		if (!isValid)
			alert(commonLang['invalidLength'].replace('%1', commonLang[this.id]).replace('%2', 'px')); // jshint ignore:line

		return isValid;
	}

	// Creates a function that pre-loads images. The callback function passes
	// [image, width, height] or null if loading failed.
	//
	// @returns {Function}
	function createPreLoader() {
		var image = doc.createElement('img'),
			listeners = [];

		function addListener(event, callback) {
			listeners.push(image.once(event, function (evt) {
				removeListeners();
				callback(evt);
			}));
		}

		function removeListeners() {
			var l;

			while ((l = listeners.pop()))
				l.removeListener();
		}

		// @param {String} src.
		// @param {Function} callback.
		return function (src, callback, scope) {
			addListener('load', function () {
				// Don't use image.$.(width|height) since it's buggy in IE9-10 (https://dev.ckeditor.com/ticket/11159)
				var dimensions = getNatural(image);

				callback.call(scope, image, dimensions.width, dimensions.height);
			});

			addListener('error', function () {
				callback(null);
			});

			addListener('abort', function () {
				callback(null);
			});

			image.setAttribute('src',
				(config.baseHref || '') + src + '?' + Math.random().toString(16).substring(2));
		};
	}

	// This function updates width and height fields once the
	// "src" field is altered. Along with dimensions, also the
	// dimensions lock is adjusted.
	function onChangeSrc() {
		var value = this.getValue();

		toggleDimensions(false);

		// Remember that src is different than default.
		if (value !== widget.data.src) {
			// Update dimensions of the image once it's preloaded.
			preLoader(value, function (image, width, height) {
				// Re-enable width and height fields.
				toggleDimensions(true);

				// There was problem loading the image. Unlock ratio.
				if (!image)
					return toggleLockRatio(false);

				// Fill width field with the width of the new image.
				widthField.setValue(editor.config.image3_prefillDimensions === false ? 0 : width);

				// Fill height field with the height of the new image.
				heightField.setValue(editor.config.image3_prefillDimensions === false ? 0 : height);

				// Cache the new width.
				preLoadedWidth = width;

				// Cache the new height.
				preLoadedHeight = height;

				// Check for new lock value if image exist.
				toggleLockRatio(helpers.checkHasNaturalRatio(image));
			});

			srcChanged = true;
		}

		// Value is the same as in widget data but is was
		// modified back in time. Roll back dimensions when restoring
		// default src.
		else if (srcChanged) {
			// Re-enable width and height fields.
			toggleDimensions(true);

			// Restore width field with cached width.
			widthField.setValue(domWidth);

			// Restore height field with cached height.
			heightField.setValue(domHeight);

			// Src equals default one back again.
			srcChanged = false;
		}

		// Value is the same as in widget data and it hadn't
		// been modified.
		else {
			// Re-enable width and height fields.
			toggleDimensions(true);
		}

		//base64 image
		imagePreview("file");
	}

	function onChangeDimension() {
		// If ratio is un-locked, then we don't care what's next.
		if (!lockRatio)
			return;

		var value = this.getValue();

		// No reason to auto-scale or unlock if the field is empty.
		if (!value)
			return;

		// If the value of the field is invalid (e.g. with %), unlock ratio.
		if (!value.match(regexGetSizeOrEmpty))
			toggleLockRatio(false);

		// No automatic re-scale when dimension is '0'.
		if (value === '0')
			return;

		var isWidth = this.id == 'width',
			// If dialog opened for the new image, domWidth and domHeight
			// will be empty. Use dimensions from pre-loader in such case instead.
			width = domWidth || preLoadedWidth,
			height = domHeight || preLoadedHeight;

		// If changing width, then auto-scale height.
		if (isWidth)
			value = Math.round(height * (value / width));

		// If changing height, then auto-scale width.
		else
			value = Math.round(width * (value / height));

		// If the value is a number, apply it to the other field.
		if (!isNaN(value))
			(isWidth ? heightField : widthField).setValue(value);
	}

	// Set-up function for lock and reset buttons:
	// 	* Adds lock and reset buttons to focusables. Check if button exist first
	// 	  because it may be disabled e.g. due to ACF restrictions.
	// 	* Register mouseover and mouseout event listeners for UI manipulations.
	// 	* Register click event listeners for buttons.
	function onLoadLockReset() {
		var dialog = this.getDialog();

		function setupMouseClasses(el) {
			el.on('mouseover', function () {
				this.addClass('cke_btn_over');
			}, el);

			el.on('mouseout', function () {
				this.removeClass('cke_btn_over');
			}, el);
		}

		// Create references to lock and reset buttons for this dialog instance.
		lockButton = doc.getById(lockButtonId);
		resetButton = doc.getById(resetButtonId);

		// Activate (Un)LockRatio button
		if (lockButton) {
			// Consider that there's an additional focusable field
			// in the dialog when the "browse" button is visible.
			dialog.addFocusable(lockButton, 4 + hasFileBrowser);

			lockButton.on('click', function (evt) {
				toggleLockRatio();
				evt.data && evt.data.preventDefault();
			}, this.getDialog());

			setupMouseClasses(lockButton);
		}

		// Activate the reset size button.
		if (resetButton) {
			// Consider that there's an additional focusable field
			// in the dialog when the "browse" button is visible.
			dialog.addFocusable(resetButton, 5 + hasFileBrowser);

			// Fills width and height fields with the original dimensions of the
			// image (stored in widget#data since widget#init).
			resetButton.on('click', function (evt) {
				// If there's a new image loaded, reset button should revert
				// cached dimensions of pre-loaded DOM element.
				if (srcChanged) {
					widthField.setValue(preLoadedWidth);
					heightField.setValue(preLoadedHeight);
				}

				// If the old image remains, reset button should revert
				// dimensions as loaded when the dialog was first shown.
				else {
					widthField.setValue(domWidth);
					heightField.setValue(domHeight);
				}

				evt.data && evt.data.preventDefault();
			}, this);

			setupMouseClasses(resetButton);
		}
	}

	function toggleLockRatio(enable) {
		// No locking if there's no radio (i.e. due to ACF).
		if (!lockButton)
			return;

		if (typeof enable == 'boolean') {
			// If user explicitly wants to decide whether
			// to lock or not, don't do anything.
			if (userDefinedLock)
				return;

			lockRatio = enable;
		}

		// Undefined. User changed lock value.
		else {
			var width = widthField.getValue(),
				height;

			userDefinedLock = true;
			lockRatio = !lockRatio;

			// Automatically adjust height to width to match
			// the original ratio (based on dom- dimensions).
			if (lockRatio && width) {
				height = domHeight / domWidth * width;

				if (!isNaN(height))
					heightField.setValue(Math.round(height));
			}
		}

		lockButton[lockRatio ? 'removeClass' : 'addClass']('cke_btn_unlocked');
		lockButton.setAttribute('aria-checked', lockRatio);

		// Ratio button hc presentation - WHITE SQUARE / BLACK SQUARE
		if (CKEDITOR.env.hc) {
			var icon = lockButton.getChild(0);
			icon.setHtml(lockRatio ? CKEDITOR.env.ie ? '\u25A0' : '\u25A3' : CKEDITOR.env.ie ? '\u25A1' : '\u25A2');
		}
	}

	function toggleDimensions(enable) {
		var method = enable ? 'enable' : 'disable';

		widthField[method]();
		heightField[method]();
	}

	var srcBoxChildren = [{
		id: 'src',
		type: 'text',
		label: commonLang.url,
		onKeyup: onChangeSrc,
		onChange: onChangeSrc,
		setup: function (widget) {
			this.setValue(widget.data.src);
		},
		commit: function (widget) {
			widget.setData('src', this.getValue());
		},
		validate: CKEDITOR.dialog.validate.notEmpty(lang.urlMissing)
	}];

	// Render the "Browse" button on demand to avoid an "empty" (hidden child)
	// space in dialog layout that distorts the UI.
	if (hasFileBrowser) {
		srcBoxChildren.push({
			type: 'button',
			id: 'browse',
			// v-align with the 'txtUrl' field.
			// TODO: We need something better than a fixed size here.
			style: 'display:inline-block;margin-top:14px;',
			align: 'center',
			label: editor.lang.common.browseServer,
			hidden: true,
			filebrowser: 'info:src'
		});
	}

	/******************************
	 * 
	 * Base64Image Feature
	 * 
	 ******************************/
	var t = null,
		selectedImg = null,
		orgWidth = null,
		orgHeight = null,
		imgPreview = null,
		imgScal = 1,
		lock = false;

	/* Check File Reader Support */
	function fileSupport() {
		var r = false,
			n = null;
		try {
			if (FileReader) {
				var n = document.createElement("input");
				if (n && "files" in n) r = true;
			}
		} catch (e) {
			r = false;
		}
		n = null;
		return r;
	}
	var fsupport = fileSupport();

	/* Load preview image */
	function imagePreviewLoad(s) {

		/* no preview */
		if (typeof (s) != "string" || !s) {
			imgPreview.getElement().setHtml("");
			return;
		}

		/* Create image */
		var i = new Image();

		/* Display loading text in preview element */
		imgPreview.getElement().setHtml("Loading...");

		/* When image is loaded */
		i.onload = function () {

			/* Remove preview */
			imgPreview.getElement().setHtml("");

			/* fit container of editor at the first time by pyun */
			if (orgWidth == null && orgHeight == null) {
				var editorH = editor.container.$.offsetHeight - 80;
				var editorW = editor.container.$.offsetWidth - 60;
				var ws = this.width / editorW;
				var hs = this.height / editorH;
				if (ws > 1 && hs < 1) {
					this.width = editorW;
					this.height = Math.round(this.height / ws);
				} else if (ws < 1 && hs > 1) {
					this.width = Math.round(this.width / hs);
					this.height = editorH;
				} else if (ws > 1 && hs > 1) {
					if (ws > hs) {
						this.height = Math.round(this.height / ws);
						this.width = Math.round(this.width / ws);
					} else {
						this.height = Math.round(this.height / hs);
						this.width = Math.round(this.width / hs);
					}
				}
			}

			/* Set attributes */
			if (orgWidth == null || orgHeight == null) {
				t.setValueOf("info", "width", this.width);
				t.setValueOf("info", "height", this.height);
				imgScal = 1;
				if (this.height > 0 && this.width > 0) imgScal = this.width / this.height;
				if (imgScal <= 0) imgScal = 1;
			} else {
				orgWidth = null;
				orgHeight = null;
			}
			this.id = editor.id + "previewimage";
			this.setAttribute("style", "max-width:400px;max-height:100px;");
			this.setAttribute("alt", "");

			/* Insert preview image */
			try {
				var p = imgPreview.getElement().$;
				if (p) p.appendChild(this);
			} catch (e) {}

		};

		/* Error Function */
		i.onerror = function () {
			imgPreview.getElement().setHtml("");
		};
		i.onabort = function () {
			imgPreview.getElement().setHtml("");
		};

		/* Load image */
		i.src = s;
	}

	/* Change input values and preview image */
	function imagePreview(src) {

		/* Remove preview */
		imgPreview.getElement().setHtml("");

		if (fsupport) {
			/* Read file and load preview */
			var fileI = t.getContentElement("info", "file");
			var n = null;
			try {
				n = fileI.getInputElement().$;
			} catch (e) {
				n = null;
			}
			if (n && "files" in n && n.files && n.files.length > 0 && n.files[0]) {
				if ("type" in n.files[0] && !n.files[0].type.match("image.*")) return;
				if (!FileReader) return;
				imgPreview.getElement().setHtml("Loading...");
				var fr = new FileReader();
				fr.onload = (function (f) {
					return function (e) {
						imgPreview.getElement().setHtml("");
						imagePreviewLoad(e.target.result);
					};
				})(n.files[0]);
				fr.onerror = function () {
					imgPreview.getElement().setHtml("");
				};
				fr.onabort = function () {
					imgPreview.getElement().setHtml("");
				};
				fr.readAsDataURL(n.files[0]);
			}
		}
	};

	/* Calculate image dimensions */
	function getImageDimensions() {
		var o = {
			"w": t.getContentElement("info", "width").getValue(),
			"h": t.getContentElement("info", "height").getValue(),
			"uw": "px",
			"uh": "px"
		};
		if (o.w.indexOf("%") >= 0) o.uw = "%";
		if (o.h.indexOf("%") >= 0) o.uh = "%";
		o.w = parseInt(o.w, 10);
		o.h = parseInt(o.h, 10);
		if (isNaN(o.w)) o.w = 0;
		if (isNaN(o.h)) o.h = 0;
		return o;
	}

	/* Set image dimensions */
	function imageDimensions(src) {
		var o = getImageDimensions();
		var u = "px";
		if (src == "width") {
			if (o.uw == "%") u = "%";
			o.h = Math.round(o.w / imgScal);
		} else {
			if (o.uh == "%") u = "%";
			o.w = Math.round(o.h * imgScal);
		}
		if (u == "%") {
			o.w += "%";
			o.h += "%";
		}
		t.getContentElement("info", "width").setValue(o.w),
		t.getContentElement("info", "height").setValue(o.h)
	}

	/* Set integer Value */
	function integerValue(elem) {
		var v = elem.getValue(),
			u = "";
		if (v.indexOf("%") >= 0) u = "%";
		v = parseInt(v, 10);
		if (isNaN(v)) v = 0;
		elem.setValue(v + u);
	}

	return {
		title: lang.title,
		minWidth: 450,
		minHeight: 180,
		onLoad: function () {
			// Create a "global" reference to the document for this dialog instance.
			doc = this._.element.getDocument();

			// Create a pre-loader used for determining dimensions of new images.
			preLoader = createPreLoader();

			//base64image
			var fileSelect = this.getContentElement("info", "file");
			fileSelect.getInputElement().on("click", function () {
				imagePreview("file");
			});
			imgPreview = this.getContentElement("info", "preview");
			this.getContentElement("info", "width").getInputElement().on("keyup", function () {
				imageDimensions("width");
			});
			this.getContentElement("info", "height").getInputElement().on("keyup", function () {
				imageDimensions("height");
			});

		},
		onShow: function () {
			// Create a "global" reference to edited widget.
			widget = this.widget;

			// Create a "global" reference to widget's image.
			image = widget.parts.image;

			// Reset global variables.
			srcChanged = userDefinedLock = lockRatio = false;

			// Natural dimensions of the image.
			natural = getNatural(image);

			// Get the natural width of the image.
			preLoadedWidth = domWidth = natural.width;

			// Get the natural height of the image.
			preLoadedHeight = domHeight = natural.height;


			/* Remove preview */
			imgPreview.getElement().setHtml("");
			t = this, orgWidth = null, orgHeight = null, imgScal = 1, lock = true;
			if (widget.data.align == 'none') {
				t.setValueOf("info", "align", 'center');
			} else {
				t.setValueOf("info", "align", widget.data.align);
			}
			if (widget.data.src == '') {
				return;
			}
			selectedImg = image;

			if (typeof (selectedImg.getAttribute("width")) == "string") orgWidth = selectedImg.getAttribute("width");
			if (typeof (selectedImg.getAttribute("height")) == "string") orgHeight = selectedImg.getAttribute("height");
			if ((orgWidth == null || orgHeight == null) && selectedImg.$) {
				orgWidth = selectedImg.$.width;
				orgHeight = selectedImg.$.height;
			}
			if (orgWidth != null && orgHeight != null) {
				t.setValueOf("info", "width", orgWidth);
				t.setValueOf("info", "height", orgHeight);
				orgWidth = parseInt(orgWidth, 10);
				orgHeight = parseInt(orgHeight, 10);
				imgScal = 1;
				if (!isNaN(orgWidth) && !isNaN(orgHeight) && orgHeight > 0 && orgWidth > 0) imgScal = orgWidth / orgHeight;
				if (imgScal <= 0) imgScal = 1;
			}

			if (typeof (selectedImg.getAttribute("src")) == "string") {
				// imagePreview("base64");
				imagePreviewLoad(selectedImg.getAttribute("src"));
			}

		},
		contents: [{
				id: 'info',
				label: lang.infoTab,
				elements: [
					{
						type: "hbox",
						widths: ["70px"],
						children: [
							{
								type: "file",
								id: "file",
								label: "",
								onKeyup: onChangeSrc,
								onChange: onChangeSrc,
								setup: function (widget) {
									this.setValue(widget.data.src);
								},
								commit: function (widget) {
									var src = "";
									try {
										src = CKEDITOR.document.getById(editor.id + "previewimage").$.src;
									} catch (e) {
										src = "";
									}
									if (typeof (src) != "string" || src == null || src === "") return;
									// widget.setData('src', this.getValue());
									widget.setData('src', src);
								},
							}
						]
					},
					{
						type: 'hbox',
						widths: ['25%', '25%', '50%'],
						style: "margin-top:10px;",
						requiredContent: features.dimension.requiredContent,
						children: [{
								type: 'text',
								width: '55px',
								id: 'width',
								label: commonLang.width,
								validate: validateDimension,
								onKeyUp: onChangeDimension,
								onLoad: function () {
									widthField = this;
								},
								setup: function (widget) {
									this.setValue(widget.data.width);
								},
								commit: function (widget) {
									widget.setData('width', this.getValue());
								}
							},
							{
								type: 'text',
								id: 'height',
								width: '55px',
								label: commonLang.height,
								validate: validateDimension,
								onKeyUp: onChangeDimension,
								onLoad: function () {
									heightField = this;
								},
								setup: function (widget) {
									this.setValue(widget.data.height);
								},
								commit: function (widget) {
									widget.setData('height', this.getValue());
								}
							}
						]
					},
					{
						type: 'hbox',
						id: 'alignment',
						style: "margin-top:5px;",
						requiredContent: features.align.requiredContent,
						children: [{
							id: 'align',
							type: 'radio',
							items: [
								// [commonLang.alignNone, 'none'],
								[commonLang.left, 'left'],
								[commonLang.center, 'center'],
								[commonLang.right, 'right']
							],
							label: commonLang.align,
							setup: function (widget) {
								if (widget.data.align == 'none') {
									this.setValue('center');
								} else {
									this.setValue(widget.data.align);
								}
							},
							commit: function (widget) {
								widget.setData('align', this.getValue());
							}
						}]
					},
					{
						type: "html",
						id: "preview",
						style: "margin:20px 0;",
						html: new CKEDITOR.template("<div style=\"text-align:center;\"></div>").output(),
						onLoad: function () {
							imgPreview = this;
						},
					}
				]
			}
		]
	};
});
