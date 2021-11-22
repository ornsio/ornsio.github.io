var controls;
var userText;
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
    if ( !window.Worker ) {
        alert( "Your browser doesn't support web workers, so this page won't work for you :-(" );
    }
    else {
        controls = document.getElementById( 'controls' );
        userText = document.getElementById( 'userText' );
        searchBox = document.getElementById( 'search' );
        unfiltered = document.getElementById( 'unfiltered' );
        filtered = document.getElementById( 'filtered' );

        setResultHeight();
        window.addEventListener( 'resize', setResultHeight );
        new MutationObserver( setResultHeight ).observe( userText, {
            attributes: true,
            attributeFilter: [ "style" ]
        });

        // create the 'worker' variable to interact with the worker from the main thread
        workerA = new Worker( 'js/worker.js' );
        workerB = new Worker( 'js/worker.js' );
        workerC = new Worker( 'js/worker.js' );
        // workerA = new FakeWorker( 'js/worker.js' );
        // workerB = new FakeWorker( 'js/worker.js' );
        // workerC = new FakeWorker( 'js/worker.js' );
        
        // establish logic to handle messages sent from the worker to the main thread
        var workerResponseHandler = function( event ) {
            console.log( 'Worker sent main thread a message : ' + JSON.stringify( event.data ) );
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
        
        document.getElementById( 'search' ).addEventListener( 'keydown', function( evnt ) {
            if ( !searchInProgress && userTextReady ) {
                searchDelay = searchDelayDefault;

                if ( !searchWaitInProgress ) {
                    searchWaitInProgress = true;
                    setTimeout( searchCheck, 1000 );
                }
            }
        });
    }
});

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
                    workerA.postMessage( message );
                    break;
                case 2:
                    workerB.postMessage( message );
                    break;
                default:
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

function parse()
{
    userText.disabled = true;

    unfiltered.textContent = '';
    filtered.textContent = '';
    var text = userText.value.split( '\n' );

    for ( var i = 0; i < text.length; i++ )
    {
        var line = text[i];

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
    unfiltered.style.display = 'block';
}

function setResultHeight() {
    var resultHeight = ( window.innerHeight - controls.getBoundingClientRect().height - 200 ) + 'px';
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
        console.log( 'Worker: Message received from main thread: ' + JSON.stringify( event.data ) );

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
            text : matchedText
        });
        ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    }
}