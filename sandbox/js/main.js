if ( window.Worker ) {
    // create the 'worker' variable to interact with the worker from the main thread
    const worker = new Worker( 'js/worker.js' );

    // establish logic to handle messages sent from the worker to the main thread
    worker.onmessage = function( event ) {
        console.log( 'Worker sent main thread a message: ' + event.data );
    }

    // logic to send messages from the main thread to the worker
    function buttonClick() {
        worker.postMessage( 'This is a message from the main thread.' );
        console.log( 'Main thread sent worker a message.' );
    }
}
else {
    alert( "Your browser doesn't support web workers, so this page won't work for you :-(" );
}