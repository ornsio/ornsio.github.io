//
//
// TODO:
//   - Color line numbers differently when they are adjacent to filtered-out lines
//   - Add different search options
//   - Get horizontal scrolling to leave line numbers in-place (see https://stackoverflow.com/questions/51299387/fix-items-only-horizontally-or-vertically-in-the-same-scroll-container/51299660)
//
//
var controls;
var userFile;
var userText;
var parseButton;
var toggleInputs;
var hideable;
var searchBox;
var unfiltered;
var filtered;
var loading;

var userTextReady = false;
var searchDelayDefault = 2;
var searchDelay = searchDelayDefault;
var searchWaitInProgress = false;
var searchInProgress = false;
var waitingOn = 0;
var lastSearch = '';

var workerA;
var workerB;
var workerC;
var numWorkers = 3;

window.addEventListener( 'load', function() {
    if ( !window.Worker ) {
        alert( "Your browser doesn't support web workers, so this page won't work for you :-(" );
    }
    else {
        controls     = document.getElementById( 'controls' );
        userFile     = document.getElementById( 'userFile' );
        userText     = document.getElementById( 'userText' );
        parseButton  = document.getElementById( 'parseButton' );
        toggleInputs = document.getElementById( 'toggleInputs' );
        hideable     = document.getElementById( 'hideable' );
        searchBox    = document.getElementById( 'search' );
        unfiltered   = document.getElementById( 'unfiltered' );
        filtered     = document.getElementById( 'filtered' );
        loading      = document.getElementById( 'loadingImage' );

        setResultHeight();
        window.addEventListener( 'resize', setResultHeight );
        new MutationObserver( setResultHeight ).observe( userText, {
            attributes: true,
            attributeFilter: [ "style" ]
        });
        new MutationObserver( setResultHeight ).observe( hideable, {
            attributes: true,
            attributeFilter: [ "style" ]
        });

        // Setup listeners etc. for accepting the user's text they want to search
        parseButton.addEventListener( 'click', parseTextbox );
        userFile.addEventListener( 'change', parseFile );

        // Create the worker variables to interact with the worker threads from the main thread
        workerA = new Worker( 'js/worker.js' );
        workerB = new Worker( 'js/worker.js' );
        workerC = new Worker( 'js/worker.js' );
        
        // Establish logic to handle messages sent from the worker threads to the main thread
        var workerResponseHandler = function( event ) {
            // console.log( 'Worker ' + event.data.worker + ' sent main thread a message : ' + JSON.stringify( event.data ) );
            var row = document.getElementById( event.data.id );

            if ( event.data.rowMatched ) {
                row.children[1].innerHTML = event.data.text;
                row.style.display = 'block';
            }
            else {
                row.style.display = 'none';
            }

            waitingOn--;
            if ( waitingOn <= 0 ) {
                searchBox.disabled = false;
                searchBox.focus();
            }
        };
        workerA.onmessage = workerResponseHandler;
        workerB.onmessage = workerResponseHandler;
        workerC.onmessage = workerResponseHandler;

        // Setup listeners etc. for executing the search
        searchBox.addEventListener( 'keydown', function( evnt ) {
            if ( !searchInProgress && userTextReady ) {
                searchDelay = searchDelayDefault;

                if ( !searchWaitInProgress ) {
                    searchWaitInProgress = true;
                    setTimeout( searchCheck, 1000 );
                }
            }
        });

        userText.focus();
    }
});


function parseTextbox()
{
    preParse();
    // Have to briefly delay before doing the work, otherwise the loading graphic and other visual changes won't render first
    setTimeout( function() {
        var textArray = userText.value.split( '\n' );
        parse( textArray );
    },
    100 );
}

function parseFile() {
    if ( !userFile.disabled ) {
        preParse();
        // Have to briefly delay before doing the work, otherwise the loading graphic and other visual changes won't render first
        setTimeout( function() {
            const file = userFile.files[0];
            file.text().then( text => parse( text.split( '\n' ) ) );
        },
        100 );
    }
}

function preParse() {
    userFile.disabled    = true;
    userText.disabled    = true;
    parseButton.disabled = true;
    loading.style.display = 'block';

    unfiltered.textContent = '';
    filtered.textContent = '';
}

function parse( textArray ) {
    for ( var i = 0; i < textArray.length; i++ )
    {
        var line = textArray[i];

        var newLine = document.createElement( 'div' );
        newLine.id = 'u' + ( i + 1 );
        newLine.className = 'line';

        var lineNum = document.createElement( 'div' );
        lineNum.innerText = i + 1;
        lineNum.className = 'lineNum';

        var lineText = document.createElement( 'div' );
        lineText.innerText = line;
        lineText.className = 'lineText';

        newLine.appendChild( lineNum );
        newLine.appendChild( lineText );
        unfiltered.appendChild( newLine );

        
        var newLineFiltered = document.createElement( 'div' );
        newLineFiltered.id = i + 1;
        newLineFiltered.className = 'line';

        var lineNumF = document.createElement( 'div' );
        lineNumF.innerText = i + 1;
        lineNumF.className = 'lineNum';

        var lineTextF = document.createElement( 'div' );
        // lineTextF.innerText = line;  // no need to include the text on the filtered lines initially since worker responses will populate it later
        lineTextF.className = 'lineText';

        newLineFiltered.appendChild( lineNumF );
        newLineFiltered.appendChild( lineTextF );
        filtered.appendChild( newLineFiltered );
    }

    userTextReady = true;
    searchBox.disabled = false;
    searchBox.focus();
    unfiltered.style.display = 'block';
    loading.style.display = 'none';

    toggleInputs.addEventListener( 'click', toggle );
    toggleInputs.style.display = 'block';
    toggle();
}


