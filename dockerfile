# Usar una imagen base de Python
FROM python:3.9-slim

# Establecer la zona horaria
ENV TZ=America/Lima

RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Establecer el directorio de trabajo en el contenedor
WORKDIR /app

# Instalar las herramientas de compilación necesarias y dependencias
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libc6-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copiar solo el archivo necesario para instalar las dependencias
COPY requirements.txt /app/

# Instalar las dependencias
RUN pip install --no-cache-dir -r requirements.txt

# Ahora copiamos el resto de nuestro código
COPY . /app

# Exponer el puerto que utiliza tu aplicación
EXPOSE 5000

# Comando para iniciar la aplicación
CMD ["flask", "run", "--host=0.0.0.0"]
