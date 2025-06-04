import { db, collection } from './firebase-config.js';
import { getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const filesList = document.getElementById('filesList');
const loadingIndicator = document.getElementById('loading');
const emptyState = document.getElementById('empty');
const errorState = document.getElementById('error');
const refreshButton = document.getElementById('refreshButton');

// Función para eliminar un archivo de Firebase
window.deleteFile = async function(docId, listItemElement) {
    if (confirm('¿Estás seguro de que quieres eliminar este archivo de la base de datos?')) {
        try {
            const docRef = doc(db, 'credentials', docId);
            await deleteDoc(docRef);
            console.log('Archivo eliminado exitosamente:', docId);
            // Eliminar el elemento de la lista en la interfaz
            listItemElement.remove();

            // Verificar si la lista está vacía después de eliminar
            if (filesList.children.length === 0) {
                emptyState.style.display = 'block';
            }

        } catch (error) {
            console.error('Error al eliminar archivo:', error);
            alert('Error al eliminar el archivo: ' + error.message);
        }
    }
};

async function loadTxtFiles() {
    try {
        loadingIndicator.style.display = 'block';
        emptyState.style.display = 'none';
        errorState.style.display = 'none';
        filesList.innerHTML = ''; // Limpiar lista

        const credentialsCollection = collection(db, 'credentials');
        const querySnapshot = await getDocs(credentialsCollection);

        let txtFilesFound = 0;

        querySnapshot.forEach((docSnapshot) => {
            const fileData = docSnapshot.data();
            const docId = docSnapshot.id; // Obtener el ID del documento

            // Verificar si es un archivo .txt y si tiene contenido
            if (fileData.type === 'txt' && fileData.content) {
                const listItem = document.createElement('li');
                listItem.className = 'file-item';
                // Guardar el ID del documento en el elemento para fácil acceso
                listItem.dataset.docId = docId;

                // Crear el enlace de descarga
                const downloadLink = document.createElement('a');
                downloadLink.href = '#'; // El href se generará al hacer clic
                downloadLink.className = 'download-link';
                downloadLink.textContent = 'Descargar';

                // Manejar la descarga al hacer clic
                downloadLink.onclick = (event) => {
                    event.preventDefault(); // Prevenir la navegación
                    const blob = new Blob([fileData.content], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const tempLink = document.createElement('a');
                    tempLink.href = url;
                    tempLink.download = fileData.filename || 'descarga.txt';
                    tempLink.style.display = 'none';
                    document.body.appendChild(tempLink);
                    tempLink.click();
                    URL.revokeObjectURL(url);
                };

                // Crear el botón de eliminar
                const deleteButton = document.createElement('button');
                deleteButton.className = 'delete-button';
                deleteButton.textContent = 'Eliminar';
                // Asignar la función de eliminar, pasando el ID del documento y el elemento de lista
                deleteButton.onclick = () => deleteFile(docId, listItem);

                // Contenedor para los botones
                 const actionsDiv = document.createElement('div');
                 actionsDiv.className = 'actions';
                 actionsDiv.appendChild(downloadLink);
                 actionsDiv.appendChild(deleteButton);

                listItem.innerHTML = `
                     <div class="file-info">
                        <strong>${fileData.filename || 'Nombre desconocido'}</strong>
                        <span>Subido: ${new Date(fileData.timestamp).toLocaleString()}</span>
                     </div>
                    <pre>${fileData.content}</pre>
                `;

                listItem.appendChild(actionsDiv); // Añadir el contenedor de botones

                filesList.appendChild(listItem);
                txtFilesFound++;
            }
        });

        if (txtFilesFound === 0) {
            emptyState.style.display = 'block';
        }

    } catch (error) {
        console.error('Error al obtener archivos .txt:', error);
        errorState.style.display = 'block';
        errorState.textContent = 'Error al cargar los archivos: ' + error.message;
    } finally {
        loadingIndicator.style.display = 'none';
    }
}

// Cargar los archivos .txt al cargar la página
document.addEventListener('DOMContentLoaded', loadTxtFiles);

// Añadir evento al botón de refrescar
refreshButton.addEventListener('click', loadTxtFiles); 