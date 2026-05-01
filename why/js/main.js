var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));

var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl)
});

document.querySelectorAll('.accordion-collapse').forEach(collapse => {
    collapse.addEventListener('shown.bs.collapse', function (event) {
        // Only act if THIS collapse element is the one that fired the event
        if (event.target !== this) return;

        const header = this.previousElementSibling;
            header.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    });
});