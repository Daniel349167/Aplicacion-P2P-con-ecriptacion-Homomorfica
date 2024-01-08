from flask import render_template, request, jsonify, session
from create_app import create_app, db
from models import HistorialCrediticio, Ofertas, Solicitudes
import pymysql
import tenseal as ts
import base64
import os
from flask import url_for
app = create_app()


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/solicitar', methods=['POST'])
def solicitar():
    nombre = request.form['nombre']
    edad_encrypted = request.form['edad']
    ingresos_encrypted = request.form['ingresos']
    historial_id_encrypted = request.form['historial']
    monto_encrypted = request.form['monto']
    # public_key_encrypted = request.form['llavePublica']

    ruta_archivo_llave_publica = f'static/keys/contexto_publico_{nombre}.txt'


       # Almacenar en la base de datos usando SQLAlchemy
    nueva_solicitud = Solicitudes(
        nombre=nombre,
        edad=edad_encrypted,
        ingresos=ingresos_encrypted,
        historial_id=historial_id_encrypted,
        monto=monto_encrypted,
        public_key=ruta_archivo_llave_publica 
    )
    db.session.add(nueva_solicitud)
    db.session.commit()

    return jsonify({"status": "success"})

@app.route('/getSolicitudes', methods=['GET'])
def obtener_solicitudes():
    solicitudes = Solicitudes.query.all()
    lista_solicitudes = [solicitud.as_dict() for solicitud in solicitudes]
    return jsonify(lista_solicitudes)



@app.route('/encriptar', methods=['POST'])
def encriptar_datos():
    # Obtener los datos del cuerpo de la solicitud
    data = request.get_json()
    nombre = data['nombre']

    valor_historial = data['historial']  

    # Buscar el historial crediticio por el valor
    historial = HistorialCrediticio.query.filter_by(historial=valor_historial).first()
    if not historial:
        # Si no existe, crear uno nuevo
        historial = HistorialCrediticio(historial=valor_historial)
        db.session.add(historial)
        db.session.commit()

    historial_id = historial.id

    secret_context_serialized, public_context_serialized= guardar_contexto_tenSEAL(nombre)
    # base64
    guardar_contexto_publico(nombre, public_context_serialized)
    public_context_url = obtener_url_contexto_publico(nombre)
    # Deserializary Encriptar los datos numéricos con CKKS
    public_context = ts.context_from(public_context_serialized)

    # nombre_encrypted = ts.ckks_vector(public_context, int[data['nombre']])
    edad_encrypted = ts.ckks_vector(public_context, [int(data['edad'])])
    ingresos_encrypted = ts.ckks_vector(public_context, [int(data['ingresos'])])
    monto_encrypted = ts.ckks_vector(public_context, [int(data['monto'])])
    historial_id_encrypted = ts.ckks_vector(public_context, [int(historial_id)])

    # nombre_encrypted = ts.bfv_vector(public_context, [data['nombre']])
    # edad_encrypted = ts.bfv_vector(public_context, [int(data['edad'])])
    # ingresos_encrypted = ts.bfv_vector(public_context, [int(data['ingresos'])])
    # monto_encrypted = ts.bfv_vector(public_context, [int(data['monto'])])
    # historial_id_encrypted = ts.bfv_vector(public_context, [int(historial_id)])
    
    # Serializar y convertir a base64
    edad_bytes = base64.b64encode(edad_encrypted.serialize()).decode('utf-8')
    ingresos_bytes = base64.b64encode(ingresos_encrypted.serialize()).decode('utf-8')
    monto_bytes = base64.b64encode(monto_encrypted.serialize()).decode('utf-8')
    historial_id_bytes = base64.b64encode(historial_id_encrypted.serialize()).decode('utf-8')
    
    # Codificar la clave secreta en base64
    secret_context_base64 = base64.b64encode(secret_context_serialized).decode('utf-8')

    # Preparar la respuesta
    response_data = {
        'nombre': nombre, 
        'edad': edad_bytes,
        'ingresos': ingresos_bytes,
        'monto': monto_bytes,
        'historial': historial_id_bytes,
        'contexto_publico_url': public_context_url,
        'contexto_secreto': secret_context_base64,
    }
    
    # Enviar la respuesta
    return jsonify(response_data)