function toggle() {
    if ( hideable.style.display == 'none' ) {
        hideable.style.display = 'block';
        toggleInputs.innerText = 'Hide Inputs';
    }
    else {
        hideable.style.display = 'none';
        toggleInputs.innerText = 'Show Inputs';
    }
    searchBox.focus();
}


function searchCheck() {
    searchDelay--;

    if ( searchDelay <= 0 ) {
        searchWaitInProgress = false;

        if ( searchBox.value != lastSearch ) {
            searchInProgress = true;
            loading.style.display = 'block';
            searchBox.disabled = true;
            // Have to briefly delay before doing the work, otherwise the loading graphic and other visual changes won't render first
            setTimeout( search, 100 );
        }
    }
    else {
        setTimeout( searchCheck, 1000 );
    }
}

function search() {
    var searchStart = ( new Date() ).getTime();

    if ( searchBox.value !== '' ) {
        unfiltered.style.display = 'none';
        filtered.style.display = 'block';
        waitingOn = 0;

        var children = unfiltered.children;

        for ( var i = 0; i < children.length; i++ ) {
            var line = children[i];

            // Implement search options here to alter what regex is used
            lastSearch = searchBox.value;
            var searchInput = searchBox.value.replaceAll( /[\^\$\(\)\<\>\[\]\{\}\|\.\*\+\?\\]/g, '\\$&' );
            var matcher = new RegExp( searchInput, 'ig' );

            var message = { id : line.id.substring( 1 ), text : line.children[1].innerText, searchRegEx : matcher };
            // console.log( 'Main thread sending worker a message : ' + JSON.stringify( message ) );
            waitingOn++;

            var whichWorker = i % numWorkers;
            switch ( whichWorker )
            {
                case 1:
                    message.worker = "A";
                    workerA.postMessage( message );
                    break;
                case 2:
                    message.worker = "B";
                    workerB.postMessage( message );
                    break;
                default:
                    message.worker = "C";
                    workerC.postMessage( message );
            }
        }
    }
    else {
        unfiltered.style.display = 'block';
        filtered.style.display = 'none';
        searchBox.disabled = false;
        searchBox.focus();
    }

    searchInProgress = false;
    loading.style.display = 'none';
    searchBox.placeholder = ' type your search here...';

    var searchTime = ( new Date() ).getTime() - searchStart;
    var searchMils    = 0;
    var searchSeconds = 0;
    var searchMinutes = 0;
    if ( searchTime > 0 ) {
        searchMils    = searchTime % 1000;
        searchSeconds = ( searchTime - searchMils ) / 1000;
        searchTime    = searchSeconds;
        searchSeconds = searchTime % 60
        searchMinutes = ( searchTime - searchSeconds ) / 60;
    }
    console.log( 'Search time - ' + searchMinutes + ':' + searchSeconds + '.' + searchMils );
}

function setResultHeight() {
    var resultHeight = ( window.innerHeight - controls.getBoundingClientRect().height - 80 ) + 'px';
    unfiltered.style.height = resultHeight;
    filtered.style.height = resultHeight;
}









// // This class mimics web worker functionality without actually being multi-threaded.
// // It is intended to allow web worker code designs to be tested on a local machine.
// class Worker {
//     onmessage;

//     FakeWorker( scriptIn ) {
//         this.script = scriptIn;
//     }

//     // This function mimics Worker.postMessage() as invoked from the main script
//     postMessage( object ) {
//         var event = { data : object };
//         var thread = new FakeWorkerThread();
//         thread.executeThread( event );
//     }
// }

// class FakeWorkerThread {
//     FakeWorkerThread() { }

//     postMessage( object ) {
//         // Note that this cheats and really doesn't use the other fake workers, but since they're
//         // fake and everything is happening in a single thread anyway, that doesn't really matter
//         workerA.onmessage( { data : object } );
//     }

    
//     executeThread( event ) {  var postMessage = this.postMessage;
//         // The logic below this comment should be the logic that the worker script would perform inside of onmessage = function( event ) { ... } //

//         // console.log( 'Worker ' + event.data.worker + ' : Message received from main thread: ' + JSON.stringify( event.data ) );

//         var text    = event.data.text;
//         var matcher = event.data.searchRegEx;
    
//         var isMatch = false;
//         var matchedText = '';
//         if ( matcher.test( text ) )
//         {
//             isMatch = true;
//             matcher.lastIndex = 0;
//             matchedText = text.replaceAll( matcher, '<b>$&</b>' );
//         }
    
//         postMessage({
//             id : event.data.id,
//             rowMatched : isMatch,
//             text : matchedText,
//             worker : event.data.worker
//         });

//         ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//     }
// }