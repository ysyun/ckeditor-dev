These files are overrided file for adapting the Tidemark Application.
So, We have to copy&paste these files to proper location in plugins/skins after update original plugins/skins of CKEditor.

## core
  - ckeditor.js: remove it in CKEDITOR.resourceManager.prototype.add
    ```
    if ( this.registered[ name ] )
			throw new Error( '[CKEDITOR.resourceManager.add] The resource name "' + name + '" is already registered.' );
    ```

## plugins
  - plugins/backup
    - base64image.js: modified to adapt into the same look and feel, remove unnecessary feature
    - link.js: There is a bug to go to link url. fetch it.
    - colordialog: change plugin all source base to adapt into the same look and feel
    check styles/partials/base/_adhoc-canvas-ckeditor4.scss for the same look and feel to Tidemark application style.
  - colors-advanced.js: overried colorbutton and colordialog of colors.

## skins
  - moono-lisa/editor.css: modified font size and etc

## environment
  - ckeditor-path.js: define the download path of plugin of CKEditor.
  - config.js: modified configuration for adapt the requirements