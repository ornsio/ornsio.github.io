onmessage = function( event ) {
    console.log( 'Worker: Message received from main thread: ' + event.data );
    postMessage( 'Hey main thread, I got your message.' );
}