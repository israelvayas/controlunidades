document.addEventListener('DOMContentLoaded', function() {
    const tableBody = document.getElementById('table-body');
    const addForm = document.getElementById('add-form');
    const finalizarDiaBtn = document.getElementById('finalizar-dia-btn');

    // Escuchar el evento submit del formulario de agregar
    addForm.addEventListener('submit', function(event) {
        event.preventDefault(); // Prevenir el comportamiento por defecto del formulario

        // Obtener los valores del formulario y convertir a mayúsculas donde sea necesario
        const insumo = document.getElementById('insumo').value.trim().toUpperCase();
        const presentacion = document.getElementById('presentacion').value.trim().toUpperCase();
        const stock = document.getElementById('stock').value.trim(); // No se convierte a mayúsculas

        // Validar que el insumo no esté vacío
        if (insumo === '') {
            mostrarError('insumo', 'Por favor, ingresa un insumo.');
            return;
        }

        // Validar que la presentación no esté vacía
        if (presentacion === '') {
            mostrarError('presentacion', 'Por favor, ingresa la presentación del insumo.');
            return;
        }

        // Validar que se ingrese una cantidad válida para el stock
        if (stock === '') {
            mostrarError('stock', 'Por favor, ingresa la cantidad en stock.');
            return;
        }

        // Convertir el stock a número entero
        const stockCantidad = parseInt(stock);
        if (isNaN(stockCantidad) || stockCantidad <= 0) {
            mostrarError('stock', 'El stock debe ser un número mayor que cero.');
            return;
        }

        // Obtener los registros guardados actualmente
        let registros = JSON.parse(localStorage.getItem('registros')) || [];

        // Buscar si ya existe un registro con el mismo nombre de insumo
        const existingRegistro = registros.find(registro => registro.insumo === insumo && registro.presentacion === presentacion);
        if (existingRegistro) {
            // Si ya existe, sumar el stock al registro existente
            existingRegistro.stock += stockCantidad;
        } else {
            // Si no existe, crear un nuevo registro
            const nuevoRegistro = {
                insumo: insumo,
                presentacion: presentacion,
                stock: stockCantidad,
                separado: 0,
                sobrante: 0,
                gastado: 0
            };

            // Agregar el nuevo registro al arreglo de registros
            registros.push(nuevoRegistro);
        }

        // Ordenar alfabéticamente por insumo y presentación
        registros.sort((a, b) => a.insumo.localeCompare(b.insumo) || a.presentacion.localeCompare(b.presentacion));

        // Guardar el arreglo actualizado en localStorage
        localStorage.setItem('registros', JSON.stringify(registros));

        // Limpiar la tabla y volver a renderizar los registros
        tableBody.innerHTML = '';
        registros.forEach(registro => {
            agregarRegistroTabla(registro);
        });

        // Limpiar el formulario después de agregar
        addForm.reset();

        // Limpiar mensajes de error después de agregar
        limpiarErrores();
    });

    // Función para cargar los datos guardados
    function cargarDatosGuardados() {
        const registros = JSON.parse(localStorage.getItem('registros')) || [];
        registros.forEach(registro => {
            agregarRegistroTabla(registro);
        });
    }

    // Función para agregar un registro a localStorage y a la tabla DOM
    function agregarRegistroTabla(registro) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${registro.insumo}</td>
            <td>${registro.presentacion}</td>
            <td class="stock">${registro.stock}</td>
            <td contenteditable="true" class="numerico editable" data-field="separado">${registro.separado}</td>
            <td contenteditable="true" class="numerico editable" data-field="sobrante">${registro.sobrante}</td>
            <td class="gastado">${registro.gastado}</td>
            <td><button class="eliminar-btn">Eliminar</button></td>
        `;
        tableBody.appendChild(row);

        // Agregar listeners para cambios en las celdas editables
        const editableCells = row.querySelectorAll('.editable');
        editableCells.forEach(cell => {
            cell.addEventListener('input', function() {
                // Validar y restringir la entrada a solo números
                let valor = cell.textContent.trim();
                valor = valor.replace(/\D/g, ''); // Eliminar caracteres no numéricos
                cell.textContent = valor;

                // Actualizar el registro
                actualizarRegistro(cell.parentElement, registro);
            });
        });

        // Agregar un listener para el botón de eliminar
        row.querySelector('.eliminar-btn').addEventListener('click', function() {
            if (confirm(`¿Estás seguro que deseas eliminar el insumo "${registro.insumo}"?`)) {
                eliminarRegistro(registro);
            }
        });
    }

    // Función para actualizar un registro en la tabla y en localStorage
    function actualizarRegistro(row, registro) {
        const separado = parseInt(row.querySelector('[data-field="separado"]').textContent.trim()) || 0;
        const sobrante = parseInt(row.querySelector('[data-field="sobrante"]').textContent.trim()) || 0;

        registro.separado = separado;
        registro.sobrante = sobrante;
        registro.gastado = separado - sobrante;

        // Actualizar el campo de gastado en la tabla
        row.children[5].textContent = registro.gastado;

        // Actualizar localStorage
        let registros = JSON.parse(localStorage.getItem('registros')) || [];
        registros = registros.map(r => (r.insumo === registro.insumo && r.presentacion === registro.presentacion && r.stock === registro.stock) ? registro : r);
        localStorage.setItem('registros', JSON.stringify(registros));
    }

    // Función para eliminar un registro de la tabla y de localStorage
    function eliminarRegistro(registro) {
        // Obtener los registros guardados actualmente
        let registros = JSON.parse(localStorage.getItem('registros')) || [];

        // Filtrar los registros para eliminar el registro dado
        registros = registros.filter(item => item.insumo !== registro.insumo || item.presentacion !== registro.presentacion || item.stock !== registro.stock);

        // Guardar el arreglo actualizado en localStorage
        localStorage.setItem('registros', JSON.stringify(registros));

        // Limpiar la tabla y volver a renderizar los registros restantes
        tableBody.innerHTML = '';
        registros.forEach(registro => {
            agregarRegistroTabla(registro);
        });
    }

    // Función para finalizar el día y actualizar los registros
    finalizarDiaBtn.addEventListener('click', function() {
        const mensaje = "AL FINALIZAR EL DÍA LO GASTADO SE RESTARÁ DEL STOCK Y LO SOBRANTE PASARÁ A SER LO SEPARADO.";
        if (confirm(mensaje)) {
            let registros = JSON.parse(localStorage.getItem('registros')) || [];

            registros.forEach(registro => {
                // Restar gastado del stock
                registro.stock -= registro.gastado;

                // Actualizar separado y sobrante
                registro.separado = registro.sobrante;
                registro.sobrante = 0;
                registro.gastado = 0;
            });

            // Guardar los registros actualizados en localStorage
            localStorage.setItem('registros', JSON.stringify(registros));

            // Limpiar la tabla y volver a renderizar los registros actualizados
            tableBody.innerHTML = '';
            registros.forEach(registro => {
                agregarRegistroTabla(registro);
            });
        }
    });

    // Función para mostrar un mensaje de error debajo del campo
    function mostrarError(inputId, mensaje) {
        const input = document.getElementById(inputId);
        const formControl = input.parentElement;
        const errorElement = formControl.querySelector('.error-message');
        if (errorElement) {
            errorElement.textContent = mensaje;
        } else {
            const errorDiv = document.createElement('div');
            errorDiv.classList.add('error-message');
            errorDiv.textContent = mensaje;
            formControl.appendChild(errorDiv);
        }
    }

    // Función para limpiar todos los mensajes de error
    function limpiarErrores() {
        const errorMessages = document.querySelectorAll('.error-message');
        errorMessages.forEach(errorMessage => {
            errorMessage.remove();
        });
    }

    // Cargar los datos guardados al iniciar la página
    cargarDatosGuardados();
});
