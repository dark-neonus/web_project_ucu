document.addEventListener("DOMContentLoaded", function () {
    const components = [
        { id: "header-placeholder", file: "header.html" },
        { id: "left-sidebar-placeholder", file: "left-sidebar.html" },
        { id: "social-buttons-placeholder", file: "social-buttons.html" },
        { id: "form-group-placeholder", file: "form-group.html" }
    ];

    components.forEach(({ id, file }) => {
        const element = document.getElementById(id);
        if (element) {
            fetch(`/src/components/${file}`)
                .then(response => response.text())
                .then(data => { element.innerHTML = data; })
                .catch(error => console.error(`Error loading ${file}:`, error));
        } else {
            console.warn(`Element with ID "${id}" not found.`);
        }
    });
});