@app.route('/desencriptar', methods=['POST'])
def desencriptar():
    try:
        # Obtener los datos encriptados de la solicitud en formato base64
        encrypted_data_base64 = request.json['dato']
        nombre = request.json.get('nombre', '') 

        # print("Longitud antes del padding:", len(encrypted_data_base64))
        missing_padding = len(encrypted_data_base64) % 4
        if missing_padding:
            encrypted_data_base64 += '=' * (4 - missing_padding)
        # print("Longitud después del padding:", len(encrypted_data_base64))

        # Decodificar los datos de base64 a bytes
        encrypted_data_bytes = base64.b64decode(encrypted_data_base64)

        contexto = cargar_contexto_secreto_tenSEAL(nombre)
        
        # Deserializar el vector encriptado 
        encrypted_vector = ts.ckks_vector_from(contexto, encrypted_data_bytes)
        
        # Desencriptar el vector
        decrypted_data = encrypted_vector.decrypt()[0]

        # Redondear a 2 decimales
        rounded_data = round(decrypted_data, 2)
        
        # Si el número redondeado es un entero, convertir a entero
        if rounded_data == int(rounded_data):
            rounded_data = int(rounded_data)


        return jsonify({"data": rounded_data})
        
    except Exception as e:
        print("Se produjo un error durante la deserialización o la desencriptación:", e)
        return jsonify({"error": str(e)}), 500


from flask import request

@app.route('/calcularPrestamo', methods=['POST'])
def post_calculo():
    data = request.json
    indice = data['indice']
    tasa_base = data['tasaBase']
    factor_monto = data['factorMonto']
    factor_tiempo = data['factorTiempo']

    # Utiliza SQLAlchemy para buscar el registro correspondiente al índice
    solicitud = Solicitudes.query.filter_by(id=indice).first()

    if not solicitud:
        return jsonify({"error": "Solicitud no encontrada"}), 404

    # Pasar los datos de la solicitud a la función calcular_prestamo
    monto_final, tasa_interes, tiempo = calcular_prestamo(solicitud.public_key, solicitud.nombre, solicitud.edad, solicitud.ingresos, solicitud.historial_id, solicitud.monto, tasa_base, factor_monto, factor_tiempo)

    return jsonify({'monto_final': monto_final, 'tasa_interes': tasa_interes, 'tiempo': tiempo})


@app.route('/guardarOferta', methods=['POST'])
def guardarOferta():
    try:
        data = request.json
        prestamista = data['prestamista']
        montoOfrecido = data['montoEstimado']
        interesOferta = data['interes']
        tiempoPrestamo = data['tiempo']
        solicitud_id = data['indice']

        nueva_oferta = Ofertas(
            prestamista=prestamista,
            montoOfrecido=montoOfrecido,
            interesOferta=interesOferta,
            tiempoPrestamo=tiempoPrestamo,
            solicitud_id=solicitud_id
        )

        db.session.add(nueva_oferta)
        db.session.commit()

        return jsonify({"success": True})
    except Exception as e:
        # Puedes cambiar esto para enviar un mensaje de error más específico
        return jsonify({"success": False, "error": str(e)})

