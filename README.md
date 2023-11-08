# Aplicación P2P con Encriptación Homomórfica

## Requisitos

- Python 3.7.9
- MySQL (Configuración: `max_allowed_packet=64M`)

## Instalación

1. **Instalar dependencias**  
   Instala las dependencias necesarias mediante pip:
   ```bash
   pip install -r requirements.txt
    ```
   
2. **Instalar dependencias**  
   - Descargar y descomprimir tenseal.zip de la siguiente ruta:  
     [Descargar tenseal.zip](https://1drv.ms/u/c/efa39ad3b9672138/EWpsT6PoEtlIkIJxgQVEVQMBH6ldNmqGjIhs4bAasw1x5w?e=3nhttx)

4. **Crear carpeta de claves**  
   Crea una carpeta llamada keys.

5. **Crear base de datos**  
   En tu terminal de MySQL, ejecuta el siguiente comando para crear la base de datos:
   ```bash
   CREATE DATABASE p2p;
   ```
6. **Ejecutar Migraciones**
   Ejecuta las siguientes migraciones para configurar la base de datos:
   ```bash
   flask db migrate -m "correr migraciones"
   flask db upgrade
   ```
6. **Correr la Aplicación**
   Ejecuta el siguiente comando para iniciar la aplicación:
   ```bash
   flask run
   ```
