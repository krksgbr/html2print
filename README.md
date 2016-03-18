

# html2print
#### Fork of [osp.tools.html2print](https://github.com/osp/osp.tools.html2print).


The purpose of this fork is to provide a straightforward way of creating web/print hybrid publications,
and to make it easy to integrate with existing web projects.

## **Usage**:

1.  clone the repository and put it somewhere in your project
2.  link **dist/js/html2print.js** to the html file that you want to turn into print. the script depends on jquery,
    so make sure to have it linked before html2print.

3.  copy the **h2p_config.json** to the root of your project directory and change its settings to your requirements.
    page settings, print-specific stylesheets and scripts are defined here.
    the script files that are defined in this configuration will only execute in the context of the print document.
    if your print-specific script defined in the config file is also dependent on jquery, then jquery should also be
    listed in the config file.

    **for example:**
    ```
    {
        "pages": {
            "count": 100,                          <---     there is no way of knowing how many pages will be needed beforehand.
            "paper-width":      "210mm",                    empty pages will be trimmed at the end of the process.
            "paper-height":     "297mm",
            "crop-size":        "5mm",
            "bleed":            "3mm",
            "margin-inside":    "50mm",
            "margin-outside":   "8mm",
            "margin-bottom":    "25mm",
            "margin-top":       "10mm",
            "header-height":    "10mm",
            "footer-height":    "10mm",
            "header-text":      "''",
            "footer-text":      "''",
            "mirror":           "true"           
        },

        "styles": {
            "print":        "css/print.css",    
            "ui-override":  "css/h2p-ui.css"    <--- override default ui style
        },

        "scripts": [
                "../lib/jquery/dist/jquery.min.js",
                "js/print.js"
        ],

        "route": "#print"    <--- this will define what route will be created for the print version. this is also shareable.
    }
    ```


4.  mark html elements that should be included in the print version with the **'h2p-content'** class.
    if within these there is content that should be excluded, mark it with the **'h2p-exclude'** class.

    **for example:**
    ```
    <div id="#my-content" class="h2p-include">

        <div>Amazing Stories</div>

        <div id="#not-for-print" class="h2p-exclude">
        </div>

    </div>

    ```


5.  invoke the script by calling `H2P.init()`. it will then process the source document into a print version applying the stylesheets
    and scripts that were specified in the configuration file.

6.  there is a possibility to specify code to be run as soon as the layout process has finished and the pages are ready.
    this is handy when there is a requirement to have access to the pages, for example for putting page-numbers or other content
    to locations that the default html2print style setup doesn't allow for.
    this is accomplished by running `H2P.doAfterLayout(function(){ stuff(); })`; in a script defined in the config file.
    **for example:**

    ```
    H2P.doAfterLayout(function(){
        $('.page').each(function(index){
            var customPageNumber = $("<div>").text(index+1).addClass("custom-page-number");
            $(this).find( ".body" ).append(customPageNumber);
        });
    });
    ```


    To learn more, have a look at the example folder.


## Browser support

tested in Firefox 44.0.2
and Chrome 49.0.2623.87
on Mac OSX 10.11.3

in Safari it's currently broken.
`


## Attributions

#### [the original html2print by Open Source Publishing](https://github.com/osp/osp.tools.html2print)

#### [less.js]( http://lesscss.org/)
[license](https://github.com/less/less.js/blob/master/LICENSE)

#### [CSS Regions Polyfill](https://github.com/FremyCompany/css-regions-polyfill)   
[license](https://github.com/FremyCompany/css-regions-polyfill/blob/master/LICENSE.md)