@app.route('/getOfertas', methods=['GET'])
def get_ofertas():
    try:
        solicitudes = Solicitudes.query.all()
        resultado = []
        
        for solicitud in solicitudes:
            ofertas_solicitud = []
            for oferta in solicitud.ofertas:
                oferta_dict = {
                    'id':oferta.id,
                    'prestamista': oferta.prestamista,
                    'montoOfrecido': oferta.montoOfrecido,
                    'interesOferta': oferta.interesOferta,
                    'tiempoPrestamo': oferta.tiempoPrestamo
                }
                ofertas_solicitud.append(oferta_dict)
            
            solicitud_dict = {
                'id': solicitud.id,
                'nombre': solicitud.nombre,
                'edad': solicitud.edad,
                'monto': solicitud.monto,
                'historial_id': solicitud.historial_id,
                'historial_crediticio': solicitud.historial_id,
                'ingresos_mensuales': solicitud.ingresos,
                'ofertas': ofertas_solicitud
            }

            if len(ofertas_solicitud) > 0:
               resultado.append(solicitud_dict)

        return jsonify(resultado), 200

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/aceptarOferta', methods=['POST'])
def aceptar_oferta():
    try:
        data = request.json
        id_oferta = data['idOferta']

        # Consultar la oferta usando el id_oferta
        oferta = Ofertas.query.filter_by(id=id_oferta).first()

        if oferta:
            # Datos de prueba para la solicitud
            solicitud_info = {
                'nombre': 'Juan',
                'edad': 30,
                'ingresos': 2500,
                'historial_id': 1,
                'monto': 1500
            }

            # Datos de prueba para la oferta
            oferta_info = {
                'prestamista': 'Prestamista Test',
                'montoOfrecido': 1400,
                'interesOferta': 5.5,
                'tiempoPrestamo': 12
            }

            # Combinar la información de la oferta y la solicitud
            transaccion_info = {
                'solicitud': solicitud_info,
                'oferta': oferta_info
            }

            # Convertir la información combinada a un string o JSON
            transaccion_data = str(transaccion_info)

            # Convertir la información en Trytes
            trytes = TryteString.from_string(transaccion_data)

            print("llega1")
            api = Iota('https://nodes.devnet.iota.org:443')
            print("llega2")
            new_address = api.get_new_addresses(index=0, count=1)['addresses'][0]
            print("llega3")
            # Preparar la transacción
            tx = ProposedTransaction(
                address=Address(new_address),
                message=trytes,
                value=0
            )
            print("llega4")
            # Enviar la transacción a la red Tangle
            result = api.send_transfer(transfers=[tx])
            print("llega5")
            # Retornar el mensaje de éxito con el ID de la transacción
            return jsonify({'messageId': result['bundle'][0].hash})

        else:
            return jsonify({'error': 'Oferta no encontrada'}), 404

    except Exception as e:
        # Si ocurre un error, se retornará un mensaje con la descripción del mismo
        return jsonify({'error': 'Ha ocurrido un error: ' + str(e)}), 500



def desencriptar_datos(dato_encriptado_base64, nombre_contexto):
    try:
        missing_padding = len(dato_encriptado_base64) % 4
        if missing_padding:
            dato_encriptado_base64 += '=' * (4 - missing_padding)

        dato_encriptado_bytes = base64.b64decode(dato_encriptado_base64)

        contexto = cargar_contexto_secreto_tenSEAL(nombre_contexto)

        encrypted_vector = ts.ckks_vector_from(contexto, dato_encriptado_bytes)
        
        dato_desencriptado = encrypted_vector.decrypt()[0]

        rounded_data = round(dato_desencriptado, 2)
        
        if rounded_data == int(rounded_data):
            rounded_data = int(rounded_data)

        return rounded_data

    except Exception as e:
        print("Error al desencriptar:", e)
        return None


def guardar_contexto_tenSEAL(nombre):
    secret_file_path = f"keys/contexto_secreto_{nombre}.txt"
    public_file_path = f"keys/contexto_publico_{nombre}.txt"
    
    # Inicializar TenSEAL si no existe un contexto guardado
    context = ts.context(
        ts.SCHEME_TYPE.CKKS,
        poly_modulus_degree = 16384,
        coeff_mod_bit_sizes = [60, 40, 40, 40, 40, 60]
    )
    # Generar claves Galois y establecer la escala global
    context.generate_galois_keys()
    context.global_scale = 2**40

    # context = ts.context(ts.SCHEME_TYPE.BFV, poly_modulus_degree=4096, plain_modulus=1032193)
    # context.generate_galois_keys()


    # Serializar el contexto con la clave secreta y guardar en un archivo
    secret_context = context.serialize(save_secret_key=True)
    with open(secret_file_path, "wb") as f:
        f.write(secret_context)

    # Serializar solo la parte pública del contexto y guardar en un archivo
    public_context = context.serialize(save_secret_key=False)
    with open(public_file_path, "wb") as f:
        f.write(public_context)

    return secret_context, public_context


