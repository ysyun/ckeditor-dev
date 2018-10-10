( function() {

    CKEDITOR.plugins.add("base64image", {
        lang 	: 	["af","ar","bg","bn","bs","ca","cs","cy","da","de","de-ch","el","en","en-au","en-ca","en-gb","eo","es","et","eu","fa","fi","fo","fr","fr-ca","gl","gu","he","hi","hr","hu","id","is","it","ja","ka","km","ko","ku","lt","lv","mk","mn","ms","nb","nl","no","pl","pt","pt-br","ro","ru","si","sk","sl","sq","sr","sr-latn","sv","th","tr","ug","uk","vi","zh","zh-cn"],
        requires: 	"widget,dialog",
        icons	:	"base64image",
        hidpi	:	true,
        init	: 	function(editor){
                        var pluginName = 'base64imageDialog';
                        
                        editor.ui.addButton("base64image", {
                            label: editor.lang.common.image,
                            command: pluginName,
                            toolbar: "insert"
                        });
                        CKEDITOR.dialog.add(pluginName, this.path+"dialogs/base64image.js");
                        
                        var allowed = 'img[alt,!src]{border-style,border-width,float,height,margin,margin-bottom,margin-left,margin-right,margin-top,width,display}',
                            required = 'img[alt,src]';
                        
                        editor.addCommand( pluginName, new CKEDITOR.dialogCommand( pluginName, {
                            allowedContent: allowed,
                            requiredContent: required,
                            contentTransformations: [
                                [ 'img{width}: sizeToStyle', 'img[width]: sizeToAttribute' ],
                                [ 'img{float}: alignmentToStyle', 'img[align]: alignmentToAttribute' ]
                            ]
                        } ) );
                        editor.on("doubleclick", function(evt){
                            if(evt.data.element && !evt.data.element.isReadOnly() && evt.data.element.getName() === "img") {
                                evt.data.dialog = pluginName;
                                editor.getSelection().selectElement(evt.data.element);
                            }
                        });
                        if(editor.addMenuItem) {
                            editor.addMenuGroup("base64imageGroup");
                            editor.addMenuItem("base64imageItem", {
                                label: editor.lang.common.image,
                                icon: this.path+"icons/base64image.png",
                                command: pluginName,
                                group: "base64imageGroup"
                            });
                        }
                        if(editor.contextMenu) {
                            editor.contextMenu.addListener(function(element, selection) {
                                if(element && element.getName() === "img") {
                                    editor.getSelection().selectElement(element);
                                    return { base64imageItem: CKEDITOR.TRISTATE_ON };
                                }
                                return null;
                            });
                        }
                    },
        afterInit:  function( editor ) {
                        // Integrate with align commands (justify plugin).
                        var align = { left: 1, right: 1, center: 1, block: 1 },
                            integrate = alignCommandIntegrator( editor );
            
                        for ( var value in align )
                            integrate( value );
                    }
    });


    function alignCommandIntegrator( editor ) {
		var execCallbacks = [],
			enabled;

		return function( value ) {
			var command = editor.getCommand( 'justify' + value );

			// Most likely, the justify plugin isn't loaded.
			if ( !command )
				return;

			// This command will be manually refreshed along with
			// other commands after exec.
			execCallbacks.push( function() {
				command.refresh( editor, editor.elementPath() );
			} );

			if ( value in { right: 1, left: 1, center: 1 } ) {
				command.on( 'exec', function( evt ) {
					var widget = getFocusedWidget( editor );

					if ( widget ) {
						widget.setData( 'align', value );

						// Once the widget changed its align, all the align commands
						// must be refreshed: the event is to be cancelled.
						for ( var i = execCallbacks.length; i--; )
							execCallbacks[ i ]();

						evt.cancel();
					}
				} );
			}

			command.on( 'refresh', function( evt ) {
				var widget = getFocusedWidget( editor ),
					allowed = { right: 1, left: 1, center: 1 };

				if ( !widget )
					return;

				// Cache "enabled" on first use. This is because filter#checkFeature may
				// not be available during plugin's afterInit in the future — a moment when
				// alignCommandIntegrator is called.
				if ( enabled === undefined )
					enabled = editor.filter.checkFeature( editor.widgets.registered.image.features.align );

				// Don't allow justify commands when widget alignment is disabled (https://dev.ckeditor.com/ticket/11004).
				if ( !enabled )
					this.setState( CKEDITOR.TRISTATE_DISABLED );
				else {
					this.setState(
						( widget.data.align == value ) ? (
							CKEDITOR.TRISTATE_ON
						) : (
							( value in allowed ) ? CKEDITOR.TRISTATE_OFF : CKEDITOR.TRISTATE_DISABLED
						)
					);
				}

				evt.cancel();
			} );
		};
	}

    // Returns the focused widget, if of the type specific for this plugin.
    // If no widget is focused, `null` is returned.
    //
    // @param {CKEDITOR.editor}
    // @returns {CKEDITOR.plugins.widget}
    function getFocusedWidget(editor) {
        if (!editor.widgets) { return; }
        var widget = editor.widgets.focused;

        if (widget && widget.name == 'image')
            return widget;

        return null;
    }

})();