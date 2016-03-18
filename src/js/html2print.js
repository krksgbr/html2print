var H2P = (function () {

    var userConfigPath = 'h2p_config.json';

    // things that will be loaded into the iframe
    var dirName = 'html2print/';

    // getting script location, to know where H2P resources are located
    var dirPath = document.currentScript.src.split(dirName)[0] + dirName;

    // libraries H2P depends on
    var libPaths = [    dirPath + 'lib/css-regions-polyfill/bin/css-regions-polyfill.js',
                        dirPath + 'lib/less/dist/less.min.js'
    ];


    //  style that goes inside the iframe
    //  defines the setup of paper, pages etc.
    var innerStylePath =    dirPath + 'dist/less/html2print.less';

    //  style that goes outside the iframe
    //  defines the look of the toolbar and size/positioning of iframe
    var outerStylePath =    dirPath + 'dist/css/outerUI.css';

    // ui components html
    var uiComponentsPath =  dirPath + 'dist/html/ui.html';

    //master page template html
    var masterPageTemplatePath = dirPath + 'dist/html/masterpage.html';


    var userConfig = null;
    var h2pInitialized = false;



    var RouteHandler = (function(){


        function canResolve(){
            return location.hash === userConfig['route'];
        }


        return {

            setConfiguredRoute:
            function(){
                window.location.hash = userConfig['route'];
            },

            isConfiguredRoute:
            function(){
                return new Promise(function(resolve){
                    if(canResolve()){
                        resolve();
                    }

                    //for forward button
                    window.addEventListener('hashchange', function(){
                        if(canResolve() && !h2pInitialized){
                            resolve();
                        }
                    });
                });
            },

            restoreHash:
            function(){
                location.hash = "";
            },

            backButtonPressed:
            function(){
                return new Promise(function(resolve){
                    //when backbutton is pressed, remove all h2p things
                    window.addEventListener('popstate', function(){
                        resolve();
                        window.removeEventListener('popstate', this);
                    });
                });
            }
        }

    })();



    // a delegate object that will live inside the iFrame
    // and can be given tasks to do when the layout is done
    var H2PDelegate = (function(){

        var tasks = [];

        function consumeTasks(){
            while(tasks.length > 0){
                tasks.shift().call();
            }
        }

        function doAfterLayout(task){
            tasks.push(task);
        }

        return {
            consumeTasks: consumeTasks,
            doAfterLayout: doAfterLayout
        }

    })();


    var Loader = (function(){

        function createScriptElement(src){
            return  $('<script>').attr(
                {
                    'type':  "text/javascript",
                    'src':   src
                });

        }

        function createStyleElement(href){
            return $('<link>').attr({
                'href': href,
                'rel': 'stylesheet',
                'type': 'text/css',
                'charset': 'utf-8'
            });
        }


        function loadMasterPageTemplate(){
            return new Promise(function(resolve, reject){
                $.get(masterPageTemplatePath)
                    .done(function (html) {
                        resolve($.parseHTML(html));
                    }).fail(function () {
                    reject();
                });
            });
        }



        // get user-defined content from the source document

        function getContent(){
            var content = $('.h2p-content').clone();
            content.find('.h2p-exclude').remove();
            var contentWrapper = $('<div>').attr('id', 'content-source').append(content);
            return $(contentWrapper).append(content);
        }



        //  returns link elements referring to the innerUIStyles
        //  and the page settings defined in the h2pConfig file

        function getInnerStyles(){
                return  [
                    createStyleElement(innerStylePath).attr('rel', 'stylesheet/less'),
                    createStyleElement(userConfig['styles']['print'])
                ];
        }



        // create script elements pointing to H2P's dependencies

        function getLibs(){
            var scripts = [];
            libPaths.forEach(function (lib) {
                scripts.push( createScriptElement(lib) );
            });
            return scripts;
        }



        // create script elements from sources defined in the config file

        function getUserScripts(){
            return userConfig['scripts'].map(function(src){ return createScriptElement(src)  });
        }


        return {
            loadUserConfig:
            function () {
                return new Promise(function (resolve, reject) {
                    $.getJSON(userConfigPath)
                        .done(function (userConfig) {

                            // convert this to boolean first
                            userConfig['pages']['mirror'] = (userConfig['pages']['mirror'] === "true");
                            resolve(userConfig);
                        })
                        .fail(function (xhr, status, err) {
                            var msg = 'Cannot find config file at ' + userConfigPath;
                            reject(msg + ", " + xhr + " " + status + " " + err);
                        })
                });
            },

            // load UI components from ui.html
            loadUIComponents:
            function () {
                return new Promise(function (resolve, reject) {
                    $.get(uiComponentsPath)
                        .done(function (html) {
                            resolve($.parseHTML(html));
                        }).fail(function () {
                        reject();
                    });
                });
            },



            getOuterUIStyles:
            function(){

                var styles = [ createStyleElement(outerStylePath).attr('id', 'h2p-ui-style') ];

                // check for user defined ui stylesheet
                if(userConfig['styles']['ui-override']){
                    styles.push(
                        createStyleElement(userConfig['styles']['ui-override'])
                            .attr('id', 'h2p-ui-style-override')
                    );
                }

                return styles;
            },



            loadIFrameComponents:
            function(){
                return new Promise(function(resolve){
                    loadMasterPageTemplate().then(function(masterPageTemplate){
                        resolve(    {
                                        masterPageTemplate: masterPageTemplate,
                                        innerStyles:        getInnerStyles(),
                                        libs:               getLibs(),
                                        content:            getContent(),
                                        userScripts:        getUserScripts()
                                    }
                        );
                    });
                });
            }
        }
    })();



    var UIBuilder = (function(){


        // create a page based on the master page element defined in h2p.html
        function createPage(masterPageTemplate, pageNum){
            var master = $(masterPageTemplate)
                .clone()
                .attr("id", "page-" + pageNum);
            master.find('.body').addClass('content-target');
            return master;
        }

        function createPages(masterPageTemplate, num){
            var pages = $('<div>').attr('id', 'pages');
            for(var i = 0; i<num; i++){
                createPage(masterPageTemplate, i).appendTo(pages);
            }
            return pages;
        }


        function buildIFrameBody(elements){
            var body = $('<body>');
            elements.forEach(function(element){
                if(element.constructor === Array){
                    element.forEach(function(el){
                        el.appendTo(body);
                    })
                } else {
                    element.appendTo(body);
                }
            });
            return body;
        }


        return{

            // add ui components and stylesheets to the document
            buildOuterUI:
            function(uiElements, uiStyles){
                function getElementByID(id){ return uiElements.filter( function(e){ return e.id === id })[0]}
                var toolbar = getElementByID('h2p-toolbar' );
                $(toolbar).addClass('hidden');
                var spinner = getElementByID('h2p-loading-spinner');

                uiStyles.forEach(function(style){
                    $('head').append(style);
                });

                $('body').append([  $(toolbar), $(spinner)   ]);
            },


            buildIFrame:
            function(iFrameComponents){

                //unpack components and create pages
                var masterPageTemplate = iFrameComponents['masterPageTemplate']
                                        .filter(function(e){ return e.id == 'master-page'})[0];
                delete  iFrameComponents['masterPageTemplate'];

                var pages = createPages(masterPageTemplate, userConfig['pages']['count']);
                var components = Object.keys(iFrameComponents).map(function(k){ return iFrameComponents[k] });
                components.push(pages);

                var iFrameBody = buildIFrameBody(components);
                var iFrame = $('<iframe>').attr('id', 'h2p-viewport').appendTo('body').get(0);
                var doc = iFrame.contentWindow.document;


                // prevent cssRegions from starting until it's told to
                iFrame.contentWindow.cssRegionsManualTrigger = false;

                // set delegate on iFrame window
                iFrame.contentWindow.H2P = H2PDelegate;


                doc.open();
                doc.write(iFrameBody.html());
                doc.close();

                return new Promise(function(resolve){
                    $(iFrame).load(function(){
                        resolve(iFrame)
                    });
                });
            }
        }
    })();



    var UI = (function(){

        var iFrame = null;
        var toolBar = null;
        var spinner = null;


        function applyZoom(level){
            $(iFrame).contents().find("#pages").css({
                "-webkit-transform": "scale(" + level + ")",
            });
        }

        function goToPage(number){
            var target = $(iFrame).contents().find('.paper:eq(' + number + ')');
            var offsetTop = target.offset().top;
            $(iFrame).contents().find('body').scrollTop(offsetTop);
        }

        function print(){
            applyZoom(1);
            $(iFrame).get(0).contentWindow.print();
        }



        return {


            setIFrame:
            function(_iFrame){
                iFrame = _iFrame;
            },

            initToolbar:
            function(){
                $('#h2p-toolbar').removeClass('hidden');
                var doc = $(iFrame).contents().find("html");
                $(doc).addClass('normal');

                $('#preview-checkbox input').change(function() {
                    if($(this).is(":checked")) {
                        doc.addClass("preview");
                        doc.removeClass("normal");
                    } else {
                        doc.removeClass("preview");
                        doc.addClass("normal");
                    }
                });

                $("#debug-checkbox input").change(function() {
                    if($(this).is(":checked")) {
                        doc.addClass("debug");
                    } else {
                        doc.removeClass("debug");
                    }
                });

                $("#spread-checkbox input").change(function() {
                    if($(this).is(":checked")) {
                        doc.addClass("spread");
                    } else {
                        doc.removeClass("spread");
                    }
                });


                $("#zoom-level input").change(function() {
                    var zoomLevel = $(this).val() / 100;
                    applyZoom(zoomLevel);
                });

                $('#zoom-level .icon-plus').click(function(){
                    var input = $('#zoom-level input');
                    var prevLevel = parseInt(input.val());
                    var newLevel = Math.min(prevLevel+25, 100);
                    input.val(newLevel);
                    applyZoom(newLevel/100)
                });

                $('#zoom-level .icon-minus').click(function(){
                    var input = $('#zoom-level input');
                    var prevLevel = parseInt(input.val());
                    var newLevel = Math.max(prevLevel-25, 25);
                    input.val(newLevel);
                    applyZoom(newLevel/100)
                });


                $("#page-selector input").change(function() {
                    var pageNumber = $(this).val() - 1;
                    goToPage(pageNumber);
                });

                $('#page-selector #total-pages').text(" / " + doc.find('.paper').length);

                $("#print-button").on('click', function() {
                    print();
                });
            },


            //  removes pages that were left empty
            removeEmptyPages:
            function(){
                var empty = $(iFrame).contents().find('.paper').filter(function () {
                    return $(this).find('cssregion').children().length === 0;
                });
                empty.remove();
            },


            // this will trigger less to recompile styles with the custom page config variables
            // returns a promise that resolves when compilation is finished

            applyPageConfig:
            function(){
                if(userConfig['pages']['mirror']){
                    $(iFrame).contents().find('#pages').addClass('mirrored');
                }

                var configCopy = JSON.parse(JSON.stringify(userConfig));

                // remove entries that should not be forwarded to less.js
                delete configCopy['pages']['mirror'];
                delete configCopy['pages']['count'];

                // forward configs to less
                return iFrame.contentWindow.less.modifyVars(userConfig['pages']);
            },



            displayError:
            function(err){
                console.log(err);
                var messageContainer = document.createElement('div');
                messageContainer.textContent = 'Oops, something broke:';

                var errorContainer = document.createElement('div');
                errorContainer.textContent = err.stack;

                var wrapper = document.createElement('div');
                wrapper.className = 'h2p-error-message';
                wrapper.appendChild(messageContainer);
                wrapper.appendChild(errorContainer);


                var body = document.getElementsByTagName('body')[0];
                body.className = 'h2p-error';
                body.innerHTML = "";
                body.appendChild(wrapper);
            },


            remove:
            function(){
                $('#h2p-viewport').remove();
                $('#h2p-loading-spinner').remove();
                $('#h2p-toolbar').remove();
            },

            removeSpinner:
            function(){
                var spinner = $('#h2p-loading-spinner');
                spinner.addClass('hidden');
                setTimeout(function () {
                    spinner.remove();
                }, 2050);
            },

            getFlow:
            function(){
                return iFrame.contentWindow.document.getNamedFlow('contentflow')
            },

            disableIFrameScroll:
            function(){
                // have to temporarily disable scroll, because scrolling interferes with CSSRegions' work
                $(iFrame).contents().find('body').addClass('noScroll');
            },

            enableIFrameScroll:
            function(){
                $(iFrame).contents().find('body').removeClass('noScroll');
            },

            //  returns a promise that resolves when CSSRegions is done
            layout:
            function(){

                iFrame.contentWindow.cssRegions.enablePolyfill();
                var flow = UI.getFlow();
                return new Promise(function(resolve){

                    // CSSRegions will emit this event when it's finished with the layout process
                    flow.addEventListener('regionfragmentchange', function (event) {
                        // validate the target of the event
                        if (event.target !== flow) {
                            return;
                        }

                        resolve()

                    });
                });
            },


            //  in case something happens after layout is resolved that alters the shape/size of the content,
            //  (H2P delegate can be given tasks that manipulates the layout after it's done)
            //  CSSRegions will restart the layout process so we have to wait for it to really finish

            relayOutFinished:
            function(){
                var flow = UI.getFlow();
                return new Promise(function(resolve){
                    var wait = setInterval(function(){
                        var isFlowFinished = !flow.relayoutInProgress && !flow.relayoutScheduled;
                        if(isFlowFinished){
                            resolve();
                            clearInterval(wait);
                        }
                    }, 100);
                })
            },


            iFrame: iFrame,
            applyZoom: applyZoom,
            goToPage: goToPage,
            print:print,

        }

    })();



    // check for JQUERY
    if(!('jQuery' in window)){
        UI.displayError(new Error('jQuery should be linked before html2print'));
        return;
    }


    //preload config file and initialize if arrived from the configure route
    var userConfigLoaded = Loader.loadUserConfig().then(function(config) {
        userConfig = config;
        RouteHandler.isConfiguredRoute().then(init);
    });




    function init(){
        RouteHandler.setConfiguredRoute();
        h2pInitialized = true;
        $('html').css('overflow-y', 'hidden');

        userConfigLoaded
            .then( Loader.loadUIComponents )
            .then( function(components){
                var outerUIStyles = Loader.getOuterUIStyles();
                UIBuilder.buildOuterUI(components, outerUIStyles);
                return Loader.loadIFrameComponents();
            })
            .then( UIBuilder.buildIFrame )
            .then( function(iFrame){
                UI.setIFrame(iFrame);
                UI.disableIFrameScroll();
                return UI.applyPageConfig();
            })
            .then( UI.layout )
            .then( H2PDelegate.consumeTasks )
            .then( UI.relayOutFinished )
            .then( function(){
                UI.removeEmptyPages();
                UI.removeSpinner();
                UI.initToolbar();
                UI.enableIFrameScroll();
            })
            .catch( function (err) {
                UI.displayError(err);
            });

        RouteHandler.backButtonPressed().then(function(){
            remove();
        });
    }

    function remove(){
        UI.remove();
        $('#h2p-ui-style').remove();
        $('#h2p-ui-style-override').remove();
        $('html').css('overflow-y', 'initial');
        h2pInitialized = false;
        RouteHandler.restoreHash();
    }


    return {
        init: init,
        remove: remove,
        goToPage: UI.goToPage,
        applyZoom: UI.applyZoom,
        print: UI.print,
        isInitialized: function(){
            return h2pInitialized;
        }
    }

})();