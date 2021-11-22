var controls;
var userFile;
var userText;
var parseButton;
var searchBox;
var unfiltered;
var filtered;

var userTextReady = false;
var searchDelayDefault = 2;
var searchDelay = searchDelayDefault;
var searchWaitInProgress = false;
var searchInProgress = false;
var waitingOn = 0;

var workerA;
var workerB;
var workerC;
var numWorkers = 3;

window.addEventListener( 'load', function() {
    // if ( !window.Worker ) {
    //     alert( "Your browser doesn't support web workers, so this page won't work for you :-(" );
    // }
    // else {
        controls    = document.getElementById( 'controls' );
        userFile    = document.getElementById( 'userFile' );
        userText    = document.getElementById( 'userText' );
        parseButton = document.getElementById( 'parseButton' );
        searchBox   = document.getElementById( 'search' );
        unfiltered  = document.getElementById( 'unfiltered' );
        filtered    = document.getElementById( 'filtered' );

        setResultHeight();
        window.addEventListener( 'resize', setResultHeight );
        new MutationObserver( setResultHeight ).observe( userText, {
            attributes: true,
            attributeFilter: [ "style" ]
        });

        // Setup listeners etc. for accepting the user's text they want to search
        parseButton.addEventListener( 'click', parseTextbox );
        userFile.addEventListener( 'change', parseFile );

        // Create the worker variables to interact with the worker threads from the main thread
        // workerA = new Worker( 'js/worker.js' );
        // workerB = new Worker( 'js/worker.js' );
        // workerC = new Worker( 'js/worker.js' );
        workerA = new FakeWorker( 'js/worker.js' );
        workerB = new FakeWorker( 'js/worker.js' );
        workerC = new FakeWorker( 'js/worker.js' );
        
        // Establish logic to handle messages sent from the worker threads to the main thread
        var workerResponseHandler = function( event ) {
            console.log( 'Worker ' + event.data.worker + ' sent main thread a message : ' + JSON.stringify( event.data ) );
            var row = document.getElementById( event.data.id );

            if ( event.data.rowMatched ) {
                row.innerHTML = event.data.text;
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
    // }
});


function parseTextbox()
{
    preParse();
    var textArray = userText.value.split( '\n' )
    parse( textArray );
}

function parseFile() {
    if ( !userFile.disabled ) {
        preParse();

        const file = userFile.files[0];
        file.text().then( text => parse( text.split( '\n' ) ) );
    }
}

function preParse() {
    userFile.disabled    = true;
    userText.disabled    = true;
    parseButton.disabled = true;

    unfiltered.textContent = '';
    filtered.textContent = '';

    // Probably need to display some kind of "loading" graphic
}

function parse( textArray ) {
    for ( var i = 0; i < textArray.length; i++ )
    {
        var line = textArray[i];

        var newLine = document.createElement( 'div' );
        newLine.innerText = line;
        newLine.id = 'u' + ( i + 1 );
        newLine.className = 'line';
        unfiltered.appendChild( newLine );

        var newLineFiltered = document.createElement( 'div' );
        // newLineFiltered.innerText = line; // no need to have the text in the filtered section initially
        newLineFiltered.id = i + 1;
        newLineFiltered.className = 'line';
        filtered.appendChild( newLineFiltered );
    }

    userTextReady = true;
    searchBox.disabled = false;
    searchBox.focus();
    unfiltered.style.display = 'block';
}


function searchCheck() {
    searchDelay--;

    if ( searchDelay <= 0 ) {
        search();
    }
    else {
        setTimeout( searchCheck, 1000 );
    }
}

function search() {
    searchInProgress = true;
    searchWaitInProgress = false;
    
    if ( searchBox.value !== '' ) {
        unfiltered.style.display = 'none';
        filtered.style.display = 'block';

        waitingOn = 0;
        searchBox.disabled = true;

        var children = unfiltered.children;

        for ( var i = 0; i < children.length; i++ ) {
            var line = children[i];

            // Implement search options here to alter what regex is used
            var searchInput = searchBox.value.replaceAll( /[\^\$\(\)\<\>\[\]\{\}\|\.\*\+\?\\]/g, '\\$&' );
            var matcher = new RegExp( searchInput, 'ig' );

            var message = { id : line.id.substring( 1 ), text : line.innerText, searchRegEx : matcher };
            console.log( 'Main thread sending worker a message : ' + JSON.stringify( message ) );
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
    }

    searchInProgress = false;
}

function setResultHeight() {
    var resultHeight = ( window.innerHeight - controls.getBoundingClientRect().height - 130 ) + 'px';
    unfiltered.style.height = resultHeight;
    filtered.style.height = resultHeight;
}









// This class mimics web worker functionality without actually being multi-threaded.
// It is intended to allow web worker code designs to be tested on a local machine.
class FakeWorker {
    onmessage;

    FakeWorker( scriptIn ) {
        this.script = scriptIn;
    }

    // This function mimics Worker.postMessage() as invoked from the main script
    postMessage( object ) {
        var event = { data : object };
        var thread = new FakeWorkerThread();
        thread.executeThread( event );
    }
}

class FakeWorkerThread {
    FakeWorkerThread() { }

    postMessage( object ) {
        // Note that this cheats and really doesn't use the other fake workers, but since they're
        // fake and everything is happening in a single thread anyway, that doesn't really matter
        workerA.onmessage( { data : object } );
    }

    
    executeThread( event ) {  var postMessage = this.postMessage;
        // The logic below this comment should be the logic that the worker script would perform inside of onmessage = function( event ) { ... } //
        console.log( 'Worker ' + event.data.worker + ' : Message received from main thread: ' + JSON.stringify( event.data ) );

        var text    = event.data.text;
        var matcher = event.data.searchRegEx;
    
        var isMatch = false;
        var matchedText = '';
        if ( matcher.test( text ) )
        {
            isMatch = true;
            matcher.lastIndex = 0;
            matchedText = text.replaceAll( matcher, '<b>$&</b>' );
        }
    
        postMessage({
            id : event.data.id,
            rowMatched : isMatch,
            text : matchedText,
            worker : event.data.worker
        });
        ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    }
}