def cargar_contexto_secreto_tenSEAL(nombre):
    file_path = f"keys/contexto_secreto_{nombre}.txt"
    serialized_context = read_data(file_path)
    context = ts.context_from(serialized_context)
    return context


def cargar_contexto_publico_tenSEAL(ruta):
    # Obtén la ruta al archivo con la función existente
    # Asegúrate de que la función 'obtener_url_contexto_publico' devuelva la ruta del archivo y no una URL.
    file_path = ruta
    
    # Asegúrate de que la ruta es accesible y el archivo existe
    if not os.path.isfile(file_path):
        raise FileNotFoundError(f"No se encontró el archivo de contexto en la ruta: {file_path}")

    # Lee el contenido del archivo
    with open(file_path, "rb") as f:
        encoded_data = f.read()
    
    # Decodifica el contenido de base64
    decoded_data = base64.b64decode(encoded_data)
    
    # Deserializa el contenido para obtener el contexto público usando tenSEAL
    context_publico = ts.context_from(decoded_data)
    
    return context_publico

def read_data(file_path):
    with open(file_path, "rb") as f:
        return f.read()

def write_data(file_path, data):
    with open(file_path, "wb") as f:
        f.write(data)



def calcular_prestamo(ruta, nombre, edad_bytes, ingresos_bytes, historial_id_bytes, monto_bytes, tasa_base, factor_monto, factor_tiempo):
    # Deserializar y descodificar de Base64 para el contexto público
    context_publico = cargar_contexto_publico_tenSEAL(ruta)


    edad_encrypted = ts.ckks_vector_from(context_publico, base64.b64decode(edad_bytes))
    ingresos_encrypted = ts.ckks_vector_from(context_publico, base64.b64decode(ingresos_bytes))
    monto_encrypted = ts.ckks_vector_from(context_publico, base64.b64decode(monto_bytes))
    historial_id_encrypted = ts.ckks_vector_from(context_publico, base64.b64decode(historial_id_bytes))
    
    # Realizar cálculos encriptados
    tasa_base = float(tasa_base)
    tasa_interes = tasa_base * (historial_id_encrypted * 0.5)

    factor_monto = float(factor_monto) * 0.0001
    factor_monto = 1 + ingresos_encrypted * factor_monto 
    monto_final = monto_encrypted * factor_monto

    factor_tiempo = float(factor_tiempo) * 0.1
    tiempo = ((90 - edad_encrypted) * factor_tiempo)
    
    # Serializar los vectores encriptados usando el contexto público
    monto_final_serializado = monto_final.serialize()
    tasa_interes_serializado = tasa_interes.serialize()
    tiempo_serializado = tiempo.serialize()

    # Convertir a Base64
    monto_final_bytes = base64.b64encode(monto_final_serializado).decode("utf-8")
    tasa_interes_bytes = base64.b64encode(tasa_interes_serializado).decode("utf-8")
    tiempo_bytes = base64.b64encode(tiempo_serializado).decode("utf-8")

    return monto_final_bytes, tasa_interes_bytes, tiempo_bytes


def guardar_contexto_publico(nombre, public_context_serialized):
    # Convertir el contexto serializado a base64

    public_context_base64 = base64.b64encode(public_context_serialized).decode('utf-8')
    
    # Definir el nombre del archivo donde se guardará el contexto
    public_file_name = f"contexto_publico_{nombre}.txt"
    public_file_path = os.path.join('static', 'keys', public_file_name)
    
    # Asegurarte de que el directorio existe
    os.makedirs(os.path.dirname(public_file_path), exist_ok=True)
    
    # Guardar la cadena base64 en un archivo dentro de la carpeta 'static'
    with open(public_file_path, "w") as f:
        f.write(public_context_base64)
    
    return public_file_path


def obtener_url_contexto_publico(nombre):
    # Definir el nombre del archivo del contexto público
    public_file_name = f"contexto_publico_{nombre}.txt"
    
    # Generar una URL para ese archivo
    public_context_url = url_for('static', filename=os.path.join('keys', public_file_name), _external=True)
    public_context_url = public_context_url.replace("http://", "https://")
    
    return public_context_url


if __name__ == '__main__':
    app.run(debug=True)
