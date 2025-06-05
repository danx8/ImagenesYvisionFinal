# Instrucciones para ejecutar el proyecto

Para correr este proyecto, debes tener instalados previamente **Python** y **Node.js**.

1. Sitúate en la raíz del proyecto, es decir, en la carpeta `imagenesYvision`.
2. Entra a la carpeta `front` con el comando: cd front
3. Ejecuta el siguiente comando para instalar las dependencias de Node.js: npm install
4. Regresa a la carpeta raíz con: cd ..
5. Ejecuta el archivo batch para iniciar tanto el backend como el frontend al mismo tiempo: .\start.bat


Una vez hecho esto, abre tu navegador y entra a: http://localhost:5173/

# Descripción de las pestañas del proyecto

- **Subir video:**  
  Permite subir cualquier video para recortarlo en una cantidad de frames (imágenes) que tú determines.

- **Pestaña Uno:**  
  Esta pestaña sirve para probar el modelo inmediatamente, sin necesidad de recortar un video previamente. Las demás pestañas sí requieren que el video esté recortado en frames.

- **Pestaña Arduino:**  
  Se conecta con un Arduino mientras muestra fotos. Dependiendo de la clase detectada, se encenderán unos LEDs.  
  **Importante:** Esta función solo funciona si tienes un Arduino conectado a la misma red Wi-Fi que tu computadora. Si no usas mi Arduino, esta pestaña no funcionará, por lo que se recomienda no intentar probarla.

- **Pestaña 1 Persona:**  
  Permite cargar un video ya recortado y muestra un paginador con todas las imágenes de los frames.  
  Al seleccionar una imagen, puedes marcarla con cuadros según la clase que creas que corresponde. Esta información se guarda en un label del backend.  
  Esta pestaña está diseñada para facilitar el entrenamiento de futuros modelos.





